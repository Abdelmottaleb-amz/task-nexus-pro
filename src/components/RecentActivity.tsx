
import React from 'react';
import { CheckCircle, MessageSquare, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Activity {
  id: string;
  type: 'task_completed' | 'comment' | 'member_added' | 'project_created';
  user: string;
  message: string;
  time: string;
}

const RecentActivity = () => {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'task_completed',
      user: 'JD',
      message: 'completed "Homepage Design" task',
      time: '2 hours ago',
    },
    {
      id: '2',
      type: 'comment',
      user: 'SM',
      message: 'commented on "API Integration"',
      time: '4 hours ago',
    },
    {
      id: '3',
      type: 'member_added',
      user: 'AK',
      message: 'added new member to "Website Redesign"',
      time: '1 day ago',
    },
    {
      id: '4',
      type: 'project_created',
      user: 'LM',
      message: 'created new project "Mobile App V2"',
      time: '2 days ago',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'member_added':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'project_created':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{activity.user}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">{activity.user}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{activity.message}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
