import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  room: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
}

interface RealtimeChatProps {
  roomName: string;
  receiverId: string;
  currentUserId: string;
  currentUserName: string;
}

const useChatScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  return { containerRef, scrollToBottom };
};

const ChatMessageItem = ({ 
  message, 
  isOwnMessage, 
  showHeader 
}: { 
  message: ChatMessage; 
  isOwnMessage: boolean; 
  showHeader: boolean; 
}) => {
  return (
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] w-fit flex flex-col gap-1 ${isOwnMessage ? 'items-end' : ''}`}>
        {showHeader && (
          <div className={`flex items-center gap-2 text-xs px-3 ${
            isOwnMessage ? 'justify-end flex-row-reverse' : ''
          }`}>
            <span className="font-medium">
              {isOwnMessage ? 'You' : message.sender_name || message.sender_id}
            </span>
            <span className="text-muted-foreground text-xs">
              {new Date(message.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div className={`py-2 px-3 rounded-xl text-sm w-fit ${
          isOwnMessage 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-foreground'
        }`}>
          {message.content}
        </div>
      </div>
    </div>
  );
};

const RealtimeChat: React.FC<RealtimeChatProps> = ({ 
  roomName, 
  receiverId,
  currentUserId,
  currentUserName,
}) => {
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { containerRef, scrollToBottom } = useChatScroll();

  const allMessages = useMemo(() => {
    const uniqueMessages = realtimeMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    );
    return uniqueMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [realtimeMessages]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('room', roomName)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data) {
          setRealtimeMessages(data);
          console.log('Initial messages loaded:', data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [roomName]);

  // Realtime subscription
  useEffect(() => {
    console.log(`Subscribing to room: ${roomName}`);
    const channel = supabase.channel(`room:${roomName}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room=eq.${roomName}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        console.log('Realtime event received:', newMsg);

        setRealtimeMessages(prev => {
          // Skip if message already exists
          if (prev.some(msg => msg.id === newMsg.id)) return prev;
          
          // Skip if this is our own optimistic message
          if (newMsg.id.startsWith('optimistic-')) return prev;
          
          return [...prev, newMsg];
        });
      })
      .subscribe((status) => {
        console.log(`Realtime status: ${status}`);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Unsubscribing from channel');
      supabase.removeChannel(channel);
    };
  }, [roomName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [allMessages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentUserId) return;

    setIsSending(true);
    
    // Optimistic UI update
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content: newMessage.trim(),
      sender_id: currentUserId,
      receiver_id: receiverId,
      room: roomName,
      created_at: new Date().toISOString(),
      sender_name: currentUserName,
    };

    setRealtimeMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          content: newMessage.trim(),
          sender_id: currentUserId,
          receiver_id: receiverId,
          room: roomName,
          sender_name: currentUserName,
        }])
        .select();

      if (error) throw error;

      // Replace optimistic message with real message
      if (data && data[0]) {
        setRealtimeMessages(prev => 
          prev.map(msg => msg.id === tempId ? data[0] : msg)
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setRealtimeMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setIsSending(false);
    }
  }, [newMessage, currentUserId, receiverId, roomName, currentUserName]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  }, [sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {allMessages.length} message{allMessages.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const showHeader = !prevMessage || prevMessage.sender_id !== message.sender_id;
            const isOwnMessage = message.sender_id === currentUserId;

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-border p-4">
        <Input
          className={`rounded-full bg-background text-sm transition-all duration-300 ${
            isConnected && newMessage.trim() ? 'w-[calc(100%-48px)]' : 'w-full'
          }`}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected || isSending || !currentUserId}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected || isSending || !currentUserId}
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </form>
    </div>
  );
};

export default RealtimeChat;