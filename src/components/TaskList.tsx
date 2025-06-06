
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { dataService, TaskData } from '@/services/dataService';

interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Done';
}

interface TaskListProps {
  title: string;
  showAlert?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ title, showAlert }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const taskData = await dataService.getRecentTasks(user, 5);

        // Filter tasks based on the title
        let filteredTasks = taskData;
        if (title.includes('Due Today')) {
          const today = new Date().toDateString();
          filteredTasks = taskData.filter(task =>
            new Date(task.dueDate).toDateString() === today && task.status !== 'Completed'
          );
        } else if (title.includes('Overdue')) {
          const now = new Date();
          filteredTasks = taskData.filter(task =>
            new Date(task.dueDate) < now && task.status !== 'Completed'
          );
        }

        setTasks(filteredTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, title]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            {showAlert && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
            {title}
          </span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(task.status)}
                  <span className="font-medium text-gray-900">{task.title}</span>
                </div>
                <Badge className={getPriorityColor(task.priority || 'Medium')}>
                  {task.priority || 'Medium'}
                </Badge>
              </div>

              <div className="text-sm text-gray-600 mb-2">{task.projectName}</div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {task.assignedTo?.includes('@')
                        ? task.assignedTo.split('@')[0].substring(0, 2).toUpperCase()
                        : 'ME'
                      }
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-sm text-gray-500">
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No {title.toLowerCase()} found</p>
            <p className="text-sm">Great job staying on top of your tasks!</p>
          </div>
        )}


      </CardContent>
    </Card>
  );
};

export default TaskList;
