import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareDisplayProps {
  shareResult: {
    share: {
      code: string;
      type: string;
      expiresAt: string;
      oneTimeView: boolean;
      hasPassword: boolean;
    };
  };
  onCreateAnother: () => void;
}

export default function ShareDisplay({ shareResult, onCreateAnother }: ShareDisplayProps) {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/${shareResult.share.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Success",
      description: "Link copied to clipboard!",
    });
  };

  const handleOpenLink = () => {
    window.open(shareUrl, '_blank');
  };

  const getTimeRemaining = () => {
    const expiresAt = new Date(shareResult.share.expiresAt);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4 text-foreground flex items-center">
          <i className="fas fa-check-circle text-green-500 mr-2"></i>Share Link Created
        </h3>
        
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-foreground mb-1">Your share link:</p>
                <p className="text-lg font-mono text-primary break-all" data-testid="text-share-url">
                  {shareUrl}
                </p>
              </div>
              <Button
                onClick={handleCopyLink}
                className="shrink-0"
                data-testid="button-copy-link"
              >
                <i className="fas fa-copy mr-2"></i>Copy
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <i className="fas fa-clock mr-2"></i>
              <span data-testid="text-expires">Expires in {getTimeRemaining()}</span>
            </div>
            {shareResult.share.oneTimeView && (
              <div className="flex items-center text-muted-foreground">
                <i className="fas fa-eye mr-2"></i>
                <span>One-time view</span>
              </div>
            )}
            {shareResult.share.hasPassword && (
              <div className="flex items-center text-muted-foreground">
                <i className="fas fa-lock mr-2"></i>
                <span>Password protected</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onCreateAnother}
              data-testid="button-create-another"
            >
              Create Another
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleOpenLink}
              data-testid="button-open-link"
            >
              <i className="fas fa-external-link-alt mr-2"></i>Open Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
