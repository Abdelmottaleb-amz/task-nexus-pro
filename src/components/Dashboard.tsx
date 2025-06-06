import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProjectCard from './ProjectCard';
import TaskList from './TaskList';
import RecentActivity from './RecentActivity';
import { useAuth } from '@/contexts/AuthContext';
import { dataService, DashboardStats, ProjectData } from '@/services/dataService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    activeTasks: 0,
    dueSoonTasks: 0,
    teamMembers: 0
  });
  const [recentProjects, setRecentProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch stats and recent projects in parallel
        const [dashboardStats, projects] = await Promise.all([
          dataService.getDashboardStats(user),
          dataService.getRecentProjects(user, 3)
        ]);

        setStats(dashboardStats);
        setRecentProjects(projects);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Stats configuration
  const statsConfig = [
    {
      title: 'Total Projects',
      value: stats.totalProjects.toString(),
      change: `${stats.activeProjects} active`,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Tasks',
      value: stats.activeTasks.toString(),
      change: `${stats.totalTasks} total`,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Due Soon',
      value: stats.dueSoonTasks.toString(),
      change: 'Next 7 days',
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Team Members',
      value: stats.teamMembers.toString(),
      change: 'Collaborators',
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good morning, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your projects today.</p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsConfig.map((stat) => {
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
          })
        )}
      </div>

      {/* Main Content Grid */}
      <div className="">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Projects</span>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/projects'}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton for projects
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))
              ) : recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={{
                      id: project.id,
                      name: project.name,
                      description: project.description,
                      progress: project.progress,
                      dueDate: project.dueDate,
                      teamMembers: project.teamMembers,
                      status: project.status,
                      taskCount: project.taskCount,
                      completedTasks: project.completedTasks
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent projects found</p>
                  <p className="text-sm">Create your first project to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
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
