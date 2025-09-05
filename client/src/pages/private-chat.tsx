import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/chat-interface";

interface PrivateChatSession {
  code: string;
  expiresAt: string;
}

export default function PrivateChatPage() {
  const [, setLocation] = useLocation();
  const [chatCode, setChatCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [currentSession, setCurrentSession] = useState<PrivateChatSession | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  const createChatMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/private-chat', {});
    },
    onSuccess: (data: any) => {
      setCurrentSession(data.session);
      setShowChat(true);
      toast({
        title: "Success",
        description: "Private chat room created!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const joinChatMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('GET', `/api/private-chat/${code.toUpperCase()}`, {});
    },
    onSuccess: (data: any) => {
      setCurrentSession(data);
      setShowChat(true);
      toast({
        title: "Success",
        description: "Joined private chat room!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Chat room not found or expired",
        variant: "destructive",
      });
    },
  });

  const handleJoinChat = () => {
    if (!chatCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chat code",
        variant: "destructive",
      });
      return;
    }
    joinChatMutation.mutate(chatCode.trim());
  };

  const handleCreateChat = () => {
    createChatMutation.mutate();
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fas fa-comments text-primary text-xl"></i>
              <h1 className="text-xl font-semibold text-foreground">Private Chat</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/')}
              data-testid="button-home"
            >
              <i className="fas fa-home mr-2"></i>Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!showChat ? (
          <div className="space-y-6">
            {/* Create New Chat */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium mb-4 text-foreground flex items-center">
                  <i className="fas fa-plus-circle text-primary mr-2"></i>Create New Chat Room
                </h2>
                <p className="text-muted-foreground mb-4">
                  Start a new private chat room that expires in 2 hours. Share the code with others to let them join.
                </p>
                <Button
                  onClick={handleCreateChat}
                  disabled={createChatMutation.isPending}
                  className="w-full"
                  data-testid="button-create-chat"
                >
                  {createChatMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-plus mr-2"></i>
                  )}
                  {createChatMutation.isPending ? 'Creating...' : 'Create Chat Room'}
                </Button>
              </CardContent>
            </Card>

            {/* Join Existing Chat */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium mb-4 text-foreground flex items-center">
                  <i className="fas fa-sign-in-alt text-primary mr-2"></i>Join Existing Chat Room
                </h2>
                <p className="text-muted-foreground mb-4">
                  Enter a chat code to join an existing private chat room.
                </p>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={chatCode}
                    onChange={(e) => setChatCode(e.target.value.toUpperCase())}
                    placeholder="Enter chat code (e.g., ABC123DE)"
                    maxLength={8}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinChat()}
                    data-testid="input-chat-code"
                  />
                  <Button
                    onClick={handleJoinChat}
                    disabled={joinChatMutation.isPending || !chatCode.trim()}
                    data-testid="button-join-chat"
                  >
                    {joinChatMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-sign-in-alt"></i>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="shadow-sm bg-muted/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4 text-foreground flex items-center">
                  <i className="fas fa-shield-alt text-primary mr-2"></i>Private Chat Features
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-user-secret text-primary text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Anonymous</h4>
                      <p className="text-xs text-muted-foreground">No registration or personal info required</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-clock text-primary text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Auto-Expires</h4>
                      <p className="text-xs text-muted-foreground">Chat rooms expire after 2 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-trash text-primary text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">No History</h4>
                      <p className="text-xs text-muted-foreground">Messages deleted when room expires</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-bolt text-primary text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Real-time</h4>
                      <p className="text-xs text-muted-foreground">Instant message delivery</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chat Session Info */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <i className="fas fa-comments text-primary-foreground"></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Chat Room: {currentSession?.code}</h3>
                      <p className="text-sm text-muted-foreground">
                        Expires: {currentSession?.expiresAt ? new Date(currentSession.expiresAt).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (currentSession?.code) {
                          navigator.clipboard.writeText(currentSession.code);
                          toast({
                            title: "Success",
                            description: "Chat code copied to clipboard",
                          });
                        }
                      }}
                      data-testid="button-copy-code"
                    >
                      <i className="fas fa-copy mr-1"></i>Copy Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowChat(false);
                        setCurrentSession(null);
                      }}
                      data-testid="button-leave-chat"
                    >
                      <i className="fas fa-sign-out-alt mr-1"></i>Leave
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat Interface */}
        {showChat && currentSession && (
          <div className="fixed inset-0 bg-background z-50 flex flex-col">
            <header className="bg-card border-b border-border p-4">
              <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <i className="fas fa-comments text-primary-foreground text-sm"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Room: {currentSession.code}</h3>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(currentSession.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowChat(false);
                    setCurrentSession(null);
                  }}
                >
                  <i className="fas fa-times mr-1"></i>Close
                </Button>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                shareCode={currentSession.code}
                onClose={() => {
                  setShowChat(false);
                  setCurrentSession(null);
                }}
                onUserCountChange={() => {}}
                isPrivateChat={true}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}