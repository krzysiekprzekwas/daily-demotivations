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
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const pageTitle = `Daily Demotivational Quote – ${formattedDate}`;

  const quoteText = content.quote.author
    ? `${content.quote.text} — ${content.quote.author}`
    : content.quote.text;
  const shortQuote = content.quote.text.length > 110
    ? content.quote.text.slice(0, 107) + '...'
    : content.quote.text;
  const description = `"${shortQuote}" — Fresh demotivational quotes on stunning landscapes, delivered daily.`;

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: pageTitle,
      description,
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
      title: pageTitle,
      description,
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Daily Demotivations',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://demotivations.kristof.pro',
    mainEntity: {
      '@type': 'Quotation',
      text: content.quote.text,
      ...(content.quote.author ? { creator: { '@type': 'Person', name: content.quote.author } } : {}),
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
