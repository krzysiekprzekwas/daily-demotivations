import { ImageResponse } from 'next/og';
import { getTodaysContent } from '@/lib/quotes-db';
import { format, parse, isValid } from 'date-fns';
import { NextRequest } from 'next/server';

// Use Node.js runtime instead of Edge to avoid 1MB size limit
// Edge runtime has 1MB limit on free plan, Node.js has 50MB limit
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Support date parameter for future permalink functionality
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    
    let targetDate = new Date();
    
    // If date parameter provided, use it (format: YYYY-MM-DD)
    if (dateParam) {
      const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        targetDate = parsedDate;
      }
    }
    
    // Fetch content (uses database if USE_DATABASE=true, otherwise hardcoded)
    const content = await getTodaysContent();
    
    // Format quote text
    const quoteText = content.quote.author
      ? `${content.quote.text} — ${content.quote.author}`
      : content.quote.text;
    
    const formattedDate = format(targetDate, 'MMMM d, yyyy');

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            backgroundImage: 'linear-gradient(135deg, #2d1b2e 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '80px',
            position: 'relative',
          }}
        >
          {/* Date indicator */}
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontWeight: 300,
              marginBottom: 60,
            }}
          >
            {formattedDate}
          </div>

          {/* Quote text with serif style */}
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 400,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: '90%',
              fontFamily: 'serif',
            }}
          >
            "{quoteText}"
          </div>

          {/* Attribution */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: 40,
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            demotivations.kristof.pro
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
    
    // Set aggressive cache headers
    // If date parameter is provided, cache immutably (permalink)
    // Otherwise, cache for 24 hours (current day)
    const cacheControl = dateParam
      ? 'public, max-age=31536000, immutable' // 1 year, immutable for permalinks
      : 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200'; // 24h cache, 12h stale
    
    return new Response(imageResponse.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('OG image generation failed:', error);
    
    // Return error response
    return new Response('Failed to generate image', {
      status: 500,
    });
  }
}
