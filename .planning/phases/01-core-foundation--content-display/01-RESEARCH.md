# Phase 1: Core Foundation & Content Display - Research

**Researched:** 2026-02-02
**Domain:** Next.js App Router with Vercel deployment, Unsplash API integration, responsive web design
**Confidence:** HIGH

## Summary

Phase 1 requires building a responsive Next.js application that displays daily deterministic demotivating quotes over romantic landscape backgrounds. The application must deploy seamlessly to Vercel and integrate with Unsplash API while avoiding critical serverless pitfalls.

**Key technical decisions:**
- Next.js 16.1.6 with App Router (latest stable) provides optimal serverless architecture
- Unsplash API for romantic landscape backgrounds with careful rate limit management
- Satori + Sharp for lightweight image optimization (avoiding Puppeteer overhead)
- Multi-layer caching strategy with stale-while-revalidate to prevent midnight stampedes
- Serif typography (next/font/google) for elegant quote presentation
- Tailwind CSS v3 for rapid responsive design with zen/meditative aesthetic

**Primary recommendation:** Use Next.js App Router with Server Components for core pages, implement ISR with 24-hour revalidation for quote pages, apply for Unsplash production API access immediately, and use built-in Vercel optimizations for fonts and images.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Full-stack React framework | Native Vercel platform, zero-config deployment, built-in optimizations for SSR/SSG/ISR |
| React | 19.x | UI library | Required by Next.js, Server Components support |
| TypeScript | 5.x | Type safety | Industry standard, excellent Next.js integration |
| Tailwind CSS | 3.x | Utility-first CSS | Rapid development, excellent with Next.js, production-ready |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unsplash-js | 7.x | Unsplash API client | Official SDK for type-safe Unsplash integration |
| sharp | latest | Image processing | Backend image optimization, format conversion |
| satori | 0.19.x | HTML/CSS to SVG | Lightweight OG image generation without Puppeteer |
| @vercel/og | latest | OG image generation | Built into Next.js App Router, wraps Satori |
| date-fns | 2.x+ | Date manipulation | Deterministic date-based quote selection |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind CSS | CSS Modules | More verbose, no rapid prototyping utilities |
| next/font | External font CDN | Slower load, privacy concerns, no optimization |
| Satori | Puppeteer | 50MB+ bundle, slow cold starts, unsuitable for serverless |
| App Router | Pages Router | Missing latest optimizations (React Server Components) |
| unsplash-js | Direct fetch | No types, manual URL construction, more error-prone |

**Installation:**
```bash
npm install next@latest react react-dom
npm install -D typescript @types/node @types/react @types/react-dom
npm install tailwindcss postcss autoprefixer
npm install unsplash-js date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── layout.tsx           # Root layout with fonts, metadata
├── page.tsx             # Homepage (today's quote)
├── api/
│   └── og/
│       └── route.tsx    # OG image generation endpoint
src/
├── lib/
│   ├── quotes.ts        # Quote collection and selection logic
│   ├── unsplash.ts      # Unsplash API client wrapper
│   └── cache.ts         # Cache configuration helpers
├── components/
│   ├── QuoteDisplay.tsx # Main quote presentation component
│   ├── ShareButtons.tsx # Social sharing functionality
│   └── Footer.tsx       # Attribution and credits
└── types/
    └── index.ts         # Shared TypeScript types
public/
└── fonts/               # Local font fallbacks (if needed)
```

### Pattern 1: Deterministic Date-Based Selection

**What:** Use date as seed for consistent daily quote selection across all users
**When to use:** Ensuring everyone sees the same quote on the same day
**Example:**
```typescript
// src/lib/quotes.ts
import { format } from 'date-fns';

export const QUOTES = [
  "Your daily motivation: It probably won't work anyway.",
  "Remember: Success is just failure that hasn't happened yet.",
  // ... more quotes
];

export function getTodaysQuote(): string {
  const today = format(new Date(), 'yyyy-MM-dd');
  // Simple hash for deterministic selection
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % QUOTES.length;
  return QUOTES[index];
}
```

### Pattern 2: Unsplash Integration with Rate Limit Protection

**What:** Multi-layer caching to prevent rate limit exhaustion
**When to use:** All external API calls to Unsplash
**Example:**
```typescript
// src/lib/unsplash.ts
import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
});

// Cache configuration
export const UNSPLASH_REVALIDATE = 86400; // 24 hours

export async function getRandomLandscape() {
  'use cache'
  const result = await unsplash.photos.getRandom({
    query: 'romantic landscape',
    orientation: 'landscape',
    contentFilter: 'high',
  });
  
  if (result.type === 'success') {
    // CRITICAL: Preserve ixid parameter for tracking
    return {
      url: result.response.urls.regular,
      downloadUrl: result.response.links.download_location,
      photographer: result.response.user.name,
      photographerUrl: result.response.user.links.html,
    };
  }
  
  throw new Error('Failed to fetch landscape');
}
```

### Pattern 3: ISR with Stale-While-Revalidate

**What:** Pre-render pages with automatic background revalidation
**When to use:** Pages that change daily but need instant load times
**Example:**
```typescript
// app/page.tsx
import { getTodaysQuote } from '@/lib/quotes';
import { getRandomLandscape } from '@/lib/unsplash';

// ISR: Regenerate once per day
export const revalidate = 86400; // 24 hours

export default async function HomePage() {
  const quote = getTodaysQuote();
  const landscape = await getRandomLandscape();
  
  return (
    <main className="relative min-h-screen flex items-center justify-center">
      {/* Background image with darkening overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${landscape.url})` }}
      >
        <div className="absolute inset-0 bg-black/30" />
      </div>
      
      {/* Quote content */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
        <blockquote className="text-4xl md:text-6xl font-serif text-white">
          {quote}
        </blockquote>
      </div>
    </main>
  );
}
```

### Pattern 4: Font Optimization with next/font

**What:** Self-hosted Google Fonts with zero layout shift
**When to use:** All text rendering (decision: serif font for quotes)
**Example:**
```typescript
// app/layout.tsx
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body className="font-serif">{children}</body>
    </html>
  );
}
```

### Anti-Patterns to Avoid

- **Client-side API calls to Unsplash:** Rate limits hit faster, no caching benefits, exposes API keys
- **Dynamic imports for images:** Breaks serverless bundle size limits, use `next/image` instead
- **useState for quote selection:** Breaks determinism, use server-side date-based selection
- **Missing ixid parameter:** Violates Unsplash guidelines, breaks tracking, risks API access
- **No error boundaries:** Unsplash failures crash entire page, always provide fallbacks

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Custom CDN, manual resizing | next/image | Handles formats (WebP/AVIF), lazy loading, blur placeholders, CDN caching automatically |
| Font loading | Manual @font-face, external CDN | next/font | Zero layout shift, self-hosting, preloading, variable font support |
| OG image generation | Puppeteer, canvas-based | @vercel/og (Satori) | <1MB bundle vs 50MB+, instant cold starts, serverless-friendly |
| Date manipulation | Custom date math | date-fns | Handles timezones, locales, edge cases correctly |
| Responsive breakpoints | Custom media queries | Tailwind CSS | Consistent system, mobile-first, easier maintenance |
| API rate limiting | Custom throttle logic | Vercel caching + ISR | Built-in, distributed, no additional code |
| Environment config | Manual process.env checks | Vercel env variables | Type-safe, per-environment, secure |

**Key insight:** Vercel's platform provides production-grade solutions for common serverless challenges (caching, edge functions, image optimization). Attempting custom solutions often introduces bugs and misses edge cases that the platform handles automatically.

## Common Pitfalls

### Pitfall 1: Cold Start Timeout from Heavy Dependencies

**What goes wrong:** Serverless function exceeds 10s execution limit on cold start
**Why it happens:** Large dependencies (Puppeteer, browser automation) inflate bundle size beyond serverless limits
**How to avoid:** 
- Use Satori (@vercel/og) instead of Puppeteer for image generation
- Keep function bundle under 1MB uncompressed
- Use Next.js automatic code splitting
- Avoid dynamic imports that aren't tree-shakeable
**Warning signs:** 
- Function timeouts in Vercel logs
- `npm install` adds >10MB to node_modules
- Import statements for 'puppeteer', 'playwright', 'canvas'

### Pitfall 2: Unsplash Rate Limit Exhaustion

**What goes wrong:** Application hits 50 req/hour (demo) or 5000 req/hour (production) limit
**Why it happens:** Each page view triggers API call without caching, or midnight rollover causes stampede
**How to avoid:**
1. **Apply for production immediately:** 50 req/hour insufficient for any real traffic
2. **Multi-layer caching:**
   - ISR revalidation: 24 hours
   - CDN caching: Headers set by Vercel automatically
   - Stale-while-revalidate: Old content served while regenerating
3. **Fallback images:** Local public/fallback-landscapes/ for graceful degradation
**Warning signs:**
- 403 responses from Unsplash API
- `X-Ratelimit-Remaining: 0` header
- Sudden increase in 5xx errors

### Pitfall 3: Missing ixid Parameter in Image URLs

**What goes wrong:** Unsplash API access revoked for guideline violation
**Why it happens:** URL manipulation or image resizing loses the `ixid` tracking parameter
**How to avoid:**
- ALWAYS preserve ixid when using Imgix parameters
- Template: `${urls.regular}&w=1200&q=85` (append, don't replace)
- Never construct URLs from scratch, always start with API response
**Warning signs:**
- URLs missing `?ixid=` or `&ixid=` parameter
- String replacement operations on image URLs
- Hardcoded image transformations

### Pitfall 4: 4.5MB Payload Limit Exceeded

**What goes wrong:** Vercel function response rejected as too large
**Why it happens:** Returning uncompressed PNG or high-quality JPEG from serverless function
**How to avoid:**
- Use JPEG at 85% quality (not 100%)
- For OG images: 1200x630px maximum
- Use sharp with compression settings
- Return optimized images via CDN URLs, not direct base64
**Warning signs:**
- 413 Payload Too Large errors
- Function response >4MB in size
- Returning Buffer/ArrayBuffer directly in API routes

### Pitfall 5: Cache Stampede at Midnight (UTC)

**What goes wrong:** All cached content expires simultaneously, overwhelming origin
**Why it happens:** ISR revalidation set to exactly 86400 seconds, all users trigger revalidation at once
**How to avoid:**
- Use stale-while-revalidate strategy (Next.js default)
- Don't set revalidate to exactly 86400, use 86400 + random jitter
- Enable `staleTimes` config in next.config.js
- Consider longer revalidation (48 hours) with on-demand revalidation
**Warning signs:**
- Spike in Vercel function executions at midnight UTC
- Increased latency at specific times
- Rate limit hits clustered at rollover

### Pitfall 6: Font Loading Failures in Edge Runtime

**What goes wrong:** Fonts fail to load in serverless/edge environments
**Why it happens:** Using external font CDNs or improper font file bundling
**How to avoid:**
- Always use next/font/google or next/font/local
- Font files must be .ttf, .otf, or .woff (not .woff2 for Satori)
- For Satori: Load fonts as ArrayBuffer/Buffer
- Don't use @vercel/og with external font URLs
**Warning signs:**
- Text renders as fallback font in production
- Font loading errors in Edge runtime logs
- Missing characters (tofu boxes)

## Code Examples

Verified patterns from official sources:

### Responsive Quote Display with Overlay

```tsx
// app/page.tsx
import { getTodaysQuote } from '@/lib/quotes';
import { getRandomLandscape } from '@/lib/unsplash';
import QuoteDisplay from '@/components/QuoteDisplay';
import Footer from '@/components/Footer';

export const revalidate = 86400; // 24 hour ISR

export default async function Home() {
  const quote = getTodaysQuote();
  const landscape = await getRandomLandscape();
  
  return (
    <div className="relative min-h-screen">
      {/* Background with darkening overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${landscape.url})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Main content */}
      <main className="min-h-screen flex flex-col justify-center items-center px-4 py-16">
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
```

### Serif Typography Component

```tsx
// components/QuoteDisplay.tsx
export default function QuoteDisplay({ quote }: { quote: string }) {
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Date indicator */}
      <time 
        dateTime={new Date().toISOString()}
        className="block text-white/80 text-sm tracking-wide uppercase"
      >
        {new Date().toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </time>
      
      {/* Quote with serif typography */}
      <blockquote className="
        text-2xl md:text-4xl lg:text-5xl 
        font-serif 
        text-white 
        leading-relaxed 
        tracking-tight
        drop-shadow-lg
      ">
        "{quote}"
      </blockquote>
      
      {/* Share buttons */}
      <div className="flex gap-4 justify-center pt-8">
        <ShareButton platform="twitter" quote={quote} />
        <ShareButton platform="facebook" quote={quote} />
      </div>
    </div>
  );
}
```

### OG Image Generation with Satori

```tsx
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { getTodaysQuote } from '@/lib/quotes';

export const runtime = 'edge';

export async function GET() {
  const quote = getTodaysQuote();
  
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
          backgroundImage: 'linear-gradient(to bottom right, #1a1a1a, #2d2d2d)',
          padding: '80px',
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontFamily: 'Playfair Display',
            fontWeight: 400,
            color: 'white',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
          }}
        >
          "{quote}"
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### Metadata Generation

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Demotivations',
  description: 'Your daily dose of demotivating quotes over romantic landscapes',
  metadataBase: new URL('https://daily-demotivations.vercel.app'),
  openGraph: {
    title: 'Daily Demotivations',
    description: 'Your daily dose of demotivating quotes',
    url: 'https://daily-demotivations.vercel.app',
    siteName: 'Daily Demotivations',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Demotivations',
    description: 'Your daily dose of demotivating quotes',
    images: ['/api/og'],
  },
};
```

### Environment Variables Configuration

```typescript
// src/lib/env.ts
// Type-safe environment variables
export const env = {
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY!,
  nodeEnv: process.env.NODE_ENV,
  vercelUrl: process.env.VERCEL_URL,
} as const;

// Validation at startup
if (!env.unsplashAccessKey) {
  throw new Error('Missing UNSPLASH_ACCESS_KEY environment variable');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router | App Router | Next.js 13.4 (2023) | React Server Components, better streaming, built-in data fetching |
| getStaticProps | Server Components | Next.js 13 (2022) | Simpler syntax, automatic request deduplication, no props drilling |
| Puppeteer for OG | Satori/@vercel/og | 2022 | 50x faster cold starts, 50MB+ smaller bundles |
| External font CDN | next/font | Next.js 13 (2022) | Zero layout shift, privacy, performance |
| Manual image optimization | next/image | Next.js 10 (2020) | Automatic format selection (WebP/AVIF), lazy loading |
| getServerSideProps | ISR with revalidate | Next.js 9.5 (2020) | Better caching, reduced server load, stale-while-revalidate |
| CSS-in-JS (styled-components) | Tailwind CSS | 2019+ | Better performance, smaller bundles, no runtime |

**Deprecated/outdated:**
- **Puppeteer for serverless image generation:** Too heavy, use Satori instead
- **getStaticProps/getServerSideProps:** Use Server Components or generateStaticParams
- **API routes for data fetching:** Use Server Components for data fetching
- **@vercel/fetch:** Now built into Next.js fetch with automatic deduplication
- **SWR/React Query for SSR data:** Server Components handle this natively

## Open Questions

Things that couldn't be fully resolved:

1. **Unsplash Production API Access Timeline**
   - What we know: Must apply via dashboard, typically approved within days
   - What's unclear: Exact approval timeline, whether demo limits apply during review
   - Recommendation: Apply immediately in parallel with development, implement fallback images for demo phase

2. **Optimal Serif Font Choice**
   - What we know: User wants serif for elegance, Playfair Display and Georgia are options
   - What's unclear: Exact font preference, whether multiple weights needed
   - Recommendation: Start with Playfair Display (400, 700), easy to swap via next/font

3. **Exact Overlay Darkness Percentage**
   - What we know: Must ensure white text readability on landscapes
   - What's unclear: User preference for overlay intensity
   - Recommendation: Start with 40% black overlay (bg-black/40), adjust based on feedback

4. **Buy Me a Coffee Integration Requirements**
   - What we know: User wants donation link in footer
   - What's unclear: Buy Me a Coffee account setup, exact placement
   - Recommendation: Simple link in footer, no complex widget integration needed for v1

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 Official Documentation - https://nextjs.org/docs (fetched 2026-02-02)
- Vercel Next.js Deployment Guide - https://vercel.com/docs/frameworks/nextjs (fetched 2026-02-02)
- Vercel OG Image Generation - https://vercel.com/docs/functions/og-image-generation (fetched 2026-02-02)
- Unsplash API Documentation - https://unsplash.com/documentation (fetched 2026-02-02)
- Satori GitHub Repository - https://github.com/vercel/satori (fetched 2026-02-02)
- Next.js Font Optimization - https://nextjs.org/docs/app/building-your-application/optimizing/fonts (fetched 2026-02-02)
- generateStaticParams API Reference - https://nextjs.org/docs/app/api-reference/functions/generate-static-params (fetched 2026-02-02)

### Secondary (MEDIUM confidence)
- Phase context from user discussions (CONTEXT.md) - decisions on layout, typography, aesthetic
- Roadmap critical pitfalls - identified specific serverless challenges to address
- Next.js examples repository patterns (inferred from documentation structure)

### Tertiary (LOW confidence)
- None - all research verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All recommendations from official Next.js/Vercel documentation
- Architecture: HIGH - Patterns verified in official docs and Vercel examples
- Pitfalls: HIGH - Documented in Vercel's deployment guides and Unsplash API guidelines

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days for stable framework stack)

**Notes:**
- Next.js 16 is stable (released), safe for production use
- Unsplash API guidelines are stable, rate limits unlikely to change
- Serverless best practices are well-established
- Tailwind CSS v3 is mature, v4 in alpha but not needed
