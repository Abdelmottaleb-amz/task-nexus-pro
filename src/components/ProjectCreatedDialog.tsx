import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Share2, Crown } from 'lucide-react';

interface ProjectCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  accessCode: string;
}

const ProjectCreatedDialog: React.FC<ProjectCreatedDialogProps> = ({
  open,
  onOpenChange,
  projectName,
  accessCode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy access code:', err);
    }
  };

  const handleCopyInviteMessage = async () => {
    const inviteMessage = `Hi! I've created a new project "${projectName}" in Task Nexus Pro and would like to invite you to collaborate.

To join the project:
1. Go to the Projects page in Task Nexus Pro
2. Click "Join Project"
3. Enter this access code: ${accessCode}

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Crown className="mr-2 h-5 w-5 text-yellow-500" />
            Project Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Your project "{projectName}" has been created. Share the access code below to invite team members.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Success Alert */}
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Project created successfully! You are now the owner of this project.
            </AlertDescription>
          </Alert>

          {/* Access Code Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Access Code</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-100 rounded-md border">
                <code className="text-lg font-mono tracking-wider text-center block">
                  {accessCode}
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
              <p>• Share the access code above with your team members</p>
              <p>• They can join by clicking "Join Project" and entering the code</p>
              <p>• Once joined, they'll have access to view and collaborate on this project</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyInviteMessage}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Copy Invitation Message
            </Button>
            
            <Button
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Continue to Projects
            </Button>
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
              <strong>Note:</strong> Keep this access code secure. Anyone with this code can join your project.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreatedDialog;
