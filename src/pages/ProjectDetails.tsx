import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Calendar, CheckCircle, Clock, AlertCircle, User, Edit, Trash, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  due_date: string;
  assigned_to: string | null;
  project_id: string;
  created_at?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  progress: number;
  due_date: string;
  team_members: string[];
  created_at: string;
  owner_id: string;
  access_code: string;
  isOwner: boolean;
}

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (projectId && user) {
      fetchProjectDetails();
      fetchTasks();
    }
  }, [projectId, user]);

  const fetchProjectDetails = async () => {
    if (!projectId || !user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        navigate('/projects');
        return;
      }

      const projectData = {
        ...data,
        status: data.status as 'Planning' | 'In Progress' | 'On Hold' | 'Completed',
        due_date: data.due_date || new Date().toISOString(),
        description: data.description || '',
        progress: data.progress || 0,
        access_code: data.access_code || '',
        isOwner: data.owner_id === user.id,
        team_members: data.team_members || []
      };



      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/projects');
    }
  };

  const fetchTasks = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          due_date: taskData.due_date,
          assigned_to: taskData.assigned_to,
          project_id: taskData.project_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }

      // Refresh tasks
      await fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      // Refresh tasks
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }

      // Refresh tasks
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
      case 'Planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-gray-100 text-gray-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'To Do':
        return <Clock className="h-4 w-4" />;
      case 'In Progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'Completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getAssignedUserName = (assignedTo: string | null) => {
    if (!assignedTo) return 'Unassigned';
    if (assignedTo === user?.id) return 'You';
    if (assignedTo === user?.email) return 'You';
    return assignedTo.includes('@') ? assignedTo.split('@')[0] : assignedTo;
  };

  const tasksByStatus = {
    'To Do': tasks.filter(task => task.status === 'To Do'),
    'In Progress': tasks.filter(task => task.status === 'In Progress'),
    'Completed': tasks.filter(task => task.status === 'Completed')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
          {project.isOwner && (
            <Button onClick={() => {
              console.log('Add Task button clicked');
              console.log('Current createTaskDialogOpen state:', createTaskDialogOpen);
              setCreateTaskDialogOpen(true);
              console.log('Setting createTaskDialogOpen to true');
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
          {!project.isOwner && (
            <div className="text-sm text-gray-500">
              Only project owners can add tasks
            </div>
          )}
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{project.progress}%</span>
                <span className="text-sm text-gray-500">Complete</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-semibold">
                {new Date(project.due_date).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-semibold">{project.team_members.length + 1}</span>
              <span className="text-sm text-gray-500">members</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="team">Team ({project.team_members.length + 1})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          {/* Task Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    {getStatusIcon(status)}
                    <span className="ml-2">{status}</span>
                    <Badge variant="secondary" className="ml-2">
                      {statusTasks.length}
                    </Badge>
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            {project.isOwner && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setCreateTaskDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteTask(task.id)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {getAssignedUserName(task.assigned_to)}
                              </span>
                            </div>
                            {task.due_date && (
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No {status.toLowerCase()} tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          {/* Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Team Members</h3>
              {project.isOwner && (
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Project Owner */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {user?.email?.substring(0, 2).toUpperCase() || 'OW'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {project.owner_id === user?.id ? 'You' : 'Project Owner'}
                      </p>
                      <p className="text-sm text-gray-500">Owner</p>
                    </div>
                    <Badge variant="secondary">Owner</Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Team Members */}
              {project.team_members.map((member, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {member === user?.email ? 'You' : member.split('@')[0]}
                        </p>
                        <p className="text-sm text-gray-500">Member</p>
                      </div>
                      <Badge variant="outline">Member</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Task Dialog */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={(open) => {
          console.log('CreateTaskDialog onOpenChange called with:', open);
          setCreateTaskDialogOpen(open);
          if (!open) setSelectedTask(null);
        }}
        onCreateTask={selectedTask ?
          async (taskData) => {
            console.log('Updating task:', taskData);
            await handleUpdateTask(selectedTask.id, taskData);
            setSelectedTask(null);
          } :
          async (taskData) => {
            console.log('Creating new task:', taskData);
            await handleCreateTask(taskData);
          }
        }
        projectId={projectId || ''}
        teamMembers={project?.team_members || []}
        ownerEmail={user?.email}
        task={selectedTask}
      />
    </div>
  );
};

export default ProjectDetails;
