import React from 'react';
import RealtimeChat from '@/components/realtime-chat';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Chat: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { receiverId } = location.state || {};
  
  if (!user) {
    return <div className="p-4 text-red-600">Error: User not authenticated</div>;
  }

  if (!receiverId) {
    return <div className="p-4 text-red-600">Error: Missing receiver information</div>;
  }

  // Generate consistent room name using sorted user IDs
  const generateRoomName = (id1: string, id2: string) => {
    return [id1, id2].sort().join('_');
  };

  const roomName = `chat_${generateRoomName(user.id, receiverId)}`;
  const currentUserName = user.user_metadata?.full_name || user.email || 'You';

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        <RealtimeChat 
          roomName={roomName} 
          receiverId={receiverId}
          currentUserId={user.id}
          currentUserName={currentUserName}
        />
      </div>
    </div>
  );
};

export default Chat;