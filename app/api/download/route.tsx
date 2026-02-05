import { getTodaysContent } from '@/lib/quotes-db';
import { format } from 'date-fns';

// Use Node.js runtime instead of Edge to avoid 1MB size limit
export const runtime = 'nodejs';

export async function GET() {
  try {
    const content = await getTodaysContent();
    const today = format(new Date(), 'MMMM d, yyyy');
    const filename = `demotivation-${format(new Date(), 'yyyy-MM-dd')}.png`;

    // Format quote text
    const quoteText = content.quote.author
      ? `${content.quote.text}\n— ${content.quote.author}`
      : content.quote.text;

    // We need to use canvas-based composition since ImageResponse doesn't handle external images well
    // For now, let's create a client-side download that fetches and composites the image
    // This is a server endpoint that returns the necessary data for client-side composition
    
    return new Response(
      JSON.stringify({
        quote: quoteText,
        today,
        imageUrl: content.image.url,
        photographer: content.image.photographerName,
        photographerUrl: content.image.photographerUrl || undefined,
      }),
      {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 min cache for fresh daily content
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
