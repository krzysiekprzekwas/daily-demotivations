import { getTodaysQuote } from '@/lib/quotes';
import { getRandomLandscape, triggerDownload } from '@/lib/unsplash';
import QuoteDisplay from '@/components/QuoteDisplay';
import Footer from '@/components/Footer';

// ISR: Regenerate page every 24 hours (86400 seconds)
// This prevents midnight cache stampede via stale-while-revalidate
export const revalidate = 86400;

export default async function HomePage() {
  const quote = getTodaysQuote();
  const landscape = await getRandomLandscape();
  
  // Trigger Unsplash download tracking (required by API guidelines)
  if (landscape.downloadUrl) {
    await triggerDownload(landscape.downloadUrl);
  }
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background landscape with darkening overlay */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${landscape.url})` }}
      >
        {/* Darkening overlay for text contrast (40% black) */}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Main content - centered quote */}
      <main className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
        <QuoteDisplay quote={quote} />
      </main>
      
      {/* Footer with attribution */}
      <Footer 
        photographer={landscape.photographer}
        photographerUrl={landscape.photographerUrl}
      />
    </div>
  );
}
