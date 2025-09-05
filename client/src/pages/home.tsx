import { useState } from "react";
import { Link } from "wouter";
import CreateShareForm from "@/components/create-share-form";
import ShareDisplay from "@/components/share-display";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [shareResult, setShareResult] = useState<any>(null);

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
            <div className="flex items-center space-x-4">
              <Link href="/chat">
                <Button variant="outline" size="sm" data-testid="button-private-chat">
                  <i className="fas fa-comments mr-2"></i>Private Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <CreateShareForm onShareCreated={setShareResult} />
        
        {shareResult && (
          <ShareDisplay
            shareResult={shareResult}
            onCreateAnother={() => setShareResult(null)}
          />
        )}

        {/* How it works section */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4 text-foreground flex items-center">
            <i className="fas fa-info-circle mr-2"></i>How it works
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-plus text-primary"></i>
              </div>
              <h4 className="font-medium text-foreground mb-2">1. Share Content</h4>
              <p className="text-sm text-muted-foreground">Upload files, paste text, or share URLs with customizable expiry times.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-link text-primary"></i>
              </div>
              <h4 className="font-medium text-foreground mb-2">2. Get Link</h4>
              <p className="text-sm text-muted-foreground">Receive a unique, temporary link to share with others securely.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-clock text-primary"></i>
              </div>
              <h4 className="font-medium text-foreground mb-2">3. Auto-Delete</h4>
              <p className="text-sm text-muted-foreground">Content automatically expires based on your settings for maximum security.</p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <i className="fas fa-shield-alt text-green-500"></i>
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock text-blue-500"></i>
                <span>Auto-Expiring</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-upload text-purple-500"></i>
                <span>5GB File Limit</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-comments text-orange-500"></i>
                <span>Anonymous Chat</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
