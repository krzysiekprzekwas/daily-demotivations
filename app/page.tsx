import { getTodaysContent } from '@/lib/quotes-db';
import { triggerDownload } from '@/lib/unsplash';
import QuoteDisplay from '@/components/QuoteDisplay';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

// Revalidate every hour for better caching while keeping content fresh
// Content changes daily, so 1-hour cache is reasonable
export const revalidate = 3600; // 1 hour in seconds

export async function generateMetadata(): Promise<Metadata> {
  const content = await getTodaysContent();
  const quoteText = content.quote.author 
    ? `${content.quote.text} — ${content.quote.author}`
    : content.quote.text;
  
  return {
    title: 'Daily Demotivations',
    description: quoteText,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: 'Daily Demotivations',
      description: quoteText,
      url: '/',
      images: [
        {
          url: '/api/og',
          width: 1200,
          height: 630,
          alt: quoteText,
          type: 'image/png',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Daily Demotivations',
      description: quoteText,
      images: ['/api/og'],
    },
  };
}

export default async function HomePage() {
  const content = await getTodaysContent();
  
  // Prepare quote for display component (expects string format)
  const quoteText = content.quote.author
    ? `${content.quote.text}\n— ${content.quote.author}`
    : content.quote.text;
  
  // Note: We don't trigger Unsplash download tracking for database images
  // Only trigger if using Unsplash random API (which provides downloadUrl)
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background landscape with darkening overlay */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${content.image.url})` }}
      >
        {/* Darkening overlay for text contrast (40% black) */}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Main content - centered quote */}
      <main className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
        <QuoteDisplay quote={quoteText} />
      </main>
      
      {/* Footer with attribution */}
      <Footer 
        photographer={content.image.photographerName}
        photographerUrl={content.image.photographerUrl || undefined}
        source={content.image.source}
      />
    </div>
  );
}
