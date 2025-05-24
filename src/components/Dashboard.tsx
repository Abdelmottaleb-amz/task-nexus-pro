
import React from 'react';
import { Calendar, CheckCircle, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ProjectCard from './ProjectCard';
import TaskList from './TaskList';
import RecentActivity from './RecentActivity';

const Dashboard = () => {
  // Mock data - would come from API in real app
  const stats = [
    {
      title: 'Total Projects',
      value: '12',
      change: '+2 this month',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Tasks',
      value: '47',
      change: '+8 this week',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Due Soon',
      value: '5',
      change: 'Next 7 days',
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Team Members',
      value: '24',
      change: '+3 this month',
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  const recentProjects = [
    {
      id: '1',
      name: 'Website Redesign',
      progress: 75,
      dueDate: '2024-06-15',
      team: ['JD', 'SM', 'AK'],
      status: 'In Progress',
    },
    {
      id: '2',
      name: 'Mobile App Development',
      progress: 45,
      dueDate: '2024-07-20',
      team: ['JD', 'LM'],
      status: 'In Progress',
    },
    {
      id: '3',
      name: 'Marketing Campaign',
      progress: 90,
      dueDate: '2024-05-30',
      team: ['SM', 'RB', 'NK'],
      status: 'Nearly Complete',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Good morning, John! 👋</h1>
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
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
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
        <TaskList title="Tasks Due Today" />
        <TaskList title="Overdue Tasks" showAlert />
      </div>
    </div>
  );
};

export default Dashboard;
