import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  userId: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  shareCode: string;
  onClose: () => void;
  onUserCountChange: (count: number) => void;
}

export default function ChatInterface({ shareCode, onClose, onUserCountChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [userId] = useState(() => `user_${Math.random().toString(36).substring(2, 15)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'join',
        shareCode,
        userId
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'chatHistory':
          setMessages(data.messages);
          break;
        case 'newMessage':
          setMessages(prev => [...prev, data.message]);
          break;
        case 'userCount':
          setUserCount(data.count);
          onUserCountChange(data.count);
          if (data.expiresAt) {
            updateTimeLeft(data.expiresAt);
          }
          break;
        case 'error':
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [shareCode, userId, onUserCountChange, toast]);

  const updateTimeLeft = (expiresAt: string) => {
    const update = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("Expired");
        onClose();
        return;
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: newMessage.trim()
    }));

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 right-4 w-80 bg-card border border-border rounded-t-lg shadow-lg transition-all duration-300 z-50" data-testid="chat-interface">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <i className="fas fa-comments text-primary"></i>
          <span className="font-medium text-foreground">Anonymous Chat</span>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
            {userCount} online
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground" data-testid="text-time-left">
            {timeLeft}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-chat"
          >
            <i className="fas fa-times text-muted-foreground"></i>
          </Button>
        </div>
      </div>
      
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-muted/30">
        <div className="text-xs text-center text-muted-foreground">
          Chat started • Expires when timer ends
        </div>
        
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-lg p-2 ${
              message.userId === userId 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border shadow-sm'
            }`}>
              <p className="text-sm" data-testid="chat-message">
                {message.message}
              </p>
              <span className="text-xs opacity-75">
                {message.userId === userId ? 'You' : 'Anonymous'} • {
                  new Date(message.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                }
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="text-sm"
            disabled={!isConnected}
            data-testid="input-message"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            data-testid="button-send"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
