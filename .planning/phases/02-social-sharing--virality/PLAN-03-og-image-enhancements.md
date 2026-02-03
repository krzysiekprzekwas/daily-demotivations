# Plan 03: OG Image Enhancements

**Phase:** 2 - Social Sharing & Virality  
**Requirement:** SHARE-03  
**Plan:** 03 of 03  
**Status:** Not Started

---

## Overview

Enhance the existing Open Graph (OG) image implementation from Phase 1 to optimize social sharing previews. Add structured metadata, improve caching, support date parameters, and validate across all major social platforms.

**Key Decision:** Enhance existing OG implementation rather than rebuild. Focus on metadata completeness and cache optimization for viral potential.

---

## Requirements

### Functional Requirements

1. **Structured OG Properties**: Add width, height, alt, type metadata for better platform compatibility
2. **Date Parameter Support**: Allow `/api/og?date=YYYY-MM-DD` for date-specific sharing (future v2 permalinks)
3. **Cache Optimization**: Aggressive caching headers since quote never changes for given date
4. **Platform Validation**: Test previews on Facebook, LinkedIn, Twitter, WhatsApp, Slack, Discord
5. **Documentation**: Document cache invalidation process for production
6. **Metadata Completeness**: Ensure all recommended OG tags present

### Technical Requirements

1. **Update `/api/og/route.tsx`**: Add date parameter support, optimize cache headers
2. **Update `app/page.tsx`**: Add structured OG image properties to metadata
3. **Add `og:site_name`**: Brand consistency across platforms
4. **Add image metadata**: width, height, alt, type for better parsing
5. **Validate with debuggers**: Test with Facebook, LinkedIn, Twitter tools

### Non-Functional Requirements

1. **Performance**: OG image generation remains <1s (no degradation)
2. **Cache Hit Rate**: 90%+ after warmup
3. **Platform Compatibility**: Previews render correctly on all major platforms
4. **SEO**: Proper metadata structure for search engines
5. **CDN Efficiency**: Long-term caching on Vercel Edge Network

---

## Technical Design

### Update 1: OG Image Route with Date Parameter

```typescript
// app/api/og/route.tsx (enhanced)
import { ImageResponse } from 'next/og';
import { getTodaysQuote, getQuoteForDate } from '@/lib/quotes';
import { format, isValid, parseISO } from 'date-fns';

export const runtime = 'edge';

/**
 * Generate Open Graph preview image for social sharing.
 * 
 * Query Parameters:
 * - date: YYYY-MM-DD (optional, defaults to today)
 * 
 * Caching:
 * - Client: 24 hours (quote doesn't change for given date)
 * - CDN: 1 year (permanent content)
 * - Revalidate: 7 days (stale-while-revalidate)
 * 
 * @example
 * GET /api/og
 * GET /api/og?date=2025-02-03
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Parse and validate date parameter
    let targetDate = new Date();
    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (isValid(parsed)) {
        targetDate = parsed;
      } else {
        console.warn(`[OG] Invalid date parameter: ${dateParam}, falling back to today`);
      }
    }
    
    // Get quote for target date
    const quote = dateParam ? getQuoteForDate(targetDate) : getTodaysQuote();
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
            "{quote}"
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
            dailydemotivations.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
    
    // Add aggressive caching headers
    // Quote for a given date never changes, so we can cache aggressively
    imageResponse.headers.set(
      'Cache-Control',
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
    );
    imageResponse.headers.set(
      'CDN-Cache-Control',
      'public, max-age=31536000' // 1 year on CDN
    );
    
    return imageResponse;
    
  } catch (error) {
    console.error('[OG] Image generation failed:', error);
    
    return new Response('Failed to generate OG image', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
```

### Update 2: Page Metadata with Structured Properties

```typescript
// app/page.tsx (enhanced metadata)
import { getTodaysQuote } from '@/lib/quotes';
import { getRandomLandscape, triggerDownload } from '@/lib/unsplash';
import QuoteDisplay from '@/components/QuoteDisplay';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

// ISR: Regenerate page every 24 hours
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const quote = getTodaysQuote();
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return {
    title: 'Daily Demotivations',
    description: quote,
    
    // Open Graph
    openGraph: {
      title: 'Daily Demotivations',
      description: quote,
      url: 'https://dailydemotivations.com', // Update with actual domain
      siteName: 'Daily Demotivations',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: `/api/og?date=${dateStr}`,
          width: 1200,
          height: 630,
          alt: `Daily Demotivations - ${quote}`,
          type: 'image/png',
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: 'Daily Demotivations',
      description: quote,
      images: [`/api/og?date=${dateStr}`],
      creator: '@dailydemotivate', // Update with actual Twitter handle if exists
    },
    
    // Additional metadata for better SEO
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function HomePage() {
  const quote = getTodaysQuote();
  const landscape = await getRandomLandscape();
  
  // Trigger Unsplash download tracking
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
```

### Additional Metadata Tags (Manual Verification)

Verify these tags are included via Next.js metadata API:

```html
<!-- Core Open Graph -->
<meta property="og:title" content="Daily Demotivations" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://dailydemotivations.com" />
<meta property="og:image" content="https://dailydemotivations.com/api/og?date=2025-02-03" />
<meta property="og:description" content="Your daily motivation: It probably won't work anyway." />

<!-- Structured Image Properties -->
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Daily Demotivations - Your daily motivation: It probably won't work anyway." />
<meta property="og:image:type" content="image/png" />

<!-- Additional Properties -->
<meta property="og:site_name" content="Daily Demotivations" />
<meta property="og:locale" content="en_US" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Daily Demotivations" />
<meta name="twitter:description" content="Your daily motivation: It probably won't work anyway." />
<meta name="twitter:image" content="https://dailydemotivations.com/api/og?date=2025-02-03" />
<meta name="twitter:creator" content="@dailydemotivate" /> <!-- If Twitter account exists -->
```

---

## Implementation Steps

### Step 1: Update OG Image Route

**File:** `app/api/og/route.tsx`

1. Import `parseISO`, `isValid` from date-fns
2. Add query parameter parsing for `date`
3. Add date validation (fall back to today if invalid)
4. Update quote selection to use `getQuoteForDate(targetDate)` if date present
5. Add cache headers:
   - `Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800`
   - `CDN-Cache-Control: public, max-age=31536000`
6. Add JSDoc comment explaining caching strategy
7. Add console warning for invalid date parameters

**Validation:**
- Test with date param: `/api/og?date=2025-02-03`
- Test with invalid date: `/api/og?date=invalid`
- Test without date: `/api/og`
- Check response headers include Cache-Control
- Verify correct quote shown for each date

### Step 2: Update Page Metadata

**File:** `app/page.tsx`

1. Add `siteName: 'Daily Demotivations'` to openGraph
2. Add `locale: 'en_US'` to openGraph
3. Add `url` to openGraph (will be updated with production domain)
4. Update image URL to include date parameter: `/api/og?date=${dateStr}`
5. Add structured image properties:
   - `width: 1200`
   - `height: 630`
   - `alt: Daily Demotivations - ${quote}`
   - `type: 'image/png'`
6. Add `creator` to twitter metadata (if Twitter account exists)
7. Add `robots` metadata for better SEO

**Validation:**
- Build and run locally
- View page source → verify all meta tags present
- Check meta tags in Chrome DevTools (Elements tab)

### Step 3: Test with Social Platform Debuggers

#### Facebook Sharing Debugger

1. Go to https://developers.facebook.com/tools/debug/
2. Enter production URL: `https://dailydemotivations.com`
3. Click "Debug"
4. Review scraped metadata:
   - ✅ og:title present
   - ✅ og:image loads correctly
   - ✅ og:description shows quote
   - ✅ Image dimensions 1200x630
5. Click "Scrape Again" to force refresh if needed

**Expected result:**
- Preview shows gradient background with quote
- All required fields populated
- No warnings or errors

#### Twitter Card Validator

1. Go to https://cards-dev.twitter.com/validator
2. Enter production URL
3. Review card preview:
   - ✅ summary_large_image card type
   - ✅ Image displays correctly
   - ✅ Title and description present
   - ✅ Image meets size requirements

**Expected result:**
- Large image card preview
- Quote visible and readable
- No validation errors

#### LinkedIn Post Inspector

1. Go to https://www.linkedin.com/post-inspector/
2. Enter production URL
3. Review preview:
   - ✅ Image loads
   - ✅ Title and description present
   - ✅ No errors or warnings

**Note:** LinkedIn may take 5-10s to scrape (slower than other platforms)

#### Generic OG Validator

1. Go to https://opengraphcheck.com/
2. Enter production URL
3. Review all platforms:
   - ✅ Facebook preview
   - ✅ Twitter preview
   - ✅ Slack preview
   - ✅ iMessage preview
   - ✅ WhatsApp preview
   - ✅ Discord preview

**Expected result:**
- All platforms show image and quote
- No missing required tags
- Image loads in <5s

### Step 4: Document Cache Invalidation Process

**File:** `README.md` or `DEPLOYMENT.md`

Add section:

```markdown
## Open Graph Cache Invalidation

Social platforms cache Open Graph previews for 7-30 days. If you need to force a refresh:

### Facebook
1. Go to https://developers.facebook.com/tools/debug/
2. Enter your URL
3. Click "Scrape Again" button
4. Preview updates immediately

### Twitter
1. Post the URL to a private/test tweet
2. Delete tweet
3. New preview will be fetched on next share

### LinkedIn
1. Go to https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Click "Inspect"
4. Preview regenerates

### Other Platforms (Slack, Discord, WhatsApp)
- These platforms cache more aggressively (30+ days)
- No manual refresh tool available
- Consider appending `?v=1` query param to bust cache
- Note: This creates new cache entry, doesn't invalidate old one

### When to Invalidate
- After OG image design changes
- After quote text changes (shouldn't happen for existing dates)
- After domain change (e.g., dailydemotivations.com → new domain)
- Before major launch/press coverage

### Production Notes
- Vercel CDN caches OG images for 1 year (`CDN-Cache-Control: max-age=31536000`)
- Client cache is 24 hours (`Cache-Control: max-age=86400`)
- Quote for a given date never changes, so aggressive caching is safe
- If you need to change a quote, it's a breaking change (requires cache bust)
```

### Step 5: Performance Testing

**Test OG image generation time:**

```bash
# Measure response time
curl -w "\nTime: %{time_total}s\n" https://dailydemotivations.com/api/og

# Measure with date parameter
curl -w "\nTime: %{time_total}s\n" https://dailydemotivations.com/api/og?date=2025-02-03

# Check cache headers
curl -I https://dailydemotivations.com/api/og
```

**Target:**
- First request: <1s
- Cached request: <100ms
- Cache headers present

**Validation:**
- Response time acceptable
- Cache-Control header present
- CDN-Cache-Control header present
- Second request faster (cache hit)

### Step 6: Verify on Real Devices

**Real-world testing:**

1. **Share on WhatsApp:**
   - Copy URL to WhatsApp chat
   - Verify preview appears
   - Check image loads
   - Verify quote readable

2. **Share on iMessage:**
   - Send URL in iMessage
   - Verify preview appears
   - Check image quality

3. **Share on Slack:**
   - Post URL in Slack channel
   - Verify unfurled preview
   - Check image and text

4. **Share on Discord:**
   - Post URL in Discord server
   - Verify embed shows
   - Check formatting

**Expected result:**
- All platforms show preview
- Image loads within 5s
- Quote is readable
- No broken images or missing data

### Step 7: SEO Validation

**Google Search Console:**
1. Submit URL for indexing
2. Use URL Inspection tool
3. Verify mobile-friendliness
4. Check for structured data

**Lighthouse SEO Audit:**
```bash
npm run build
npm start
# Run Lighthouse in Chrome DevTools
```

**Target:**
- SEO score: 100
- All meta descriptions present
- Social media tags valid

**Validation:**
- No SEO warnings
- All metadata present
- Mobile-friendly
- Performance optimal

---

## Testing Checklist

### Functional Tests

- [ ] OG image generates without date param (uses today)
- [ ] OG image generates with valid date param
- [ ] OG image falls back to today with invalid date param
- [ ] Cache headers present in response
- [ ] Quote matches the specified date
- [ ] Date label matches the specified date

### Metadata Validation

- [ ] `og:title` present in page source
- [ ] `og:type` = "website"
- [ ] `og:url` present (production domain)
- [ ] `og:image` URL includes date parameter
- [ ] `og:description` contains quote
- [ ] `og:site_name` = "Daily Demotivations"
- [ ] `og:locale` = "en_US"
- [ ] `og:image:width` = 1200
- [ ] `og:image:height` = 630
- [ ] `og:image:alt` descriptive
- [ ] `og:image:type` = "image/png"
- [ ] `twitter:card` = "summary_large_image"
- [ ] `twitter:title` present
- [ ] `twitter:description` present
- [ ] `twitter:image` URL present

### Platform Debuggers

- [ ] Facebook Debugger: No errors, preview shows correctly
- [ ] Twitter Card Validator: Large image card, no errors
- [ ] LinkedIn Inspector: Preview loads, no warnings
- [ ] OpenGraph Check: All platforms show preview

### Performance

- [ ] OG image generation <1s (first request)
- [ ] OG image generation <100ms (cached request)
- [ ] Cache-Control header present
- [ ] CDN-Cache-Control header present
- [ ] Page metadata generation doesn't slow page load

### Real-World Sharing

- [ ] WhatsApp: Preview appears with image
- [ ] iMessage: Preview appears with image
- [ ] Slack: Unfurled link shows image and quote
- [ ] Discord: Embed shows image and quote
- [ ] Facebook: Shared post shows preview
- [ ] Twitter: Tweet shows card with image
- [ ] LinkedIn: Post shows preview with image

### SEO

- [ ] Lighthouse SEO score 100
- [ ] All meta tags valid
- [ ] Mobile-friendly
- [ ] Structured data present (if applicable)

---

## Edge Cases & Pitfalls

### Edge Case 1: Date Parameter in Future

**Issue:** User requests OG image for date in future (e.g., `/api/og?date=2030-01-01`)

**Solution:**
- Allow future dates (quote selection is deterministic)
- Useful for scheduling social posts in advance

**Test:** Request OG image for date 1 year in future

### Edge Case 2: Date Parameter in Past (Before Project Launch)

**Issue:** User requests OG image for very old date (e.g., `/api/og?date=2000-01-01`)

**Solution:**
- Allow any valid date (quote selection wraps around)
- Every date has a quote, no matter how old

**Test:** Request OG image for date 10 years ago

### Edge Case 3: Social Platform Cache Stale

**Issue:** OG image updated but Facebook still shows old preview

**Solution:**
- Document cache invalidation process (Step 4)
- Use debugger tools to force refresh
- Consider versioning (`?v=2`) for breaking changes

**Test:** Update OG image, share URL, use debugger to force refresh

### Edge Case 4: Slow OG Scraper Timeout

**Issue:** Social platform scraper times out (>5s) when fetching OG image

**Solution:**
- Current implementation <1s (well under timeout)
- Monitor performance in production
- Alert if generation time >2s

**Test:** Throttle network, verify OG image still loads

### Edge Case 5: Invalid Characters in Quote

**Issue:** Quote contains characters that break OG metadata (e.g., quotes, angle brackets)

**Solution:**
- Next.js metadata API auto-escapes HTML entities
- Test with quote containing `"`, `<`, `>`, `&`

**Test:** Manually test with problematic characters

### Edge Case 6: Multiple Shares of Same URL

**Issue:** User shares URL multiple times, wants to force new preview

**Solution:**
- Social platforms cache by URL, not by time
- Same URL = same cached preview (expected behavior)
- To force refresh, use debugger tools

**Test:** Share URL twice, verify same preview (consistent)

### Edge Case 7: Vercel Edge Network Cache Miss

**Issue:** CDN cache miss causes slower response

**Solution:**
- Acceptable (cache warms up quickly)
- Monitor cache hit rate in Vercel dashboard
- Alert if hit rate <80%

**Test:** Clear Vercel CDN cache, verify first request slower

---

## Success Criteria

### Must Have (Blocking)

- ✅ All required OG tags present in page source
- ✅ Structured image properties added
- ✅ Date parameter support working
- ✅ Cache headers optimize performance
- ✅ Facebook Debugger shows no errors
- ✅ Twitter Card Validator shows no errors
- ✅ LinkedIn Inspector shows preview correctly
- ✅ Real device testing confirms previews work

### Should Have (Non-blocking but important)

- ✅ Cache invalidation process documented
- ✅ Performance monitoring set up
- ✅ SEO metadata complete
- ✅ All platforms (Slack, Discord, WhatsApp) show previews

### Nice to Have (Future enhancement)

- ⏳ Landscape background in OG image (v2)
- ⏳ A/B testing different OG images
- ⏳ Platform-specific image dimensions (LinkedIn 1200x627, Instagram 1080x1080)
- ⏳ Animated OG previews (video, if supported)

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Social platform cache issues** | Medium | Medium | Document cache invalidation, use debuggers |
| **OG image generation timeout** | Low | High | Monitor performance, alert if >2s |
| **Missing required tags** | Low | Medium | Validate with all debuggers pre-launch |
| **CDN cache miss rate high** | Low | Low | Monitor Vercel dashboard, adjust cache headers |
| **Quote contains breaking characters** | Low | Low | Test with problematic characters |
| **Date parameter malformed** | Medium | Low | Validation with fallback to today |

---

## Dependencies

### External Dependencies

- None (uses existing libraries from Phase 1)

### Internal Dependencies

- `src/lib/quotes.ts` - Quote selection logic
- `app/api/og/route.tsx` - Existing OG image generation

### Platform Dependencies

- Next.js Metadata API
- Vercel Edge Network (CDN)
- Social platform scrapers (Facebook, Twitter, LinkedIn)

---

## Rollback Plan

If OG enhancements cause issues:

1. **Revert page.tsx metadata** to Phase 1 version (remove structured properties)
2. **Revert app/api/og/route.tsx** to Phase 1 version (remove date parameter)
3. **Keep cache headers** (unlikely to cause issues)
4. **Test with debuggers** to confirm rollback worked

**Time to rollback:** <5 minutes

**Data loss:** None

---

## Monitoring & Observability

### Metrics to Track

1. **OG Image Performance:**
   - Request count per hour
   - Response time (p50, p95, p99)
   - Cache hit rate (%)
   - Error rate (%)

2. **Social Referral Traffic (Phase 3):**
   - Facebook referrals
   - Twitter referrals
   - LinkedIn referrals
   - Other referrals (WhatsApp, Slack, etc.)

3. **Debugger Validation:**
   - Last validation date for each platform
   - Errors/warnings from debuggers
   - Preview quality score (subjective)

### Logging

```typescript
// OG Route
console.log('[OG] Generated image', {
  date: dateParam || 'today',
  quote: quote.substring(0, 30) + '...',
  duration: Date.now() - startTime,
  cached: false, // Vercel edge caching happens at CDN level
});

// Invalid date warning
console.warn('[OG] Invalid date parameter', {
  date: dateParam,
  fallback: 'today',
});
```

### Alerting (Phase 3)

- Alert if OG image error rate >2%
- Alert if p95 response time >2s
- Alert if CDN cache hit rate <70%
- Weekly reminder to validate with debuggers

---

## Documentation

### User-Facing

Add to README.md:

```markdown
### Rich Social Previews

When you share Daily Demotivations on social media, a beautiful preview appears with:
- The day's demotivating quote in elegant typography
- Dark, moody gradient background
- Today's date
- Attribution to dailydemotivations.com

This works automatically on:
- Facebook (timeline posts, messages, comments)
- Twitter/X (tweets, DMs)
- LinkedIn (posts, articles)
- WhatsApp (chats)
- iMessage (texts)
- Slack (channels, DMs)
- Discord (servers, DMs)

No extra steps needed - just share the URL!
```

### Developer-Facing

Add to CONTRIBUTING.md or inline comments:

```typescript
/**
 * Open Graph Implementation
 * 
 * Daily Demotivations uses Open Graph protocol for rich link previews
 * on social platforms.
 * 
 * Key Files:
 * - app/page.tsx: generateMetadata() - Page-level OG tags
 * - app/api/og/route.tsx: Dynamic OG image generation
 * 
 * How It Works:
 * 1. User shares dailydemotivations.com URL
 * 2. Social platform scraper reads <meta property="og:*"> tags
 * 3. Platform fetches og:image URL (/api/og?date=YYYY-MM-DD)
 * 4. Edge function generates image with quote + date
 * 5. Platform displays preview with image + metadata
 * 
 * Caching Strategy:
 * - OG images cached 24h client-side, 1yr CDN-side
 * - Quote for a given date never changes (safe to cache aggressively)
 * - Social platforms cache 7-30 days (platform-dependent)
 * 
 * Testing:
 * - Facebook: https://developers.facebook.com/tools/debug/
 * - Twitter: https://cards-dev.twitter.com/validator
 * - LinkedIn: https://www.linkedin.com/post-inspector/
 * 
 * Cache Invalidation:
 * - Use debugger tools to force refresh
 * - Append ?v=2 to URL for breaking changes
 * - See README.md for detailed process
 */
```

---

## Related Plans

- **Plan 01:** Download Functionality (independent, both use image generation)
- **Plan 02:** Web Share API & Share Buttons (independent, benefits from better OG previews)

---

*Plan created: 2025-02-03*  
*Estimated effort: 3-4 hours*  
*Priority: Medium (enhances existing feature, improves virality)*  
*Dependencies: None (builds on Phase 1)*
