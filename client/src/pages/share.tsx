import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import UrlPreview from "@/components/url-preview";
import ChatInterface from "@/components/chat-interface";
import { apiRequest } from "@/lib/queryClient";

export default function SharePage() {
  const { code } = useParams<{ code: string }>();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatUsers, setChatUsers] = useState(0);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/shares', code?.toUpperCase()],
    enabled: !!code,
  });

  useEffect(() => {
    if (data?.requiresPassword) {
      setShowPassword(true);
    } else if (data && !data.requiresPassword) {
      setIsUnlocked(true);
    }
  }, [data]);

  const handleUnlock = async () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter the password",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest('POST', `/api/shares/${code?.toUpperCase()}/unlock`, {
        password,
      });
      
      setIsUnlocked(true);
      setShowPassword(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid password",
        variant: "destructive",
      });
    }
  };

  const handleCopyContent = () => {
    if (data?.content) {
      navigator.clipboard.writeText(data.content);
      toast({
        title: "Success",
        description: "Content copied to clipboard",
      });
    }
  };

  const handleDownloadFile = () => {
    if (data?.type === 'file' && data?.fileData) {
      try {
        const byteCharacters = atob(data.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray]);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.fileName || 'downloaded-file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download file",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-destructive text-4xl mb-4"></i>
              <h1 className="text-2xl font-bold text-foreground mb-2">Content Not Found</h1>
              <p className="text-muted-foreground">
                This content may have expired, been deleted, or never existed.
              </p>
              <Button 
                className="mt-4"
                onClick={() => window.location.href = '/'}
                data-testid="button-home"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fas fa-share-alt text-primary text-xl"></i>
              <h1 className="text-xl font-semibold text-foreground">QuickShare</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/'}
              data-testid="button-create-new"
            >
              Create New
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Shared Content</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <i className="fas fa-clock"></i>
                <span>
                  Expires: {new Date(data.expiresAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Password Input */}
            {showPassword && !isUnlocked && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <i className="fas fa-lock text-yellow-600 mr-2"></i>
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    This content is password protected
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to view content"
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    data-testid="input-password"
                  />
                  <Button onClick={handleUnlock} data-testid="button-unlock">
                    Unlock
                  </Button>
                </div>
              </div>
            )}

            {/* Content Display */}
            {isUnlocked && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <i className={`fas ${
                        data.type === 'text' ? 'fa-file-text' :
                        data.type === 'url' ? 'fa-link' : 'fa-file'
                      } text-primary`}></i>
                      <span className="text-sm font-medium text-foreground">
                        {data.type === 'text' ? 'Text Content' :
                         data.type === 'url' ? 'URL' : 'File'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {data.type !== 'file' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleCopyContent}
                          data-testid="button-copy"
                        >
                          <i className="fas fa-copy mr-1"></i>Copy
                        </Button>
                      )}
                      {data.type === 'file' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleDownloadFile}
                          data-testid="button-download"
                        >
                          <i className="fas fa-download mr-1"></i>Download
                        </Button>
                      )}
                    </div>
                  </div>

                  {data.type === 'text' && (
                    <Textarea
                      value={data.content}
                      readOnly
                      className="min-h-32 resize-none"
                      data-testid="text-content"
                    />
                  )}

                  {data.type === 'url' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-background rounded border">
                        <a 
                          href={data.content} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                          data-testid="link-url"
                        >
                          {data.content}
                        </a>
                      </div>
                      {data.metadata && (
                        <UrlPreview metadata={data.metadata} />
                      )}
                    </div>
                  )}

                  {data.type === 'file' && (
                    <div className="flex items-center space-x-3 p-3 bg-background rounded border">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <i className="fas fa-file text-primary-foreground"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" data-testid="text-filename">
                          {data.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.fileSize ? `${(data.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Notification */}
                {chatUsers > 1 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-comments text-blue-600"></i>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Anonymous chat available
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs rounded-full">
                          {chatUsers} online
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => setShowChat(true)}
                        data-testid="button-join-chat"
                      >
                        Join Chat
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Chat with others viewing this content for 30 minutes.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        {showChat && code && (
          <ChatInterface
            shareCode={code.toUpperCase()}
            onClose={() => setShowChat(false)}
            onUserCountChange={setChatUsers}
          />
        )}
      </main>
    </div>
  );
}
