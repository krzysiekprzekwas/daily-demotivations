import type { LandscapePhoto } from '../types';

/**
 * Fallback landscape images for when Unsplash API unavailable
 * Using CC0 (public domain) images from Unsplash
 * These URLs are permanent and don't require API access
 */
export const FALLBACK_LANDSCAPES: LandscapePhoto[] = [
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=90&fit=crop&auto=format',
    downloadUrl: '',
    photographer: 'Jonatan Pie',
    photographerUrl: 'https://unsplash.com/@r3d_max',
    alt: 'Dramatic mountain landscape at sunset',
  },
  {
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=90&fit=crop&auto=format',
    downloadUrl: '',
    photographer: 'Shifaaz Shamoon',
    photographerUrl: 'https://unsplash.com/@sotti',
    alt: 'Rocky coastline with ocean waves',
  },
  {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=90&fit=crop&auto=format',
    downloadUrl: '',
    photographer: 'veeterzy',
    photographerUrl: 'https://unsplash.com/@veeterzy',
    alt: 'Misty forest nature',
  },
  {
    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=90&fit=crop&auto=format',
    downloadUrl: '',
    photographer: 'Pedro Lastra',
    photographerUrl: 'https://unsplash.com/@peterlaster',
    alt: 'City skyline at golden hour',
  },
  {
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=90&fit=crop&auto=format',
    downloadUrl: '',
    photographer: 'Lightscape',
    photographerUrl: 'https://unsplash.com/@lightscape',
    alt: 'Northern lights aurora over landscape',
  },
];
