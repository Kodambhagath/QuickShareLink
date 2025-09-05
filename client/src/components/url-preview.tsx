interface UrlPreviewProps {
  metadata: {
    title: string;
    description: string;
    image: string;
    domain: string;
  };
}

export default function UrlPreview({ metadata }: UrlPreviewProps) {
  return (
    <div className="bg-muted rounded-lg p-4 border border-border" data-testid="url-preview">
      <div className="flex items-start space-x-3">
        {metadata.image ? (
          <img
            src={metadata.image}
            alt="Website preview"
            className="w-12 h-12 rounded object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
            <i className="fas fa-globe text-primary"></i>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate" data-testid="text-title">
            {metadata.title}
          </h4>
          {metadata.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid="text-description">
              {metadata.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-domain">
            {metadata.domain}
          </p>
        </div>
      </div>
    </div>
  );
}
