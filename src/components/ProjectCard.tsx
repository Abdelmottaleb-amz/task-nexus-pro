
import React from 'react';
import { Calendar, Users, MoreHorizontal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  // Mock progress for now - in a real app, this would be calculated from completed tasks
  const progress = Math.floor(Math.random() * 100);

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
          <div className="flex gap-2 mb-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{project.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Project</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-900">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          Created {new Date(project.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1" />
          <span>Team</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
