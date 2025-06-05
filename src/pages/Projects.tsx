import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Calendar, Users, Edit, Trash, Crown, Share2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import CreateProjectDialog from '../components/CreateProjectDialog';
import EditProjectDialog from '../components/EditProjectDialog';
import JoinProjectDialog from '../components/JoinProjectDialog';
import ShareProjectDialog from '../components/ShareProjectDialog';
import ProjectCreatedDialog from '../components/ProjectCreatedDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
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
}

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('owned');
  const [projectCreatedDialogOpen, setProjectCreatedDialogOpen] = useState(false);
  const [createdProjectData, setCreatedProjectData] = useState<{name: string, accessCode: string} | null>(null);

  const fetchProjects = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, status, progress, due_date, team_members, created_at, owner_id, access_code');

      if (error) {
        console.error('Error fetching projects:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return [];
      }

      console.log('Raw data from Supabase:', data);

      if (!data) {
        console.log('No data returned from Supabase');
        return [];
      }

      return data.map(project => ({
        id: project.id,
        name: project.name || '',
        description: project.description || '',
        status: (project.status as 'Planning' | 'In Progress' | 'On Hold' | 'Completed') || 'Planning',
        progress: project.progress || 0,
        dueDate: project.due_date || new Date().toISOString(),
        teamMembers: project.team_members || [],
        createdAt: project.created_at,
        ownerId: project.owner_id,
        accessCode: project.access_code || '',
        isOwner: project.owner_id === user.id,
      }));
    } catch (err) {
      console.error('Exception in fetchProjects:', err);
      return [];
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      const fetchedProjects = await fetchProjects();
      console.log('Fetched projects:', fetchedProjects);
      setProjects(fetchedProjects);
    };

    if (user) {
      loadProjects();
    }
  }, [user]);

  // Filter projects by ownership and team membership
  const ownedProjects = projects.filter(project => project.isOwner);
  const teamProjects = projects.filter(project =>
    !project.isOwner &&
    (project.teamMembers.includes(user?.email || '') ||
     project.teamMembers.includes(user?.id || ''))
  );

  // Generate unique access code
  const generateAccessCode = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let accessCode = '';
    let isUnique = false;

    while (!isUnique) {
      // Generate 8-character code
      accessCode = '';
      for (let i = 0; i < 8; i++) {
        accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('access_code', accessCode)
        .single();

      // If no data found, the code is unique
      if (error && error.code === 'PGRST116') {
        isUnique = true;
      }
    }

    return accessCode;
  };

  // Handle project joined callback
  const handleProjectJoined = async () => {
    const fetchedProjects = await fetchProjects();
    setProjects(fetchedProjects);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  // Get current projects based on active tab
  const getCurrentProjects = () => {
    const baseProjects = activeTab === 'owned' ? ownedProjects : teamProjects;
    return baseProjects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredProjects = getCurrentProjects();

  const handleCreateProject = async (newProject: Omit<Project, 'id' | 'createdAt' | 'ownerId' | 'isOwner' | 'accessCode'>) => {
    if (!user) return;

    try {
      // Generate unique access code
      const accessCode = await generateAccessCode();

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          description: newProject.description,
          status: newProject.status,
          progress: newProject.progress,
          due_date: newProject.dueDate,
          team_members: newProject.teamMembers,
          owner_id: user.id,
          access_code: accessCode,
        })
        .select('id, name, description, status, progress, due_date, team_members, created_at, owner_id, access_code')
        .single();

      if (error) {
        console.error('Error creating project:', error);
        alert(`Error creating project: ${error.message}`);
        return;
      }

      console.log('Project created successfully:', data);

      // Show success dialog with access code
      if (data.access_code) {
        setCreatedProjectData({
          name: data.name,
          accessCode: data.access_code
        });
        setProjectCreatedDialogOpen(true);
      }

      // Close create dialog
      setCreateDialogOpen(false);

      // Refresh the projects list
      const fetchedProjects = await fetchProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Error creating project: ${error}`);
    }
  };

  const handleEditProject = async (updatedProject: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: updatedProject.name,
          description: updatedProject.description,
          status: updatedProject.status,
          progress: updatedProject.progress,
          due_date: updatedProject.dueDate,
          team_members: updatedProject.teamMembers,
        })
        .eq('id', updatedProject.id);

      if (error) {
        console.error('Error updating project:', error);
        return;
      }

      // Refresh the projects list
      const fetchedProjects = await fetchProjects();
      setProjects(fetchedProjects);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Error deleting project:', error);
        return;
      }

      // Refresh the projects list
      const fetchedProjects = await fetchProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your projects and collaborate with your team</p>
        </div>
        <div className="flex space-x-2">
          <JoinProjectDialog onProjectJoined={handleProjectJoined} />
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="owned" className="flex items-center">
            <Crown className="mr-2 h-4 w-4" />
            My Projects ({ownedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Team Projects ({teamProjects.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters and Search */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Status: {statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('All')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Planning')}>Planning</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('In Progress')}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('On Hold')}>On Hold</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Completed')}>Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="owned" className="mt-6">
          {/* Projects Grid for Owned Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {project.isOwner && <Crown className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      {project.isOwner && project.accessCode && (
                        <ShareProjectDialog project={project} />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {project.isOwner && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProject(project);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {project.isOwner && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{project.description || 'No description available'}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due {new Date(project.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div className="flex -space-x-1">
                        {project.teamMembers.slice(0, 3).map((member, index) => (
                          <Avatar key={index} className="h-6 w-6 border-2 border-white">
                            <AvatarFallback className="text-xs">{member.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {project.accessCode && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Access Code:</span>
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {project.accessCode}
                        </code>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          {/* Projects Grid for Team Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <Users className="mr-2 h-4 w-4" />
                          Team Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{project.description || 'No description available'}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due {new Date(project.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div className="flex -space-x-1">
                        {project.teamMembers.slice(0, 3).map((member, index) => (
                          <Avatar key={index} className="h-6 w-6 border-2 border-white">
                            <AvatarFallback className="text-xs">{member.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'owned' ? 'No owned projects found' : 'No team projects found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'All'
              ? 'Try adjusting your search or filters'
              : activeTab === 'owned'
                ? 'Get started by creating your first project'
                : 'Join a project using an access code to see it here'
            }
          </p>
          {!searchTerm && statusFilter === 'All' && (
            <div className="flex justify-center space-x-2">
              {activeTab === 'owned' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
              {activeTab === 'team' && (
                <JoinProjectDialog onProjectJoined={handleProjectJoined} />
              )}
            </div>
          )}
        </div>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateProject={handleCreateProject}
      />

      {selectedProject && (
        <EditProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={selectedProject}
          onEditProject={handleEditProject}
        />
      )}

      {createdProjectData && (
        <ProjectCreatedDialog
          open={projectCreatedDialogOpen}
          onOpenChange={setProjectCreatedDialogOpen}
          projectName={createdProjectData.name}
          accessCode={createdProjectData.accessCode}
        />
      )}
    </div>
  );
};

export default Projects;
