/**
 * Utility functions for social media sharing
 */

/**
 * Get the current page URL (works in browser only)
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.href;
}

/**
 * Triggers download of the daily quote image with actual Unsplash background
 * Uses client-side canvas to composite quote on top of the landscape image
 */
export async function downloadImage(quote: string, onSuccess: () => void, onError: (error: string) => void) {
  try {
    // Get the background image from the page
    const bgElement = document.querySelector<HTMLDivElement>('.fixed.inset-0.-z-10');
    if (!bgElement) {
      throw new Error('Background image not found');
    }

    // Extract the image URL from the background
    const bgStyle = window.getComputedStyle(bgElement);
    const bgImage = bgStyle.backgroundImage;
    const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
    
    if (!urlMatch || !urlMatch[1]) {
      throw new Error('Could not extract background image URL');
    }

    const imageUrl = urlMatch[1];

    // Create a canvas to composite the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    // Set canvas size (1200x1200 for Instagram)
    canvas.width = 1200;
    canvas.height = 1200;

    // Load the background image
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    
    img.onload = () => {
      try {
        // Draw the background image (cover fit)
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const imgX = (canvas.width - img.width * scale) / 2;
        const imgY = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, imgX, imgY, img.width * scale, img.height * scale);

        // Draw darkening overlay (40% black)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the date
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        const today = new Date().toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        ctx.fillText(today.toUpperCase(), canvas.width / 2, 150);

        // Draw the quote
        ctx.fillStyle = 'white';
        ctx.font = '600 56px serif';
        ctx.textAlign = 'center';
        
        // Word wrap the quote
        const maxWidth = canvas.width - 200; // 100px padding on each side
        const lineHeight = 80;
        const words = `"${quote}"`.split(' ');
        let line = '';
        let textY = canvas.height / 2 - 100;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, canvas.width / 2, textY);
            line = words[n] + ' ';
            textY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, textY);

        // Draw attribution
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px sans-serif';
        ctx.fillText('dailydemotivations.com', canvas.width / 2, canvas.height - 60);

        // Convert canvas to blob and trigger download
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to create image blob');
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `demotivation-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          onSuccess();
        }, 'image/png');
      } catch (error) {
        console.error('Canvas composition error:', error);
        onError('Failed to create image');
      }
    };

    img.onerror = () => {
      onError('Failed to load background image');
    };

    img.src = imageUrl;
  } catch (error) {
    console.error('Download error:', error);
    onError('Failed to download image');
  }
}

/**
 * Opens Instagram app or web with intent to share
 * Note: Instagram doesn't support direct URL sharing on web,
 * so we just open Instagram and let the user share manually after downloading
 */
export function shareToInstagram(onSuccess: () => void) {
  // On mobile, try to open Instagram app
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    // Instagram doesn't support web URL sharing, so we open the app
    // User will need to manually create post after downloading image
    window.open('instagram://camera', '_blank');
    onSuccess();
  } else {
    // On desktop, open Instagram web
    window.open('https://www.instagram.com/', '_blank');
    onSuccess();
  }
}

/**
 * Shares to WhatsApp with quote and URL
 */
export function shareToWhatsApp(quote: string, url: string, onSuccess: () => void) {
  const text = encodeURIComponent(`${quote}\n\n${url}`);
  const whatsappUrl = `https://wa.me/?text=${text}`;
  
  window.open(whatsappUrl, '_blank');
  onSuccess();
}

/**
 * Shares to LinkedIn with URL
 */
export function shareToLinkedIn(url: string, onSuccess: () => void) {
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  
  window.open(linkedInUrl, '_blank');
  onSuccess();
}
