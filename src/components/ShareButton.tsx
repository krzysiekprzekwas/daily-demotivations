'use client';

import { useState } from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaShareAlt } from 'react-icons/fa';

interface ShareButtonProps {
  quote: string;
}

export default function ShareButton({ quote }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Check if Web Share API is supported
  const isWebShareSupported = typeof navigator !== 'undefined' && 
    'share' in navigator && 
    'canShare' in navigator;

  const handleWebShare = async () => {
    try {
      setIsSharing(true);
      setError(null);

      const shareUrl = window.location.href;
      const shareText = `"${quote}"\n\nDaily Demotivations`;

      // Try to fetch and share the image (Web Share Level 2)
      try {
        const response = await fetch('/api/download');
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], `demotivation-${new Date().toISOString().split('T')[0]}.png`, { 
            type: 'image/png' 
          });

          // Check if we can share with files
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Daily Demotivations',
              text: shareText,
              url: shareUrl,
              files: [file],
            });
            return;
          }
        }
      } catch (fileError) {
        // If file sharing fails, continue with text/url only
        console.log('File sharing not available, falling back to text/url');
      }

      // Fallback to text + URL only (Web Share Level 1)
      await navigator.share({
        title: 'Daily Demotivations',
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      // User cancelled or error occurred
      if ((err as Error).name === 'AbortError') {
        // User cancelled, don't show error
        console.log('Share cancelled by user');
      } else {
        console.error('Share error:', err);
        setError('Failed to share. Please try again.');
        // Show fallback buttons on error
        setShowFallback(true);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDirectShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const shareUrl = window.location.href;
    const shareText = `"${quote}" - Daily Demotivations`;
    
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    // Open in new window
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  // If Web Share API is not supported or user requested fallback, show direct share buttons
  if (!isWebShareSupported || showFallback) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-3">
          {/* Facebook */}
          <button
            onClick={() => handleDirectShare('facebook')}
            className="
              group
              p-3
              bg-[#1877F2]/10 hover:bg-[#1877F2]/20
              backdrop-blur-sm
              border border-[#1877F2]/30 hover:border-[#1877F2]/50
              rounded-lg
              text-[#1877F2]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#1877F2]/50 focus:ring-offset-2 focus:ring-offset-transparent
              shadow-lg hover:shadow-xl
            "
            aria-label="Share on Facebook"
            title="Share on Facebook"
          >
            <FaFacebook className="w-5 h-5" />
          </button>

          {/* Twitter */}
          <button
            onClick={() => handleDirectShare('twitter')}
            className="
              group
              p-3
              bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20
              backdrop-blur-sm
              border border-[#1DA1F2]/30 hover:border-[#1DA1F2]/50
              rounded-lg
              text-[#1DA1F2]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/50 focus:ring-offset-2 focus:ring-offset-transparent
              shadow-lg hover:shadow-xl
            "
            aria-label="Share on Twitter"
            title="Share on Twitter"
          >
            <FaTwitter className="w-5 h-5" />
          </button>

          {/* LinkedIn */}
          <button
            onClick={() => handleDirectShare('linkedin')}
            className="
              group
              p-3
              bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20
              backdrop-blur-sm
              border border-[#0A66C2]/30 hover:border-[#0A66C2]/50
              rounded-lg
              text-[#0A66C2]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/50 focus:ring-offset-2 focus:ring-offset-transparent
              shadow-lg hover:shadow-xl
            "
            aria-label="Share on LinkedIn"
            title="Share on LinkedIn"
          >
            <FaLinkedin className="w-5 h-5" />
          </button>
        </div>

        {showFallback && (
          <button
            onClick={() => setShowFallback(false)}
            className="text-white/60 text-sm hover:text-white/80 transition-colors"
          >
            Back to native share
          </button>
        )}
      </div>
    );
  }

  // Show Web Share API button
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleWebShare}
        disabled={isSharing}
        className="
          group
          relative
          px-8 py-3
          bg-white/10 hover:bg-white/20
          backdrop-blur-sm
          border border-white/30 hover:border-white/50
          rounded-lg
          text-white
          font-medium
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent
          shadow-lg hover:shadow-xl
        "
        aria-label="Share today's demotivation"
      >
        <span className="flex items-center gap-2">
          {isSharing ? (
            <>
              {/* Loading spinner */}
              <svg 
                className="animate-spin h-5 w-5" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Preparing...</span>
            </>
          ) : (
            <>
              {/* Share icon */}
              <FaShareAlt className="w-5 h-5" aria-hidden="true" />
              <span>Share</span>
            </>
          )}
        </span>
      </button>
      
      {/* Error message */}
      {error && (
        <p className="text-red-300 text-sm" role="alert">
          {error}
        </p>
      )}

      {/* Option to show direct share buttons */}
      <button
        onClick={() => setShowFallback(true)}
        className="text-white/50 text-xs hover:text-white/70 transition-colors underline"
      >
        or share directly
      </button>
    </div>
  );
}
