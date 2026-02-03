import { getTodaysQuote } from '@/lib/quotes';
import { getRandomLandscape } from '@/lib/unsplash';
import { format } from 'date-fns';

export const runtime = 'edge';

export async function GET() {
  try {
    const quote = getTodaysQuote();
    const landscape = await getRandomLandscape();
    const today = format(new Date(), 'MMMM d, yyyy');
    const filename = `demotivation-${format(new Date(), 'yyyy-MM-dd')}.png`;

    // We need to use canvas-based composition since ImageResponse doesn't handle external images well
    // For now, let's create a client-side download that fetches and composites the image
    // This is a server endpoint that returns the necessary data for client-side composition
    
    return new Response(
      JSON.stringify({
        quote,
        today,
        imageUrl: landscape.url,
        photographer: landscape.photographer,
        photographerUrl: landscape.photographerUrl,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
        },
      }
    );
  } catch (error) {
    console.error('Download data generation failed:', error);
    
    return new Response('Failed to generate download data', {
      status: 500,
    });
  }
}
