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
 * Triggers download of the daily quote image
 */
export async function downloadImage(quote: string, onSuccess: () => void, onError: (error: string) => void) {
  try {
    const response = await fetch('/api/download');
    
    if (!response.ok) {
      throw new Error('Failed to download image');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : 'demotivation.png';
    
    a.download = filename;
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
