
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  Settings,
  Plus,
  Home,
  FolderOpen,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 w-64 z-40">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PM</span>
          </div>
          <span className="font-bold text-xl text-gray-900">ProjectHub</span>
        </div>
      </div>

      <div className="p-4">
        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <nav className="mt-4 px-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
