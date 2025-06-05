
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Calendar, User, Edit, Trash, CheckCircle } from 'lucide-react';
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
  project_name?: string;
  created_at?: string;
}

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');



  // Fetch tasks assigned to current user
  const fetchTasks = async () => {
    if (!user) return [];

    try {
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
            name
          )
        `)
        .or(`assigned_to.eq.${user.email},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tasks:', error);
        return [];
      }

      console.log('Raw user tasks data from Supabase:', data);

      if (!data) {
        console.log('No user tasks data returned from Supabase');
        return [];
      }

      // Map database fields to frontend interface
      return data.map(task => ({
        id: task.id,
        title: task.title || '',
        description: task.description || '',
        status: (task.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
        due_date: task.due_date || new Date().toISOString(),
        assigned_to: task.assigned_to,
        project_id: task.project_id,
        project_name: task.projects?.name || 'Unknown Project',
        created_at: task.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Exception in fetchTasks:', err);
      return [];
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    const loadTasks = async () => {
      const fetchedTasks = await fetchTasks();
      console.log('Fetched user tasks:', fetchedTasks);
      setTasks(fetchedTasks);
    };

    if (user) {
      loadTasks();
    }
  }, [user]);

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



  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });







  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task status:', error);
        alert(`Error updating task status: ${error.message}`);
        return;
      }

      // Refresh the tasks list
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(`Error updating task status: ${error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">Tasks assigned to you across all projects</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
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
            <DropdownMenuItem onClick={() => setStatusFilter('To Do')}>To Do</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('In Progress')}>In Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('Completed')}>Completed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(task.id, task.status === 'Completed' ? 'To Do' : 'Completed')}
                      className="p-0 h-6 w-6"
                    >
                      <CheckCircle className={`h-5 w-5 ${task.status === 'Completed' ? 'text-green-500' : 'text-gray-300'}`} />
                    </Button>
                    <h3 className={`font-semibold text-lg ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{task.description || 'No description available'}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">
                          {task.assigned_to ? task.assigned_to.substring(0, 2).toUpperCase() : 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      {task.assigned_to ? (task.assigned_to.includes('@') ? task.assigned_to.split('@')[0] : task.assigned_to) : 'Unassigned'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </div>
                    <div>Project: {task.project_name}</div>
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by joining a project'
            }
          </p>
        </div>
      )}


    </div>
  );
};

export default Tasks;
