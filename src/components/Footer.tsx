interface FooterProps {
  photographer: string;
  photographerUrl?: string;
  source?: string;
}

export default function Footer({ photographer, photographerUrl, source = 'Unsplash' }: FooterProps) {
  // Generate source URL
  const sourceUrl = source.toLowerCase() === 'unsplash' 
    ? 'https://unsplash.com' 
    : source.toLowerCase() === 'pexels'
    ? 'https://pexels.com'
    : undefined;
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-white/60">
        {/* Left: Photographer credit (Unsplash attribution) */}
        <div className="flex items-center gap-2">
          <span>Photo by</span>
          {photographerUrl ? (
            <a 
              href={photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/90 transition-colors"
            >
              {photographer}
            </a>
          ) : (
            <span>{photographer}</span>
          )}
          <span>on</span>
          {sourceUrl ? (
            <a 
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/90 transition-colors"
            >
              {source}
            </a>
          ) : (
            <span>{source}</span>
          )}
        </div>
        
        {/* Right: Built by + Donation */}
        <div className="flex items-center gap-4">
          <a 
            href="https://kristof.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/90 transition-colors"
          >
            Built by Kristof.pro
          </a>
          <span className="text-white/40">•</span>
          <a 
            href="https://suppi.pl/kristof-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/90 transition-colors underline"
          >
            Buy me a coffee
          </a>
        </div>
      </div>
    </footer>
  );
}
