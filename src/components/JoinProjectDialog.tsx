import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface JoinProjectDialogProps {
  onProjectJoined: () => void;
}

const JoinProjectDialog: React.FC<JoinProjectDialogProps> = ({ onProjectJoined }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    if (!user) {
      setError('You must be logged in to join a project');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const codeToFind = accessCode.trim().toUpperCase();

      // Find project by access code
      const { data: project, error: findError } = await supabase
        .from('projects')
        .select('id, name, team_members, owner_id')
        .eq('access_code', codeToFind)
        .single();

      if (findError || !project) {
        setError('Invalid access code. Please check and try again.');
        return;
      }

      // Check if user is already a member or owner
      const userEmail = user.email || '';
      const userId = user.id || '';

      if (project.owner_id === userId) {
        setError('You are already the owner of this project');
        return;
      }

      if (project.team_members &&
          (project.team_members.includes(userEmail) || project.team_members.includes(userId))) {
        setError('You are already a member of this project');
        return;
      }

      // Add user to team members
      const updatedMembers = [...(project.team_members || []), userEmail];

      const { error: updateError } = await supabase
        .from('projects')
        .update({ team_members: updatedMembers })
        .eq('id', project.id);

      if (updateError) {
        setError('Failed to join project. Please try again.');
        return;
      }

      setSuccess(`Successfully joined project: ${project.name}`);
      setAccessCode('');
      onProjectJoined();
      setTimeout(() => {
        setOpen(false);
        setSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Error joining project:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setAccessCode('');
    setError('');
    setSuccess('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Join Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Project</DialogTitle>
          <DialogDescription>
            Enter the access code shared by the project owner to join their project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleJoinProject} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input
              id="accessCode"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code (e.g., ABC12345)"
              maxLength={8}
              className="font-mono text-center text-lg tracking-wider"
              required
            />
            <p className="text-xs text-gray-500">
              Access codes are 8 characters long and case-insensitive
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </div>
              ) : (
                <div className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Project
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinProjectDialog;
