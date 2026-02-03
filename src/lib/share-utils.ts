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
 * Creates a canvas with the quote composited on the Unsplash background
 * Returns a blob that can be downloaded or shared
 */
async function createImageBlob(quote: string): Promise<Blob> {
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
  return new Promise((resolve, reject) => {
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

        // Draw the date (using light font weight like the page)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '300 24px sans-serif'; // font-light (300)
        ctx.textAlign = 'center';
        const today = new Date().toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        ctx.fillText(today.toUpperCase(), canvas.width / 2, 150);

        // Draw the quote (using normal font weight like the page)
        ctx.fillStyle = 'white';
        ctx.font = '400 56px serif'; // font-normal (400), not 600
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
        ctx.fillText('demotivations.kristof.pro', canvas.width / 2, canvas.height - 60);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          resolve(blob);
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load background image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Triggers download of the daily quote image with actual Unsplash background
 * Uses client-side canvas to composite quote on top of the landscape image
 */
export async function downloadImage(quote: string, onSuccess: () => void, onError: (error: string) => void) {
  try {
    const blob = await createImageBlob(quote);
    
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
  } catch (error) {
    console.error('Download error:', error);
    onError('Failed to download image');
  }
}

/**
 * Shares the image using Web Share API
 * Falls back to showing an error if Web Share is not supported
 */
export async function shareImage(quote: string, onSuccess: () => void, onError: (error: string) => void) {
  try {
    // Check if Web Share API is supported
    if (!navigator.share) {
      onError('Sharing is not supported on this device. Try downloading instead.');
      return;
    }

    // Create the image blob
    const blob = await createImageBlob(quote);
    
    // Create a file from the blob
    const file = new File(
      [blob], 
      `demotivation-${new Date().toISOString().split('T')[0]}.png`, 
      { type: 'image/png' }
    );

    // Check if we can share files
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      onError('Sharing images is not supported on this device. Try downloading instead.');
      return;
    }

    // Share the image
    await navigator.share({
      title: 'Daily Demotivations',
      text: `"${quote}"`,
      files: [file],
    });

    onSuccess();
  } catch (error: any) {
    // User cancelled sharing
    if (error.name === 'AbortError') {
      console.log('Share cancelled by user');
      return;
    }
    
    console.error('Share error:', error);
    onError('Failed to share. Try downloading instead.');
  }
}
