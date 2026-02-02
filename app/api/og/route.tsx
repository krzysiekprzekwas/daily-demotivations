import { ImageResponse } from 'next/og';
import { getTodaysQuote } from '../../../src/lib/quotes';
import { format } from 'date-fns';

export const runtime = 'edge';

export async function GET() {
  try {
    const quote = getTodaysQuote();
    const today = format(new Date(), 'MMMM d, yyyy');

    return new ImageResponse(
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
          }}
        >
          {/* Date indicator */}
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontWeight: 300,
              marginBottom: 60,
            }}
          >
            {today}
          </div>

          {/* Quote text with serif style */}
          <div
            style={{
              fontSize: 64,
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
              position: 'absolute',
              bottom: 40,
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            dailydemotivations.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error('OG image generation failed:', error);
    
    // Return error response
    return new Response('Failed to generate image', {
      status: 500,
    });
  }
}
