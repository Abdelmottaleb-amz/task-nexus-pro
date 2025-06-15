import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  due_date: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  project_id: string;
  project_name?: string;
  created_at?: string;
}

const Calendar = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  
  // Use ref for cache to avoid recreating functions
  const userCacheRef = useRef<Record<string, string>>({});

  // Fetch tasks from projects where user is involved
  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          due_date,
          project_id,
          assigned_to,
          created_at,
          projects (
            name,
            owner_id,
            team_members
          )
        `)
        .not('projects', 'is', null)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching calendar tasks:', error);
        return;
      }

      if (data) {
        // Filter tasks from projects where user is involved (owner or team member)
        const userTasks = data.filter(task => {
          if (!task.projects) return false;

          const isOwner = task.projects.owner_id === user.id;
          const isTeamMember = task.projects.team_members &&
            (task.projects.team_members.includes(user.email) ||
             task.projects.team_members.includes(user.id));

          return isOwner || isTeamMember;
        });

        // Helper function to get user name
        const getUserName = async (userId: string): Promise<string> => {
          // Check cache first
          if (userCacheRef.current[userId]) {
            return userCacheRef.current[userId];
          }
          
          try {
            // First try to get name from auth.users table
            const { data: authUser } = await supabase.auth.admin.getUserById(userId);
            if (authUser?.user?.user_metadata?.full_name) {
              const name = authUser.user.user_metadata.full_name;
              userCacheRef.current[userId] = name;
              return name;
            } 
            
            // If not found in auth, try public.users table
            const { data: publicUser } = await supabase
              .from('users')
              .select('name')
              .eq('id', userId)
              .single();
            
            if (publicUser?.name) {
              userCacheRef.current[userId] = publicUser.name;
              return publicUser.name;
            }
            
            // Fallback to user ID
            return userId;
          } catch (err) {
            console.error('Error fetching user:', err);
            return userId;
          }
        };

        // Map database fields to frontend interface
        const mappedTasks = await Promise.all(userTasks.map(async task => {
          let assignedName = 'Unassigned';
          
          if (task.assigned_to) {
            assignedName = await getUserName(task.assigned_to);
          }

          return {
            id: task.id.toString(),
            title: task.title || '',
            description: task.description || '',
            status: (task.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
            due_date: task.due_date || new Date().toISOString(),
            assigned_to: task.assigned_to ? task.assigned_to.toString() : null,
            assigned_to_name: task.assigned_to ? assignedName : null,
            project_id: task.project_id.toString(),
            project_name: task.projects?.name || 'Unknown Project',
            created_at: task.created_at || new Date().toISOString(),
          };
        }));

        setTasks(mappedTasks);
      }
    } catch (err) {
      console.error('Exception in fetchTasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load tasks on component mount
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);
  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  // Get tasks for selected date
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  // Get upcoming tasks (next 7 days)
  const getUpcomingTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time part
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate >= today && taskDate <= nextWeek;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const upcomingTasks = getUpcomingTasks();

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if a date has tasks
  const dateHasTasks = (date: Date) => {
    return getTasksForDate(date).length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">View task deadlines from your projects</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchTasks} variant="outline">
            Refresh Tasks
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasTasks: (date) => dateHasTasks(date),
                  }}
                  modifiersStyles={{
                    hasTasks: {
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      fontWeight: 'bold',
                    },
                  }}
                />
              </div>

              {/* Tasks for Selected Date */}
              {selectedDate && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Tasks for {selectedDate.toLocaleDateString()}
                  </h3>
                  {selectedDateTasks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className={`h-5 w-5 ${task.status === 'Completed' ? 'text-green-500' : 'text-gray-300'}`} />
                            <div>
                              <p className={`font-medium ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </p>
                              <p className="text-sm text-gray-600">{task.description || 'No description'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-4 w-4 mr-1" />
                              {task.assigned_to_name || 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No tasks scheduled for this date</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading tasks...</p>
                </div>
              ) : upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="border-l-4 border-blue-500 pl-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{task.title}</p>
                        <Badge className={getStatusColor(task.status)} variant="secondary">
                          {task.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </div>
                      {task.assigned_to_name && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <User className="h-3 w-3 mr-1" />
                          {task.assigned_to_name}
                        </div>
                      )}
                    </div>
                  ))}
                  {upcomingTasks.length > 5 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{upcomingTasks.length - 5} more tasks
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No upcoming tasks
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Task Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="font-semibold">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">To Do</span>
                <span className="font-semibold text-gray-600">
                  {tasks.filter(t => t.status === 'To Do').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-semibold text-blue-600">
                  {tasks.filter(t => t.status === 'In Progress').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">
                  {tasks.filter(t => t.status === 'Completed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;