import { getTodaysContent, getQuoteForDate } from '@/lib/quotes-db';
import { format, addDays } from 'date-fns';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '1', 10), 1), 7);

    const today = new Date();
    const entries = [];

    for (let i = 0; i < days; i++) {
      const date = addDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');

      let content;
      if (i === 0) {
        content = await getTodaysContent();
      } else {
        content = await getQuoteForDate(dateString);
      }

      if (content) {
        entries.push({
          date: dateString,
          quote: content.quote.text,
          author: content.quote.author || null,
          imageUrl: content.image.url,
          photographer: content.image.photographerName,
          photographerUrl: content.image.photographerUrl || null,
        });
      }
    }

    return new Response(JSON.stringify({ entries }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Widget API failed:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch widget data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
