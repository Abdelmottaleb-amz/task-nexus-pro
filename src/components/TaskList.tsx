
import React from 'react';
import { CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  // Mock data
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Design homepage wireframes',
      project: 'Website Redesign',
      assignee: 'JD',
      dueDate: '2024-05-25',
      priority: 'High',
      status: 'In Progress',
    },
    {
      id: '2',
      title: 'Set up authentication system',
      project: 'Mobile App',
      assignee: 'SM',
      dueDate: '2024-05-26',
      priority: 'High',
      status: 'To Do',
    },
    {
      id: '3',
      title: 'Write marketing copy',
      project: 'Marketing Campaign',
      assignee: 'AK',
      dueDate: '2024-05-24',
      priority: 'Medium',
      status: 'Done',
    },
  ];

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
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(task.status)}
                <span className="font-medium text-gray-900">{task.title}</span>
              </div>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">{task.project}</div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{task.assignee}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-sm text-gray-500">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full">
          View All Tasks
        </Button>
      </CardContent>
    </Card>
  );
};

export default TaskList;
