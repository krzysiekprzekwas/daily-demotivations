# Plan 01: Download Functionality

**Phase:** 2 - Social Sharing & Virality  
**Requirement:** SHARE-01  
**Plan:** 01 of 03  
**Status:** Not Started

---

## Overview

Implement server-side image download functionality that allows users to save the current quote+image as a PNG file. This enables offline sharing, Instagram uploads, and manual sharing workflows.

**Key Decision:** Use server-side generation (reusing OG image logic) rather than client-side Canvas rendering for reliability and code reuse.

---

## Requirements

### Functional Requirements

1. **Download Button**: User clicks button and image downloads to their device
2. **Image Format**: PNG with 1200x1200 square dimensions (optimal for Instagram)
3. **File Naming**: `daily-demotivation-YYYY-MM-DD.png` (unique per date)
4. **Content**: Quote overlaid on gradient background (matches OG image style)
5. **Loading State**: Show loading indicator while image generates
6. **Error Handling**: Show user-friendly error if download fails
7. **Browser Compatibility**: Works in Chrome, Safari, Firefox, Edge (90%+ coverage)

### Technical Requirements

1. **API Route**: `/api/download` endpoint that generates and serves image
2. **Reuse OG Logic**: Leverage existing Satori + @vercel/og setup from Phase 1
3. **Format Support**: PNG (primary), JPEG (future parameter support)
4. **Dimension Support**: Square 1200x1200 (primary), OG 1200x630 (future parameter)
5. **Response Headers**: Proper `Content-Disposition: attachment` header
6. **Caching**: Aggressive caching (24 hours) to reduce regeneration
7. **Date Parameter**: Support `?date=YYYY-MM-DD` for specific dates

### Non-Functional Requirements

1. **Performance**: Image generation <500ms (p95)
2. **Reliability**: 99%+ success rate
3. **Cache Hit Rate**: >80% after initial generation
4. **Error Monitoring**: Log failures for debugging
5. **Mobile Support**: Works on iOS Safari, Chrome Android

---

## Technical Design

### API Route Architecture

```typescript
// app/api/download/route.tsx

import { ImageResponse } from 'next/og';
import { getTodaysQuote, getQuoteForDate } from '@/lib/quotes';
import { format } from 'date-fns';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const formatParam = searchParams.get('format') || 'png'; // png or jpeg
    const widthParam = parseInt(searchParams.get('width') || '1200');
    const heightParam = parseInt(searchParams.get('height') || '1200');
    
    // Get quote for specific date or today
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const quote = dateParam ? getQuoteForDate(targetDate) : getTodaysQuote();
    const formattedDate = format(targetDate, 'MMMM d, yyyy');
    const filename = `daily-demotivation-${format(targetDate, 'yyyy-MM-dd')}.${formatParam}`;
    
    // Validate dimensions (prevent abuse)
    const width = Math.min(Math.max(widthParam, 400), 2400);
    const height = Math.min(Math.max(heightParam, 400), 2400);
    
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
            padding: width < 800 ? '40px' : '80px',
            position: 'relative',
          }}
        >
          {/* Date indicator */}
          <div
            style={{
              display: 'flex',
              fontSize: width < 800 ? 20 : 28,
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontWeight: 300,
              marginBottom: width < 800 ? 40 : 60,
            }}
          >
            {formattedDate}
          </div>

          {/* Quote text */}
          <div
            style={{
              display: 'flex',
              fontSize: width < 800 ? 48 : 64,
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
              fontSize: width < 800 ? 18 : 24,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            dailydemotivations.com
          </div>
        </div>
      ),
      {
        width,
        height,
        headers: {
          'Content-Type': formatParam === 'jpeg' ? 'image/jpeg' : 'image/png',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          'CDN-Cache-Control': 'public, max-age=31536000',
        },
      },
    );
    
    return imageResponse;
  } catch (error) {
    console.error('Download image generation failed:', error);
    
    return new Response('Failed to generate download image', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
```

### Component: DownloadButton

```typescript
// src/components/DownloadButton.tsx
'use client';

import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';

interface DownloadButtonProps {
  className?: string;
}

export function DownloadButton({ className = '' }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    
    try {
      // Generate download URL with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const downloadUrl = `/api/download?date=${dateStr}&format=png&width=1200&height=1200`;
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `daily-demotivation-${dateStr}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Success - browser will show download progress
      // No need to wait for download to complete
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`
          inline-flex items-center gap-2 px-6 py-3 
          bg-white/10 hover:bg-white/20 
          text-white font-medium rounded-lg
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          backdrop-blur-sm
          ${className}
        `}
        aria-label="Download quote as image"
      >
        <FiDownload className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
        {isDownloading ? 'Downloading...' : 'Download Image'}
      </button>
      
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Integration into QuoteDisplay

```typescript
// src/components/QuoteDisplay.tsx (updated)
import { format } from 'date-fns';
import { DownloadButton } from './DownloadButton';

interface QuoteDisplayProps {
  quote: string;
}

export default function QuoteDisplay({ quote }: QuoteDisplayProps) {
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Date indicator */}
      <time 
        dateTime={today.toISOString()}
        className="block text-white/70 text-sm sm:text-base tracking-widest uppercase font-light"
      >
        {formattedDate}
      </time>
      
      {/* Quote */}
      <blockquote 
        className="
          text-3xl sm:text-4xl md:text-5xl lg:text-6xl
          font-serif font-normal
          text-white 
          leading-relaxed 
          tracking-tight
          drop-shadow-2xl
          px-4
        "
      >
        "{quote}"
      </blockquote>
      
      {/* Download Button */}
      <div className="pt-8">
        <DownloadButton />
      </div>
      
      {/* Breathing room */}
      <div className="h-12" aria-hidden="true" />
    </div>
  );
}
```

---

## Implementation Steps

### Step 1: Create Download API Route

**File:** `app/api/download/route.tsx`

1. Copy structure from `app/api/og/route.tsx`
2. Add query parameter handling for date, format, width, height
3. Update JSX to use square dimensions (1200x1200)
4. Add `Content-Disposition: attachment` header
5. Add aggressive cache headers
6. Add error handling with 500 response

**Validation:**
- Test route directly: `http://localhost:3000/api/download`
- Verify PNG downloads automatically
- Check filename matches pattern
- Verify cache headers present

### Step 2: Install react-icons

```bash
npm install react-icons
```

**Why:** Need download icon (FiDownload from Feather Icons set)

### Step 3: Create DownloadButton Component

**File:** `src/components/DownloadButton.tsx`

1. Create client component with 'use client' directive
2. Add download handler that creates temporary anchor element
3. Add loading state (useState for isDownloading)
4. Add error state with user-friendly message
5. Style button with Tailwind (match site aesthetic)
6. Import and use FiDownload icon
7. Add aria-label for accessibility

**Validation:**
- Button renders on page
- Click triggers download
- Loading state shows during download
- Error state shows if API fails

### Step 4: Integrate into QuoteDisplay

**File:** `src/components/QuoteDisplay.tsx`

1. Import DownloadButton component
2. Add below quote, above breathing room
3. Wrap in container div for spacing
4. Test responsive layout

**Validation:**
- Button appears centered below quote
- Works on mobile and desktop
- Spacing looks correct

### Step 5: Cross-Browser Testing

Test on:
- ✅ Chrome (desktop)
- ✅ Safari (desktop)
- ✅ Firefox (desktop)
- ✅ Edge (desktop)
- ✅ iOS Safari (iPhone)
- ✅ Chrome Android (phone)

**Test cases:**
1. Click download → file downloads
2. Check filename matches `daily-demotivation-YYYY-MM-DD.png`
3. Open downloaded image → quote visible and readable
4. Test with popup blocker enabled
5. Test on slow connection (3G throttling)

**Fallback behavior:**
- If download attribute not supported → opens in new tab
- User can right-click → Save As

### Step 6: Error Handling & Monitoring

1. Add error boundary around DownloadButton (catch client errors)
2. Add console logging on download failure
3. Test error states:
   - API returns 500
   - Network timeout
   - Malformed URL

**Validation:**
- Error message displays to user
- Console shows detailed error for debugging
- Button re-enables after error

### Step 7: Performance Testing

1. Test download API response time:
   ```bash
   curl -w "%{time_total}\n" http://localhost:3000/api/download
   ```
   Target: <500ms

2. Test with concurrent requests (simulate multiple users)

3. Check cache headers:
   ```bash
   curl -I http://localhost:3000/api/download
   ```
   Verify `Cache-Control` present

4. Test cache hit (second request should be instant)

**Optimization if needed:**
- Pre-generate common dimensions
- In-memory cache with LRU eviction
- Streaming response (start download before full generation)

---

## Testing Checklist

### Functional Tests

- [ ] Download button visible on homepage
- [ ] Click download → PNG file downloads
- [ ] Filename matches `daily-demotivation-YYYY-MM-DD.png`
- [ ] Image contains correct quote for today
- [ ] Image dimensions are 1200x1200
- [ ] Quote is readable (sufficient contrast, size)
- [ ] Date label shows correct date
- [ ] Attribution footer shows "dailydemotivations.com"

### Browser Compatibility

- [ ] Chrome Desktop: Download works
- [ ] Safari Desktop: Download works
- [ ] Firefox Desktop: Download works
- [ ] Edge Desktop: Download works
- [ ] iOS Safari: Download works (may prompt for location)
- [ ] Chrome Android: Download works (saves to Downloads folder)

### Error Handling

- [ ] API returns 500 → user sees error message
- [ ] Network timeout → user sees error message
- [ ] Invalid date parameter → returns today's quote
- [ ] Missing date parameter → returns today's quote
- [ ] Button disabled during download
- [ ] Multiple rapid clicks handled gracefully

### Performance

- [ ] Download API responds in <500ms (p95)
- [ ] Second request (cache hit) responds in <100ms
- [ ] No memory leaks on repeated downloads
- [ ] Concurrent requests don't timeout

### Accessibility

- [ ] Button has aria-label
- [ ] Button keyboard accessible (tab + enter)
- [ ] Focus indicator visible
- [ ] Error message announced by screen reader (role="alert")
- [ ] Loading state announced

### Mobile-Specific

- [ ] Touch target at least 44x44px
- [ ] Download works on cellular data
- [ ] File saves to correct location (Photos/Downloads)
- [ ] Works in iOS "Guided Access" mode
- [ ] Works with Android "Data Saver" enabled

---

## Edge Cases & Pitfalls

### Edge Case 1: Popup Blockers

**Issue:** Some browsers/extensions block programmatic downloads

**Solution:** 
- Use `<a>` element with `download` attribute (allowed by most blockers)
- If blocked, show message: "Download blocked. Please allow downloads and try again."

**Test:** Enable popup blocker, attempt download

### Edge Case 2: iOS Download Location

**Issue:** iOS doesn't have a traditional file system - downloads may go to Files app or iCloud

**Solution:**
- Accept iOS behavior (standard across all web apps)
- Consider adding help text: "Image will save to your Photos app"

**Test:** Download on iPhone, verify file location

### Edge Case 3: Date Parameter Validation

**Issue:** Malicious user passes `?date=<script>alert(1)</script>`

**Solution:**
- Date validation in API route
- If invalid, return today's quote
- Never render date parameter unsanitized

**Test:** Pass malformed date, verify no error

### Edge Case 4: Very Long Quotes

**Issue:** Quote longer than screen → text overflow/truncation in image

**Solution:**
- Current quotes all fit in 1200x1200 (tested in Phase 1)
- Add CSS `word-wrap: break-word` to JSX styles
- Future: Dynamic font sizing based on quote length

**Test:** Manually test with longest quote in collection

### Edge Case 5: Slow Network

**Issue:** Download takes >10s on 3G → user thinks it failed

**Solution:**
- Show loading state immediately on click
- Add timeout after 15s with retry option
- Use streaming if possible (start download before fully generated)

**Test:** Chrome DevTools → Network throttling (Slow 3G)

### Edge Case 6: Caching Across Date Boundary

**Issue:** User visits at 11:59pm, downloads quote, then refreshes at 12:01am → cached old quote

**Solution:**
- Include date in cache key (URL param)
- Cache invalidation happens naturally (different date = different URL)
- No action needed (already handled)

**Test:** Mock system time, verify correct quote

---

## Success Criteria

### Must Have (Blocking)

- ✅ Download button renders on homepage
- ✅ Click triggers PNG download
- ✅ Image contains correct quote and date
- ✅ Works in Chrome, Safari, Firefox, Edge (desktop + mobile)
- ✅ API responds in <500ms (p95)
- ✅ Error states handled gracefully

### Should Have (Non-blocking but important)

- ✅ Cache hit rate >80%
- ✅ Download works on iOS/Android
- ✅ Accessibility compliant (WCAG AA)
- ✅ Loading state shows user feedback

### Nice to Have (Future enhancement)

- ⏳ Multiple format support (JPEG, WebP)
- ⏳ Multiple dimension support (Instagram Story, Twitter, etc.)
- ⏳ Download history (show user which quotes they've downloaded)
- ⏳ Batch download (download all quotes from past week)

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **API timeout on Vercel serverless** | Low | High | Aggressive caching, monitor response times |
| **CORS issues with download** | Low | Medium | Download is same-origin, no CORS needed |
| **Image generation fails** | Low | High | Comprehensive error handling, fallback message |
| **Download blocked by browser** | Medium | Medium | Use `<a download>` (usually allowed), show instructions |
| **Mobile file system confusion** | Medium | Low | Accept platform defaults, add help text |

---

## Dependencies

### External Dependencies

- `react-icons` (new) - Download icon
- `@vercel/og` (existing) - Image generation
- `date-fns` (existing) - Date formatting

### Internal Dependencies

- `src/lib/quotes.ts` - Quote selection logic
- `app/api/og/route.tsx` - Image generation pattern (reference)

### Platform Dependencies

- Vercel Edge Runtime - API route execution
- Next.js 16 - ImageResponse API

---

## Rollback Plan

If download functionality causes issues:

1. **Remove DownloadButton** from QuoteDisplay component
2. **Keep API route** (doesn't affect homepage if unused)
3. **Revert QuoteDisplay.tsx** to Phase 1 version
4. **Monitor:** Check if other sharing features still work

**Time to rollback:** <5 minutes (git revert + deploy)

**Data loss:** None (no database, no user data)

---

## Monitoring & Observability

### Metrics to Track

1. **Download API Metrics:**
   - Request count per hour
   - Response time (p50, p95, p99)
   - Error rate
   - Cache hit rate

2. **User Engagement:**
   - Download button click rate (% of visitors)
   - Downloads per session
   - Time to first download (from page load)

3. **Performance:**
   - Image generation time
   - Memory usage
   - Serverless cold start frequency

### Logging

**API Route:**
```typescript
console.log('[Download] Generate image', {
  date: dateStr,
  format: formatParam,
  dimensions: `${width}x${height}`,
  duration: Date.now() - startTime,
});
```

**Client:**
```typescript
console.log('[Download] Button clicked', {
  timestamp: Date.now(),
});
```

### Alerting (Phase 3)

- Alert if error rate >5%
- Alert if p95 response time >1s
- Alert if cache hit rate <70%

---

## Documentation

### User-Facing

Add to README.md:

```markdown
### Download Quotes

Click the "Download Image" button below any quote to save it as a PNG image. Perfect for:
- Sharing on Instagram
- Setting as desktop wallpaper
- Sending via email or messaging apps
- Offline viewing

Downloaded images are 1200x1200 pixels and include the quote, date, and attribution.
```

### Developer-Facing

Add to inline comments:

```typescript
/**
 * Download API Route
 * 
 * Generates a downloadable image of the quote for the specified date.
 * Reuses OG image generation logic but with square dimensions for Instagram.
 * 
 * Query Parameters:
 * - date: YYYY-MM-DD (optional, defaults to today)
 * - format: png|jpeg (optional, defaults to png)
 * - width: 400-2400 (optional, defaults to 1200)
 * - height: 400-2400 (optional, defaults to 1200)
 * 
 * Response:
 * - Content-Type: image/png or image/jpeg
 * - Content-Disposition: attachment (triggers download)
 * - Cache-Control: 24 hour cache
 * 
 * @example
 * GET /api/download?date=2025-02-03&format=png&width=1200&height=1200
 */
```

---

## Related Plans

- **Plan 02:** Web Share API & Share Buttons (depends on Plan 01 for file sharing)
- **Plan 03:** OG Image Enhancements (independent, can run in parallel)

---

*Plan created: 2025-02-03*  
*Estimated effort: 4-6 hours*  
*Priority: High (blocks Plan 02 file sharing)*
