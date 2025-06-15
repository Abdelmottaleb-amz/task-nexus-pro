import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id?: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  due_date: string;
  assigned_to: string | null;
  project_id: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: Omit<Task, 'id'>) => Promise<void>;
  projectId: string;
  teamMembers: string[]; // Array of user IDs or emails
  ownerEmail?: string;
  ownerId?: string; // Add owner ID
  task?: Task | null;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  onCreateTask,
  projectId,
  teamMembers,
  ownerEmail,
  ownerId,
  task
}) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'To Do' as 'To Do' | 'In Progress' | 'Completed',
    due_date: task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
    assigned_to: task?.assigned_to ? task.assigned_to : 'unassigned'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Helper function to validate UUID format
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Fetch user profiles when dialog opens or team members change
  useEffect(() => {
    if (open && (teamMembers.length > 0 || ownerId || ownerEmail)) {
      fetchUserProfiles();
    }
  }, [open, teamMembers, ownerId, ownerEmail]);

  const fetchUserProfiles = async () => {
    setFetchingUsers(true);
    const profiles: UserProfile[] = [];
    
    try {
      // Create array of all user identifiers (owner + team members)
      const allUserIdentifiers = [
        ...(ownerId ? [ownerId] : []),
        ...(ownerEmail && !ownerId ? [ownerEmail] : []),
        ...teamMembers
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

      console.log('Fetching profiles for identifiers:', allUserIdentifiers);

      // Fetch each user's profile
      for (const identifier of allUserIdentifiers) {
        try {
          let userData, userError;

          // Check if identifier is a UUID or email
          if (isValidUUID(identifier)) {
            // It's a UUID, use getUserById
            console.log(`Fetching user profile by ID: ${identifier}`);
            const result = await supabase.auth.admin.getUserById(identifier);
            userData = result.data;
            userError = result.error;
          } else if (identifier.includes('@')) {
            // It's an email, use listUsers with email filter
            console.log(`Fetching user profile by email: ${identifier}`);
            const { data: usersData, error } = await supabase.auth.admin.listUsers();
            
            if (error) {
              userError = error;
            } else {
              // Find user by email
              const foundUser = usersData.users.find(user => user.email === identifier);
              if (foundUser) {
                userData = { user: foundUser };
              } else {
                console.warn(`User not found with email: ${identifier}`);
                continue;
              }
            }
          } else {
            console.error(`Invalid identifier format: ${identifier}`);
            continue;
          }
          
          if (userError) {
            console.error(`Error fetching user ${identifier}:`, userError);
            continue;
          }

          if (userData?.user) {
            profiles.push({
              id: userData.user.id,
              email: userData.user.email || '',
              full_name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || null
            });
            console.log(`Successfully fetched profile for ${userData.user.email}`);
          }
        } catch (err) {
          console.error(`Error fetching user ${identifier}:`, err);
        }
      }

      console.log('Final user profiles:', profiles);
      setUserProfiles(profiles);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        due_date: formData.due_date || new Date().toISOString(),
        assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to,
        project_id: projectId
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        status: 'To Do',
        due_date: '',
        assigned_to: 'unassigned'
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const getUserDisplayName = (profile: UserProfile) => {
    if (profile.full_name) {
      return profile.full_name;
    }
    // Fallback to email username if no full name
    return profile.email.split('@')[0];
  };

  const isOwner = (userId: string) => {
    return ownerId === userId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {task ? 'Update the task details below.' : 'Add a new task to this project and assign it to a team member.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => handleInputChange('assigned_to', value)}
              disabled={fetchingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder={fetchingUsers ? "Loading users..." : "Select team member"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {userProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {getUserDisplayName(profile)}
                      {isOwner(profile.id) && ' (Owner)'}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {task ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  {task ? 'Update Task' : 'Create Task'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;