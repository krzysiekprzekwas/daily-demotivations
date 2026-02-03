import { ImageResponse } from 'next/og';
import { getTodaysQuote } from '@/lib/quotes';
import { format } from 'date-fns';

export const runtime = 'edge';

export async function GET() {
  try {
    const quote = getTodaysQuote();
    const today = format(new Date(), 'MMMM d, yyyy');
    const filename = `demotivation-${format(new Date(), 'yyyy-MM-dd')}.png`;

    // Generate 1200x1200 square image (Instagram optimized)
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
            padding: '100px',
            position: 'relative',
          }}
        >
          {/* Date indicator */}
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontWeight: 300,
              marginBottom: 80,
            }}
          >
            {today}
          </div>

          {/* Quote text with serif style */}
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 400,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: '90%',
              fontFamily: 'serif',
            }}
          >
            "{quote}"
          </div>

          {/* Attribution */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: 50,
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            dailydemotivations.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
      },
    );

    // Get the image buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Return with proper Content-Disposition header for download
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Download image generation failed:', error);
    
    // Return error response
    return new Response('Failed to generate download image', {
      status: 500,
    });
  }
}
