/**
 * Utility functions for social media sharing
 */

/**
 * Twitter has a 280 character limit. We need to account for:
 * - Quote text (with quotes around it)
 * - " - Daily Demotivations\n"
 * - URL (shortened to ~23 chars by Twitter)
 * 
 * Safe limit: 280 - 30 (attribution) - 23 (URL) = 227 chars for quote
 */
const TWITTER_SAFE_QUOTE_LENGTH = 220;

/**
 * Truncate quote for Twitter sharing if needed
 */
export function truncateForTwitter(quote: string): string {
  if (quote.length <= TWITTER_SAFE_QUOTE_LENGTH) {
    return quote;
  }
  
  // Truncate and add ellipsis
  return quote.substring(0, TWITTER_SAFE_QUOTE_LENGTH - 3) + '...';
}

/**
 * Generate share text for different platforms
 */
export function getShareText(quote: string, platform: 'twitter' | 'facebook' | 'linkedin' | 'generic' = 'generic'): string {
  switch (platform) {
    case 'twitter':
      const truncatedQuote = truncateForTwitter(quote);
      return `"${truncatedQuote}" - Daily Demotivations`;
    
    case 'facebook':
    case 'linkedin':
    case 'generic':
    default:
      return `"${quote}"\n\nDaily Demotivations`;
  }
}

/**
 * Get the current page URL (works in browser only)
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.href;
}
