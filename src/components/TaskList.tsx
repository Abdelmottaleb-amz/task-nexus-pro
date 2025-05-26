
import React from 'react';
import { CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';

interface TaskListProps {
  title: string;
  showAlert?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ title, showAlert }) => {
  const { tasks } = useTasks();
  const { user } = useAuth();

  // Filter tasks based on the title
  const filteredTasks = React.useMemo(() => {
    if (title === "My Tasks") {
      return tasks.filter(task => task.assigned_to === user?.id).slice(0, 5);
    } else if (title === "Due Soon") {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate <= nextWeek && task.status !== 'completed';
      }).slice(0, 5);
    }
    return tasks.slice(0, 5);
  }, [tasks, title, user?.id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
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
          <Badge variant="secondary">{filteredTasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
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
              
              <div className="text-sm text-gray-600 mb-2">{task.description}</div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {task.assigned_to ? 'AS' : 'UN'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {task.due_date && (
                  <span className="text-sm text-gray-500">
                    Due {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            {title === "My Tasks" ? "No tasks assigned to you yet." : "No tasks due soon."}
          </p>
        )}
        
        <Button variant="outline" className="w-full">
          View All Tasks
        </Button>
      </CardContent>
    </Card>
  );
};

export default TaskList;
