
import React, { useState } from 'react';
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
import CreateTaskDialog from '../components/CreateTaskDialog';
import EditTaskDialog from '../components/EditTaskDialog';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  project: string;
  dueDate: string;
  createdAt: string;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design homepage wireframes',
      description: 'Create detailed wireframes for the new homepage layout',
      status: 'In Progress',
      priority: 'High',
      assignee: 'JD',
      project: 'Website Redesign',
      dueDate: '2024-05-25',
      createdAt: '2024-05-20',
    },
    {
      id: '2',
      title: 'Set up authentication system',
      description: 'Implement user login and registration functionality',
      status: 'To Do',
      priority: 'High',
      assignee: 'SM',
      project: 'Mobile App',
      dueDate: '2024-05-26',
      createdAt: '2024-05-21',
    },
    {
      id: '3',
      title: 'Write marketing copy',
      description: 'Create compelling copy for the marketing campaign',
      status: 'Done',
      priority: 'Medium',
      assignee: 'AK',
      project: 'Marketing Campaign',
      dueDate: '2024-05-24',
      createdAt: '2024-05-18',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, task]);
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track individual tasks</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
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
            <DropdownMenuItem onClick={() => setStatusFilter('Done')}>Done</DropdownMenuItem>
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
                      onClick={() => handleStatusChange(task.id, task.status === 'Done' ? 'To Do' : 'Done')}
                      className="p-0 h-6 w-6"
                    >
                      <CheckCircle className={`h-5 w-5 ${task.status === 'Done' ? 'text-green-500' : 'text-gray-300'}`} />
                    </Button>
                    <h3 className={`font-semibold text-lg ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">{task.assignee}</AvatarFallback>
                      </Avatar>
                      {task.assignee}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <div>Project: {task.project}</div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedTask(task);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              : 'Get started by creating your first task'
            }
          </p>
          {!searchTerm && statusFilter === 'All' && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
      )}

      <CreateTaskDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateTask={handleCreateTask}
      />

      {selectedTask && (
        <EditTaskDialog 
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          task={selectedTask}
          onEditTask={handleEditTask}
        />
      )}
    </div>
  );
};

export default Tasks;
