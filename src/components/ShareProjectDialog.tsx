import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Share2, Copy, Check } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  accessCode?: string;
}

interface ShareProjectDialogProps {
  project: Project;
}

const ShareProjectDialog: React.FC<ShareProjectDialogProps> = ({ project }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (project.accessCode) {
      try {
        await navigator.clipboard.writeText(project.accessCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy access code:', err);
      }
    }
  };

  const handleCopyInviteMessage = async () => {
    const inviteMessage = `Hi! I'd like to invite you to collaborate on my project "${project.name}" in Task Nexus Pro.

To join:
1. Go to the Projects page
2. Click "Join Project"
3. Enter this access code: ${project.accessCode}

Looking forward to working together!`;

    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite message:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Share this access code with team members to give them access to "{project.name}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {project.accessCode ? (
            <>
              {/* Access Code Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Access Code</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-gray-100 rounded-md border">
                    <code className="text-lg font-mono tracking-wider text-center block">
                      {project.accessCode}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <label className="text-sm font-medium">How to share</label>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>1. Share the access code above with your team members</p>
                  <p>2. They can join by clicking "Join Project" and entering the code</p>
                  <p>3. Once joined, they'll have access to view and collaborate on this project</p>
                </div>
              </div>

              {/* Copy Invite Message */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyInviteMessage}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Invitation Message
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Copies a ready-to-send invitation message
                </p>
              </div>

              {copied && (
                <Alert className="border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Copied to clipboard!
                  </AlertDescription>
                </Alert>
              )}

              {/* Security Note */}
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> Anyone with this access code can join your project. 
                  Only share it with trusted team members.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                No access code available for this project. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProjectDialog;
