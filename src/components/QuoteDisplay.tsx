import { format } from 'date-fns';
import ShareButton from './ShareButton';

interface QuoteDisplayProps {
  quote: string;
}

export default function QuoteDisplay({ quote }: QuoteDisplayProps) {
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Hidden H1 for SEO - visually hidden but accessible */}
      <h1 className="sr-only">
        Daily Demotivational Quote - {formattedDate}
      </h1>
      
      {/* Date indicator (muted, subtle) */}
      <time 
        dateTime={today.toISOString()}
        className="block text-white/70 text-sm sm:text-base tracking-widest uppercase font-light"
      >
        {formattedDate}
      </time>
      
      {/* Quote with elegant serif typography */}
      <blockquote 
        className="
          text-3xl sm:text-4xl md:text-5xl lg:text-6xl
          font-serif font-normal
          text-white 
          leading-relaxed 
          tracking-tight
          drop-shadow-2xl
          px-4
          whitespace-pre-wrap
        "
      >
        "{quote}"
      </blockquote>
      
      {/* Share button */}
      <div className="pt-4 flex items-center justify-center">
        <ShareButton quote={quote} />
      </div>
      
      {/* Breathing room for zen aesthetic */}
      <div className="h-8" aria-hidden="true" />
    </div>
  );
}
