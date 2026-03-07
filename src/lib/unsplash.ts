import { createApi } from 'unsplash-js';
import type { LandscapePhoto } from '../types';
import { FALLBACK_LANDSCAPES } from './fallback-images';

// Initialize Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

const LANDSCAPE_QUERIES = [
  'dramatic mountain landscape',
  'rocky coastline ocean waves',
  'misty forest nature',
  'city skyline golden hour',
  'river valley aerial',
  'desert canyon landscape',
  'northern lights aurora',
  'tropical beach paradise',
  'winter snow landscape',
  'rolling hills countryside',
];

/**
 * Fetches a random landscape from Unsplash
 * Cached via page-level ISR (revalidate = 86400) in page.tsx
 * Falls back to local images if API fails or rate limited
 */
export async function getRandomLandscape(): Promise<LandscapePhoto> {
  // If no API key, use fallback immediately
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.warn('UNSPLASH_ACCESS_KEY not set, using fallback image');
    return getRandomFallback();
  }

  try {
    const query = LANDSCAPE_QUERIES[Math.floor(Math.random() * LANDSCAPE_QUERIES.length)];
    const result = await unsplash.photos.getRandom({
      query,
      orientation: 'landscape',
      contentFilter: 'high',
    });

    if (result.type === 'success') {
      const photo = Array.isArray(result.response) ? result.response[0] : result.response;

      // Use raw URL with explicit sizing for full HD quality on all displays
      const url = `${photo.urls.raw}&w=1920&q=90&fit=crop&auto=format`;
      
      return {
        url,
        downloadUrl: photo.links.download_location,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        alt: photo.alt_description || 'Romantic landscape background',
      };
    }
    
    // API returned error
    console.error('Unsplash API error:', result.errors);
    return getRandomFallback();
    
  } catch (error) {
    // Network error, rate limit, or API failure
    console.error('Failed to fetch from Unsplash:', error);
    return getRandomFallback();
  }
}

/**
 * Triggers Unsplash download tracking (required by API guidelines)
 * Call this when image is actually displayed to user
 */
export async function triggerDownload(downloadUrl: string): Promise<void> {
  try {
    // Use native fetch to trigger download tracking
    await fetch(downloadUrl, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });
  } catch (error) {
    // Non-critical - log but don't fail
    console.warn('Failed to trigger Unsplash download tracking:', error);
  }
}

/**
 * Returns random fallback image when Unsplash unavailable
 */
function getRandomFallback(): LandscapePhoto {
  const index = Math.floor(Math.random() * FALLBACK_LANDSCAPES.length);
  return FALLBACK_LANDSCAPES[index];
}
