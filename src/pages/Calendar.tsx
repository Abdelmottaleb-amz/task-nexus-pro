
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate: string;
  assignee: string;
  project: string;
  createdAt: string;
}

const Calendar = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  // Fetch tasks from database
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, status, due_date, project_id, assigned_to, created_at');

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      if (data) {
        // Map database fields to frontend interface
        const mappedTasks = data.map(task => ({
          id: task.id.toString(),
          title: task.title || '',
          description: task.description || '',
          status: (task.status as 'To Do' | 'In Progress' | 'Done') || 'To Do',
          dueDate: task.due_date || new Date().toISOString(),
          assignee: task.assigned_to ? `User${task.assigned_to}` : 'Unassigned',
          project: task.project_id ? `Project${task.project_id}` : 'No Project',
          createdAt: task.created_at || new Date().toISOString(),
        }));
        setTasks(mappedTasks);
      }
    } catch (err) {
      console.error('Exception in fetchTasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  // Get tasks for selected date
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  // Get upcoming tasks (next 7 days)
  const getUpcomingTasks = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= today && taskDate <= nextWeek;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const upcomingTasks = getUpcomingTasks();

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Done':
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
          <p className="text-gray-600 mt-1">Manage your schedule and task deadlines</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchTasks} variant="outline">
            Refresh Tasks
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
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
                            <CheckCircle className={`h-5 w-5 ${task.status === 'Done' ? 'text-green-500' : 'text-gray-300'}`} />
                            <div>
                              <p className={`font-medium ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
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
                              {task.assignee}
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
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </div>
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
                  {tasks.filter(t => t.status === 'Done').length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/tasks'}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Task
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/projects'}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
