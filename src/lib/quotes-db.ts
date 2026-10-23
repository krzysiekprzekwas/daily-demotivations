import { prisma } from './prisma';
import { getTodaysQuote } from './quotes';
import { getRandomLandscape } from './unsplash';
import { schedulePairing } from './scheduler';

/**
 * Database query functions for fetching quotes and images
 * Used by homepage when USE_DATABASE=true
 */

export interface QuoteData {
  text: string;
  author?: string | null;
}

export interface ImageData {
  url: string;
  photographerName: string;
  photographerUrl?: string | null;
  source: string;
}

export interface DailyContent {
  quote: QuoteData;
  image: ImageData;
}

/**
 * Get quote and image for a specific date from database
 * If no pairing exists yet, one is auto-scheduled and persisted on first request
 * 
 * @param date - Date in YYYY-MM-DD format (e.g., "2026-02-03")
 * @returns Quote and image data, or null if error
 */
export async function getQuoteForDate(dateString: string): Promise<DailyContent | null> {
  try {
    // Parse date string to Date object (UTC)
    const date = new Date(dateString + 'T00:00:00.000Z');
    
    if (isNaN(date.getTime())) {
      console.error('[quotes-db] Invalid date format:', dateString);
      return null;
    }

    const findPairing = () =>
      prisma.pairing.findUnique({
        where: { date },
        include: { quote: true, image: true },
      });

    // No pairing yet → schedule one now; on a concurrent insert, read the winner's
    const pairing =
      (await findPairing()) ??
      (await schedulePairing(date))?.pairing ??
      (await findPairing());

    if (pairing) {
      // Found a pairing in database
      return {
        quote: {
          text: pairing.quote.text,
          author: pairing.quote.author,
        },
        image: {
          url: pairing.image.url,
          photographerName: pairing.image.photographerName,
          photographerUrl: pairing.image.photographerUrl,
          source: pairing.image.source,
        },
      };
    }

    // No active quotes available, return null (caller will handle fallback)
    return null;
  } catch (error) {
    console.error('[quotes-db] Error fetching quote for date:', dateString, error);
    return null;
  }
}

/**
 * Get today's quote and image
 * Uses database if USE_DATABASE=true, otherwise falls back to hardcoded quotes
 * 
 * @returns Quote and image data with graceful fallback
 */
export async function getTodaysContent(): Promise<DailyContent> {
  const useDatabaseStr = process.env.USE_DATABASE || 'false';
  const useDatabase = useDatabaseStr.toLowerCase() === 'true';

  // Get today's date in YYYY-MM-DD format (UTC)
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  // Try database first if enabled
  if (useDatabase) {
    try {
      const content = await getQuoteForDate(dateString);
      
      if (content) {
        console.log('[quotes-db] Using database pairing for', dateString);
        return content;
      }
      
      console.log('[quotes-db] No pairing found for', dateString, '- falling back to hardcoded quotes');
    } catch (error) {
      console.error('[quotes-db] Database error, falling back to hardcoded quotes:', error);
    }
  } else {
    console.log('[quotes-db] USE_DATABASE=false - using hardcoded quotes');
  }

  // Fallback to hardcoded quotes + Unsplash
  const hardcodedQuoteString = getTodaysQuote();
  const unsplashImage = await getRandomLandscape();

  // Parse author from quote string if present (format: "quote\n— author")
  const parts = hardcodedQuoteString.split('\n— ');
  const quoteText = parts[0];
  const author = parts.length > 1 ? parts[1] : null;

  return {
    quote: {
      text: quoteText,
      author,
    },
    image: {
      url: unsplashImage.url,
      photographerName: unsplashImage.photographer,
      photographerUrl: unsplashImage.photographerUrl,
      source: 'Unsplash',
    },
  };
}
