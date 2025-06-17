import React, { useState, useEffect, useCallback } from 'react';
import { Users, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  projects: string[];
  tasks: number;
  isOwner: boolean;
}

interface ProjectStats {
  totalProjects: number;
  totalTasks: number;
  activeTasks: number;
}

const Team = () => {
  const { user: authUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    totalTasks: 0,
    activeTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch team members from projects and tasks
  const fetchTeamMembers = useCallback(async () => {
    if (!authUser) return;

    try {
      setLoading(true);

      // Get current user's ID
      const { data: { user: currentUser }, error: currentUserError } = 
        await supabase.auth.getUser();
      
      if (currentUserError || !currentUser) {
        console.error('Error getting current user:', currentUserError);
        return;
      }

      const currentUserId = currentUser.id;
      const currentUserEmail = currentUser.email || '';

      // Fetch projects where user is owner or team member
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, owner_id, team_members')
        .or(`owner_id.eq.${currentUserId},team_members.cs.{${currentUserId}},team_members.cs.{${currentUserEmail}}`);
      
      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        return;
      }

      if (!projects || projects.length === 0) {
        setTeamMembers([]);
        setStats({ totalProjects: 0, totalTasks: 0, activeTasks: 0 });
        return;
      }

      const projectIds = projects.map(p => p.id);

      // Fetch all tasks for these projects to get assigned_to IDs
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, assigned_to, project_id, status')
        .in('project_id', projectIds);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      }

      // Collect all unique user IDs from projects and tasks
      const allUserIds = new Set<string>();
      const userProjects = new Map<string, string[]>();
      const userTasks = new Map<string, number>();
      const userRoles = new Map<string, { isOwner: boolean; isAssignee: boolean }>();

      // Process project owners and team members
      for (const project of projects) {
        // Add project owner
        if (project.owner_id) {
          allUserIds.add(project.owner_id);
          if (!userProjects.has(project.owner_id)) {
            userProjects.set(project.owner_id, []);
          }
          userProjects.get(project.owner_id)?.push(project.name);
          userRoles.set(project.owner_id, { 
            isOwner: true, 
            isAssignee: userRoles.get(project.owner_id)?.isAssignee || false 
          });
        }

        // Add team members
        if (project.team_members && Array.isArray(project.team_members)) {
          for (const memberId of project.team_members) {
            // Only add if it's a valid UUID (user ID)
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId)) {
              allUserIds.add(memberId);
              if (!userProjects.has(memberId)) {
                userProjects.set(memberId, []);
              }
              userProjects.get(memberId)?.push(project.name);
              userRoles.set(memberId, { 
                isOwner: userRoles.get(memberId)?.isOwner || false,
                isAssignee: userRoles.get(memberId)?.isAssignee || false 
              });
            }
          }
        }
      }

      // Process task assignees
      if (tasks) {
        for (const task of tasks) {
          if (task.assigned_to) {
            allUserIds.add(task.assigned_to);
            
            // Count tasks per user
            const currentCount = userTasks.get(task.assigned_to) || 0;
            userTasks.set(task.assigned_to, currentCount + 1);

            // Mark as assignee
            const currentRole = userRoles.get(task.assigned_to) || { isOwner: false, isAssignee: false };
            userRoles.set(task.assigned_to, { 
              ...currentRole, 
              isAssignee: true 
            });

            // Add project name if not already there
            const projectName = projects.find(p => p.id === task.project_id)?.name;
            if (projectName) {
              if (!userProjects.has(task.assigned_to)) {
                userProjects.set(task.assigned_to, []);
              }
              const userProjectList = userProjects.get(task.assigned_to);
              if (userProjectList && !userProjectList.includes(projectName)) {
                userProjectList.push(projectName);
              }
            }
          }
        }
      }

      // Remove current user from the list to show only other team members
      allUserIds.delete(currentUserId);

      // Fetch user information for all collected user IDs
      const teamMembersList: TeamMember[] = [];

      for (const userId of Array.from(allUserIds)) {
        try {
          // Fetch user information using Supabase auth admin
          const { data: userData, error: userError } = 
            await supabase.auth.admin.getUserById(userId);
          
          let userEmail = '';
          let userName = '';

          if (userError || !userData.user) {
            console.warn(`Failed to fetch user for ID: ${userId}`, userError);
            userEmail = 'unknown@example.com';
            userName = 'Unknown User';
          } else {
            userEmail = userData.user.email || 'unknown@example.com';
            userName = userData.user.user_metadata?.full_name || 
                       userData.user.user_metadata?.name || 
                       userEmail.split('@')[0] || 
                       'Unknown User';
          }

          const roleInfo = userRoles.get(userId) || { isOwner: false, isAssignee: false };
          let role = 'Team Member';
          if (roleInfo.isOwner && roleInfo.isAssignee) {
            role = 'Project Owner & Task Assignee';
          } else if (roleInfo.isOwner) {
            role = 'Project Owner';
          } else if (roleInfo.isAssignee) {
            role = 'Task Assignee';
          }

          teamMembersList.push({
            id: userId,
            email: userEmail,
            name: userName,
            role: role,
            projects: [...new Set(userProjects.get(userId) || [])], // Remove duplicates
            tasks: userTasks.get(userId) || 0,
            isOwner: roleInfo.isOwner
          });
        } catch (error) {
          console.error('Error processing user:', userId, error);
          
          // Add with minimal info if user fetch fails
          const roleInfo = userRoles.get(userId) || { isOwner: false, isAssignee: false };
          teamMembersList.push({
            id: userId,
            email: 'unknown@example.com',
            name: 'Unknown User',
            role: roleInfo.isOwner ? 'Project Owner' : 'Team Member',
            projects: userProjects.get(userId) || [],
            tasks: userTasks.get(userId) || 0,
            isOwner: roleInfo.isOwner
          });
        }
      }

      // Calculate statistics
      const totalTasks = tasks ? tasks.length : 0;
      const activeTasks = tasks ? tasks.filter(task => 
        task.status && !['completed', 'cancelled'].includes(task.status.toLowerCase())
      ).length : 0;

      setTeamMembers(teamMembersList);
      setStats({
        totalProjects: projects.length,
        totalTasks: totalTasks,
        activeTasks: activeTasks
      });

    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  // Load team members on component mount
  useEffect(() => {
    if (authUser) {
      fetchTeamMembers();
    }
  }, [authUser, fetchTeamMembers]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">Contributors and team members from your projects</p>
        </div>
        <Button onClick={fetchTeamMembers} variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Refresh Team
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading team members...</p>
        </div>
      ) : teamMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{member.name}</h3>
                      {member.isOwner && (
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Project Owner" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {member.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {member.projects.length} project{member.projects.length !== 1 ? 's' : ''}
                    {member.tasks > 0 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {member.tasks} task{member.tasks !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {member.projects.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Projects:</p>
                    <div className="flex flex-wrap gap-1">
                      {member.projects.slice(0, 3).map((project, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {project}
                        </span>
                      ))}
                      {member.projects.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{member.projects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate('/chat', { 
                      state: { 
                        roomName: `chat_${member.id}`, 
                        receiverId: member.id,
                        username: authUser?.email || '' ,
                        currentUserId: authUser?.id || ''
                      } 
                    })}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No other team members found</h3>
          <p className="text-gray-600 mb-4">
            You don't have any other contributors in your projects yet. Invite team members to collaborate on your projects.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
              <div className="text-sm text-gray-600">Contributors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {teamMembers.filter(m => m.isOwner).length}
              </div>
              <div className="text-sm text-gray-600">Project Owners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalProjects}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.activeTasks}</div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;