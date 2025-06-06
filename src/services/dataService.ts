import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  activeTasks: number;
  dueSoonTasks: number;
  teamMembers: number;
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  progress: number;
  dueDate: string;
  teamMembers: string[];
  createdAt: string;
  ownerId: string;
  accessCode?: string;
  isOwner?: boolean;
  taskCount?: number;
  completedTasks?: number;
}

export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  dueDate: string;
  assignedTo: string | null;
  projectId: string;
  projectName?: string;
  createdAt: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface ActivityData {
  id: string;
  type: 'task_completed' | 'task_created' | 'project_created' | 'member_added';
  userId: string;
  userName: string;
  message: string;
  time: string;
  projectId?: string;
  taskId?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role?: string;
}

class DataService {
  // Fetch dashboard statistics
  async getDashboardStats(user: User): Promise<DashboardStats> {
    try {
      // Get projects where user is owner or team member
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, status, team_members, owner_id')
        .or(`owner_id.eq.${user.id},team_members.cs.{${user.email}},team_members.cs.{${user.id}}`);

      if (projectsError) throw projectsError;

      // Get tasks assigned to user
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, due_date')
        .or(`assigned_to.eq.${user.email},assigned_to.eq.${user.id}`);

      if (tasksError) throw tasksError;

      // Calculate stats
      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'In Progress').length || 0;
      const totalTasks = tasks?.length || 0;
      const activeTasks = tasks?.filter(t => t.status !== 'Completed').length || 0;
      
      // Tasks due in next 7 days
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const dueSoonTasks = tasks?.filter(t => 
        t.due_date && 
        new Date(t.due_date) <= nextWeek && 
        t.status !== 'Completed'
      ).length || 0;

      // Count unique team members
      const allMembers = new Set<string>();
      projects?.forEach(project => {
        if (project.team_members) {
          project.team_members.forEach(member => allMembers.add(member));
        }
        if (project.owner_id !== user.id) {
          allMembers.add(project.owner_id);
        }
      });

      return {
        totalProjects,
        activeProjects,
        totalTasks,
        activeTasks,
        dueSoonTasks,
        teamMembers: allMembers.size
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalProjects: 0,
        activeProjects: 0,
        totalTasks: 0,
        activeTasks: 0,
        dueSoonTasks: 0,
        teamMembers: 0
      };
    }
  }

  // Fetch recent projects
  async getRecentProjects(user: User, limit: number = 3): Promise<ProjectData[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .or(`owner_id.eq.${user.id},team_members.cs.{${user.email}},team_members.cs.{${user.id}}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!projects) return [];

      // Get task counts for each project
      const projectsWithTasks = await Promise.all(
        projects.map(async (project) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, status')
            .eq('project_id', project.id);

          const taskCount = tasks?.length || 0;
          const completedTasks = tasks?.filter(t => t.status === 'Completed').length || 0;

          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            status: project.status as 'Planning' | 'In Progress' | 'On Hold' | 'Completed',
            progress: project.progress || 0,
            dueDate: project.due_date || new Date().toISOString(),
            teamMembers: project.team_members || [],
            createdAt: project.created_at,
            ownerId: project.owner_id,
            accessCode: project.access_code || '',
            isOwner: project.owner_id === user.id,
            taskCount,
            completedTasks
          };
        })
      );

      return projectsWithTasks;
    } catch (error) {
      console.error('Error fetching recent projects:', error);
      return [];
    }
  }

  // Fetch recent tasks
  async getRecentTasks(user: User, limit: number = 5): Promise<TaskData[]> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          due_date,
          assigned_to,
          project_id,
          created_at,
          projects (
            name
          )
        `)
        .or(`assigned_to.eq.${user.email},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!tasks) return [];

      return tasks.map(task => ({
        id: task.id.toString(),
        title: task.title || '',
        description: task.description || '',
        status: task.status as 'To Do' | 'In Progress' | 'Completed',
        dueDate: task.due_date || new Date().toISOString(),
        assignedTo: task.assigned_to,
        projectId: task.project_id?.toString() || '',
        projectName: (task.projects as any)?.name || 'Unknown Project',
        createdAt: task.created_at,
        priority: 'Medium' // Default priority since it's not in the schema
      }));
    } catch (error) {
      console.error('Error fetching recent tasks:', error);
      return [];
    }
  }

  // Fetch users from the users table
  async getUsers(): Promise<UserData[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name');

      if (error) throw error;

      if (!users) return [];

      return users.map(user => ({
        id: user.id.toString(),
        name: user.name || user.email || 'Unknown User',
        email: user.email || '',
        role: user.role || 'user'
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Generate mock recent activity (since we don't have an activity table yet)
  async getRecentActivity(user: User, limit: number = 4): Promise<ActivityData[]> {
    try {
      // Get recent tasks and projects for activity
      const recentTasks = await this.getRecentTasks(user, 3);
      const recentProjects = await this.getRecentProjects(user, 2);

      const activities: ActivityData[] = [];

      // Add task activities
      recentTasks.forEach((task, index) => {
        activities.push({
          id: `task-${task.id}`,
          type: task.status === 'Completed' ? 'task_completed' : 'task_created',
          userId: user.id,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
          message: task.status === 'Completed' 
            ? `completed "${task.title}" task`
            : `created "${task.title}" task`,
          time: this.getRelativeTime(task.createdAt),
          projectId: task.projectId,
          taskId: task.id
        });
      });

      // Add project activities
      recentProjects.forEach((project, index) => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project_created',
          userId: user.id,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
          message: `created project "${project.name}"`,
          time: this.getRelativeTime(project.createdAt),
          projectId: project.id
        });
      });

      // Sort by time and limit
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error generating recent activity:', error);
      return [];
    }
  }

  private getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
}

export const dataService = new DataService();
