import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface KanbanViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ tasks, onStatusChange }) => {
  const statuses: Task['status'][] = ['To Do', 'In Progress', 'Completed'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statuses.map((status) => (
        <div key={status} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{status}</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.filter((task) => task.status === status).map((task) => (
                <div key={task.id} className="p-4 bg-gray-50 rounded-lg shadow">
                  <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{task.description || 'No description available'}</p>
                  <div className="flex items-center justify-between">
                    <Badge>{task.status}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextStatusIndex = (statuses.indexOf(task.status) + 1) % statuses.length;
                        onStatusChange(task.id, statuses[nextStatusIndex]);
                      }}
                    >
                      Move to {statuses[(statuses.indexOf(task.status) + 1) % statuses.length]}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default KanbanView;
