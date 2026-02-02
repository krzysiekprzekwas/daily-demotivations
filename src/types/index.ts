/**
 * Unsplash landscape photo data
 */
export interface LandscapePhoto {
  url: string;
  downloadUrl: string; // For triggering Unsplash download tracking
  photographer: string;
  photographerUrl: string;
  alt: string; // Accessibility description
}

/**
 * Daily quote data structure
 */
export interface DailyQuote {
  text: string;
  date: string; // ISO 8601 format (yyyy-MM-dd)
}

/**
 * Environment variables type safety
 */
export interface Env {
  UNSPLASH_ACCESS_KEY: string;
}
