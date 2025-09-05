import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import UrlPreview from "./url-preview";

interface CreateShareFormProps {
  onShareCreated: (result: any) => void;
}

export default function CreateShareForm({ onShareCreated }: CreateShareFormProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'file'>('text');
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState("10m");
  const [oneTimeView, setOneTimeView] = useState(false);
  const [urlMetadata, setUrlMetadata] = useState<any>(null);
  const { toast } = useToast();

  const createShareMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/shares', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create share');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      onShareCreated(data);
      // Reset form
      setTextContent("");
      setUrlContent("");
      setFile(null);
      setPassword("");
      setExpiresIn("10m");
      setOneTimeView(false);
      setUrlMetadata(null);
      
      toast({
        title: "Success",
        description: "Share link created successfully!",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('type', activeTab);
    formData.append('expiresIn', expiresIn);
    formData.append('oneTimeView', oneTimeView.toString());
    
    if (password.trim()) {
      formData.append('password', password.trim());
    }
    
    switch (activeTab) {
      case 'text':
        if (!textContent.trim()) {
          toast({
            title: "Error",
            description: "Please enter some text content",
            variant: "destructive",
          });
          return;
        }
        formData.append('content', textContent.trim());
        break;
        
      case 'url':
        if (!urlContent.trim()) {
          toast({
            title: "Error",
            description: "Please enter a URL",
            variant: "destructive",
          });
          return;
        }
        try {
          new URL(urlContent.trim());
          formData.append('content', urlContent.trim());
        } catch {
          toast({
            title: "Error",
            description: "Please enter a valid URL",
            variant: "destructive",
          });
          return;
        }
        break;
        
      case 'file':
        if (!file) {
          toast({
            title: "Error",
            description: "Please select a file",
            variant: "destructive",
          });
          return;
        }
        if (file.size > 5 * 1024 * 1024 * 1024) {
          toast({
            title: "Error",
            description: "File size must be less than 5GB",
            variant: "destructive",
          });
          return;
        }
        formData.append('file', file);
        break;
    }
    
    createShareMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5GB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUrlChange = async (value: string) => {
    setUrlContent(value);
    setUrlMetadata(null);
    
    if (value.trim()) {
      try {
        new URL(value.trim());
        // Fetch metadata preview
        const formData = new FormData();
        formData.append('type', 'url');
        formData.append('content', value.trim());
        formData.append('expiresIn', '1m'); // Temporary share just for preview
        
        const response = await fetch('/api/shares', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.metadata) {
            setUrlMetadata(data.metadata);
          }
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardContent className="p-6">
        <h2 className="text-lg font-medium mb-4 text-foreground">Create a new share</h2>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted rounded-lg p-1">
          <button
            type="button"
            className={`tab-btn flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'text' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('text')}
            data-testid="tab-text"
          >
            <i className="fas fa-file-text mr-2"></i>Text/Notes
          </button>
          <button
            type="button"
            className={`tab-btn flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'url' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('url')}
            data-testid="tab-url"
          >
            <i className="fas fa-link mr-2"></i>URL
          </button>
          <button
            type="button"
            className={`tab-btn flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'file' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('file')}
            data-testid="tab-file"
          >
            <i className="fas fa-upload mr-2"></i>File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Tab */}
          {activeTab === 'text' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Your text or notes</label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="h-40 resize-none"
                placeholder="Paste your text, notes, or any content here..."
                data-testid="textarea-text"
              />
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">URL to share</label>
                <Input
                  type="url"
                  value={urlContent}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com"
                  data-testid="input-url"
                />
              </div>
              
              {urlMetadata && <UrlPreview metadata={urlMetadata} />}
            </div>
          )}

          {/* File Tab */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <div className="space-y-2">
                  <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground"></i>
                  <div>
                    <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5GB</p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                    data-testid="input-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-input')?.click()}
                    data-testid="button-browse"
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
              
              {/* File Preview */}
              {file && (
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <i className="fas fa-file text-primary-foreground"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate" data-testid="text-filename">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      data-testid="button-remove-file"
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Share Options */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Expires in</label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger data-testid="select-expires">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 minute</SelectItem>
                    <SelectItem value="10m">10 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="1d">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Password (optional)</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for no password"
                  data-testid="input-password"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-6">
              <Checkbox
                id="oneTime"
                checked={oneTimeView}
                onCheckedChange={(checked) => setOneTimeView(checked === true)}
                data-testid="checkbox-onetime"
              />
              <label htmlFor="oneTime" className="text-sm text-foreground">
                Delete after first view (one-time access)
              </label>
            </div>

            {/* Create Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={createShareMutation.isPending}
              data-testid="button-create"
            >
              {createShareMutation.isPending ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fas fa-share mr-2"></i>
              )}
              {createShareMutation.isPending ? 'Creating...' : 'Create Share Link'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
