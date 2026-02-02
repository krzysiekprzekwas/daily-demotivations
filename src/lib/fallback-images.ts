import type { LandscapePhoto } from '../types';

/**
 * Fallback landscape images for when Unsplash API unavailable
 * Using CC0 (public domain) images from Unsplash
 * These URLs are permanent and don't require API access
 */
export const FALLBACK_LANDSCAPES: LandscapePhoto[] = [
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85',
    downloadUrl: '',
    photographer: 'Jonatan Pie',
    photographerUrl: 'https://unsplash.com/@r3d_max',
    alt: 'Mountain landscape at sunset',
  },
  {
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=85',
    downloadUrl: '',
    photographer: 'David Marcu',
    photographerUrl: 'https://unsplash.com/@davidmarcu',
    alt: 'Misty mountain valley',
  },
  {
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=85',
    downloadUrl: '',
    photographer: 'John Towner',
    photographerUrl: 'https://unsplash.com/@heytowner',
    alt: 'Rolling hills at golden hour',
  },
  {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85',
    downloadUrl: '',
    photographer: 'Jonatan Pie',
    photographerUrl: 'https://unsplash.com/@r3d_max',
    alt: 'Snowy mountain peak',
  },
  {
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=85',
    downloadUrl: '',
    photographer: 'V2osk',
    photographerUrl: 'https://unsplash.com/@v2osk',
    alt: 'Foggy forest landscape',
  },
];
