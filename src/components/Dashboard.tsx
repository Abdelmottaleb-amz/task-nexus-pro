
import React from 'react';
import { Calendar, CheckCircle, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import ProjectCard from './ProjectCard';
import TaskList from './TaskList';
import RecentActivity from './RecentActivity';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, isLoading: tasksLoading } = useTasks();

  // Calculate statistics from real data
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const activeTasks = tasks.filter(t => t.status !== 'completed').length;
  const dueSoonTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return dueDate <= nextWeek && t.status !== 'completed';
  }).length;

  const stats = [
    {
      title: 'Active Projects',
      value: activeProjects.toString(),
      change: `${projects.length} total`,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Tasks',
      value: activeTasks.toString(),
      change: `${tasks.length} total`,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Due Soon',
      value: dueSoonTasks.toString(),
      change: 'Next 7 days',
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'My Tasks',
      value: tasks.filter(t => t.assigned_to === user?.id).length.toString(),
      change: 'Assigned to me',
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  const recentProjects = projects.slice(0, 3);

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good morning, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your projects today.</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <TrendingUp className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Projects</span>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No projects yet. Create your first project to get started!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Create Project
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" />
                Add Task
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Invite Team Member
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </div>

      {/* Task Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskList title="My Tasks" />
        <TaskList title="Due Soon" showAlert />
      </div>
    </div>
  );
};

export default Dashboard;
