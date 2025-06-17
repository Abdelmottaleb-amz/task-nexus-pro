import React, { useState, useEffect } from 'react';
import { CheckCircle, MessageSquare, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { dataService, ActivityData } from '@/services/dataService';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'task_completed' | 'comment' | 'member_added' | 'project_created';
  user: string;
  message: string;
  time: string;
}

const RecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const activityData = await dataService.getRecentActivity(user, 4);
        setActivities(activityData);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'task_created':
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
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3 animate-pulse">
              <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 cursor-pointer"
              onClick={() => navigate('/chat', { state: { roomName: activity.id, username: user?.email } })}
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {activity.userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900">{activity.userName}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-sm">Start creating projects and tasks to see activity here!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
