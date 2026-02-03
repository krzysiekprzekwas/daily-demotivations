# Execution Plan 05: Frontend Integration & Deployment

**Phase:** V2 Phase 1 - Content Management System  
**Plan:** 05 of 05  
**Status:** Ready for Execution  
**Date:** 2025-02-03

---

## 1. Goal

Integrate the CMS database with the public-facing frontend, replacing hardcoded quotes with database-driven content. Implement graceful fallback logic to ensure zero-downtime deployment. Add feature flags for gradual rollout, comprehensive monitoring, and a rollback plan. Complete Phase 1 with a production-ready CMS.

---

## 2. Requirements Covered

- **DATA-03:** Fallback to hardcoded quotes (graceful degradation)
- **DATA-04:** Fallback to Unsplash random images
- **CMS-04:** Complete database migration from hardcoded to persistent storage

---

## 3. Dependencies

**Prerequisites:**
- ✅ Plan 01 completed (database with seeded quotes)
- ✅ Plan 02 completed (authentication working)
- ✅ Plan 03 completed (quotes & images manageable)
- ✅ Plan 04 completed (pairings created)

**Critical Requirements:**
- At least 30 quotes in database (seeded from `QUOTES` array)
- At least 1 pairing exists (or fallback logic handles empty DB)

---

## 4. Estimated Time

- **Data Service Layer:** 2 hours (quote/image fetching with fallbacks)
- **Frontend Integration:** 1.5 hours (update `app/page.tsx`)
- **Feature Flag:** 30 minutes (environment variable toggle)
- **Testing:** 2 hours (all fallback scenarios, edge cases)
- **Deployment:** 1 hour (production deploy, monitoring setup)
- **Documentation:** 1 hour (README, rollback procedures)
- **Total:** 8 hours

---

## 5. Deliverables

### 5.1 Data Service Layer
- [ ] `src/lib/quotes-service.ts` - Database-first quote fetching
- [ ] `src/lib/images-service.ts` - Database-first image fetching
- [ ] Graceful fallback to hardcoded data
- [ ] Timeout handling (5 seconds max)

### 5.2 Frontend Integration
- [ ] Update `app/page.tsx` to use new service layer
- [ ] Maintain ISR configuration (24h revalidate)
- [ ] Update `app/api/og/route.tsx` for OG images
- [ ] Test metadata generation

### 5.3 Feature Flag
- [ ] `USE_DATABASE` environment variable
- [ ] Toggle between database and hardcoded quotes
- [ ] Document flag usage

### 5.4 Monitoring & Deployment
- [ ] Database connection health check endpoint
- [ ] Error logging for fallback events
- [ ] Production deployment checklist
- [ ] Rollback procedure documentation

### 5.5 Documentation
- [ ] Update main README with CMS instructions
- [ ] Admin user guide (how to use CMS)
- [ ] Environment variables reference
- [ ] Troubleshooting guide

---

## 6. Technical Approach

### 6.1 Quote Service Layer

**File: `src/lib/quotes-service.ts`**

```typescript
import { prisma } from './prisma';
import { QUOTES } from './quotes';
import { format } from 'date-fns';

/**
 * Result type for quote fetching
 */
export interface QuoteResult {
  text: string;
  author: string | null;
  source: 'database' | 'fallback';
}

/**
 * Get quote for specific date
 * Tries database first, falls back to hardcoded QUOTES array
 * 
 * @param date - Date to fetch quote for
 * @returns Quote with source indicator
 */
export async function getQuoteForDate(date: Date): Promise<QuoteResult> {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Feature flag check (optional)
  if (process.env.USE_DATABASE === 'false') {
    console.log('[Quotes] Database disabled via feature flag, using fallback');
    return getFallbackQuote(dateStr);
  }
  
  try {
    // Strategy 1: Try to get pairing for this exact date
    const pairing = await Promise.race([
      prisma.pairing.findUnique({
        where: { date: new Date(dateStr + 'T00:00:00.000Z') },
        include: {
          quote: {
            select: {
              text: true,
              author: true,
              active: true,
            },
          },
        },
      }),
      // 5 second timeout
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      ),
    ]);
    
    if (pairing?.quote?.active) {
      console.log(`[Quotes] Using database pairing for ${dateStr}`);
      return {
        text: pairing.quote.text,
        author: pairing.quote.author,
        source: 'database',
      };
    }
    
    // Strategy 2: No pairing - use deterministic selection from database
    console.log(`[Quotes] No pairing for ${dateStr}, using deterministic selection`);
    
    const allQuotes = await Promise.race([
      prisma.quote.findMany({
        where: { active: true },
        select: { text: true, author: true },
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      ),
    ]);
    
    if (allQuotes && allQuotes.length > 0) {
      // Use same hash algorithm as fallback for consistency
      const index = hashDateToIndex(dateStr, allQuotes.length);
      return {
        text: allQuotes[index].text,
        author: allQuotes[index].author,
        source: 'database',
      };
    }
    
    // No quotes in database - fall back
    console.warn('[Quotes] No quotes in database, using fallback');
    return getFallbackQuote(dateStr);
    
  } catch (error) {
    console.error('[Quotes] Database error, using fallback:', error);
    return getFallbackQuote(dateStr);
  }
}

/**
 * Get today's quote (convenience wrapper)
 */
export async function getTodaysQuote(): Promise<QuoteResult> {
  return getQuoteForDate(new Date());
}

/**
 * Fallback to hardcoded quotes array
 * Uses same deterministic algorithm as original implementation
 */
function getFallbackQuote(dateStr: string): QuoteResult {
  const index = hashDateToIndex(dateStr, QUOTES.length);
  return {
    text: QUOTES[index],
    author: null,
    source: 'fallback',
  };
}

/**
 * Hash date string to array index (deterministic)
 * Same algorithm as original getTodaysQuote()
 */
function hashDateToIndex(dateStr: string, arrayLength: number): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % arrayLength;
}
```

**Key Design Decisions:**

1. **Database-First with Fallback**
   - Try pairing first (most specific)
   - Fall back to deterministic database selection
   - Finally fall back to hardcoded array

2. **5-Second Timeout**
   - Prevents hanging on slow database
   - Fast fail to fallback ensures site stays responsive
   - Uses `Promise.race()` pattern

3. **Feature Flag**
   - `USE_DATABASE=false` disables database entirely
   - Useful for testing fallback logic
   - Emergency kill switch if database fails

4. **Consistent Hashing**
   - Same algorithm for database and fallback
   - Same date always returns same quote (until pairing created)
   - Smooth transition as pairings are added

### 6.2 Image Service Layer

**File: `src/lib/images-service.ts`**

```typescript
import { prisma } from './prisma';
import { getRandomLandscape } from './unsplash';
import { format } from 'date-fns';
import type { LandscapePhoto } from '@/types';

/**
 * Extended photo type with source indicator
 */
export interface PhotoResult extends LandscapePhoto {
  source: 'database' | 'unsplash';
}

/**
 * Get image for specific date
 * Tries paired database image first, falls back to Unsplash random
 * 
 * @param date - Date to fetch image for
 * @returns Photo with source indicator
 */
export async function getImageForDate(date: Date): Promise<PhotoResult> {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Feature flag check
  if (process.env.USE_DATABASE === 'false') {
    console.log('[Images] Database disabled, using Unsplash fallback');
    return getUnsplashFallback();
  }
  
  try {
    // Try to get pairing for this date
    const pairing = await Promise.race([
      prisma.pairing.findUnique({
        where: { date: new Date(dateStr + 'T00:00:00.000Z') },
        include: {
          image: {
            select: {
              url: true,
              photographerName: true,
              photographerUrl: true,
              active: true,
            },
          },
        },
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      ),
    ]);
    
    if (pairing?.image?.active) {
      console.log(`[Images] Using database image for ${dateStr}`);
      
      // Optional: Validate image URL is accessible
      // Skipped per decision - trust admin input
      
      return {
        url: pairing.image.url,
        photographer: pairing.image.photographerName,
        photographerUrl: pairing.image.photographerUrl || '',
        alt: 'Romantic landscape background',
        downloadUrl: '', // Not applicable for custom images
        source: 'database',
      };
    }
    
    // No pairing for this date - fall back to Unsplash
    console.log(`[Images] No image pairing for ${dateStr}, using Unsplash`);
    return getUnsplashFallback();
    
  } catch (error) {
    console.error('[Images] Database error, using Unsplash fallback:', error);
    return getUnsplashFallback();
  }
}

/**
 * Get today's image (convenience wrapper)
 */
export async function getTodaysImage(): Promise<PhotoResult> {
  return getImageForDate(new Date());
}

/**
 * Fallback to Unsplash random landscape
 */
async function getUnsplashFallback(): Promise<PhotoResult> {
  const unsplashPhoto = await getRandomLandscape();
  return {
    ...unsplashPhoto,
    source: 'unsplash',
  };
}
```

### 6.3 Update Homepage

**File: `app/page.tsx`**

```typescript
import { getTodaysQuote } from '@/lib/quotes-service'; // Changed from './quotes'
import { getTodaysImage } from '@/lib/images-service'; // New service
import { triggerDownload } from '@/lib/unsplash';
import QuoteDisplay from '@/components/QuoteDisplay';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

// ISR: Regenerate page every 24 hours
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const quote = await getTodaysQuote(); // Now async
  
  return {
    title: 'Daily Demotivations',
    description: quote.text, // Use quote.text instead of string
    openGraph: {
      title: 'Daily Demotivations',
      description: quote.text,
      url: '/',
      images: [
        {
          url: '/api/og',
          width: 1200,
          height: 630,
          alt: quote.text,
          type: 'image/png',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Daily Demotivations',
      description: quote.text,
      images: ['/api/og'],
    },
  };
}

export default async function HomePage() {
  // Fetch quote and image (both with fallbacks)
  const quote = await getTodaysQuote();
  const image = await getTodaysImage();
  
  // Trigger Unsplash download tracking (only for Unsplash images)
  if (image.source === 'unsplash' && image.downloadUrl) {
    await triggerDownload(image.downloadUrl);
  }
  
  // Log source for monitoring (remove in production if too verbose)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Homepage] Quote source: ${quote.source}, Image source: ${image.source}`);
  }
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background landscape with darkening overlay */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${image.url})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Main content - centered quote */}
      <main className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
        <QuoteDisplay quote={quote.text} />
      </main>
      
      {/* Footer with attribution */}
      <Footer 
        photographer={image.photographer}
        photographerUrl={image.photographerUrl}
      />
    </div>
  );
}
```

**Changes from Original:**
- `getTodaysQuote()` is now async (returns `Promise<QuoteResult>`)
- `getTodaysImage()` replaces `getRandomLandscape()`
- Download tracking only for Unsplash images (not database images)
- Added development logging for monitoring

### 6.4 Update OG Image Route

**File: `app/api/og/route.tsx`**

```typescript
import { ImageResponse } from '@vercel/og';
import { getTodaysQuote } from '@/lib/quotes-service'; // Changed

export const runtime = 'edge';

export async function GET() {
  const quote = await getTodaysQuote(); // Now async
  
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
          padding: '80px',
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            maxWidth: '90%',
            lineHeight: 1.4,
          }}
        >
          {quote.text}
        </div>
        {quote.author && (
          <div
            style={{
              fontSize: 32,
              color: '#999',
              marginTop: 40,
            }}
          >
            — {quote.author}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### 6.5 Feature Flag Configuration

**Environment Variables:**

```bash
# .env.local (development)
USE_DATABASE=true  # Enable database-driven content

# To test fallback logic
USE_DATABASE=false  # Disable database, use hardcoded quotes
```

**Vercel Production:**
```bash
# Enable database (default)
vercel env add USE_DATABASE true

# Emergency fallback (if database fails)
vercel env add USE_DATABASE false
```

### 6.6 Health Check Endpoint

**File: `app/api/health/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

/**
 * Health check endpoint
 * Tests database connectivity and returns status
 */
export async function GET() {
  const status = {
    timestamp: new Date().toISOString(),
    database: 'unknown' as 'healthy' | 'degraded' | 'down',
    quotes: 0,
    images: 0,
    pairings: 0,
  };
  
  try {
    // Test database connection (with timeout)
    const result = await Promise.race([
      Promise.all([
        prisma.quote.count({ where: { active: true } }),
        prisma.image.count({ where: { active: true } }),
        prisma.pairing.count(),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ]);
    
    status.database = 'healthy';
    status.quotes = result[0];
    status.images = result[1];
    status.pairings = result[2];
    
    return NextResponse.json(status, { status: 200 });
    
  } catch (error) {
    status.database = 'down';
    
    return NextResponse.json(
      { ...status, error: (error as Error).message },
      { status: 503 }
    );
  }
}
```

**Usage:**
```bash
# Check health
curl https://daily-demotivations.vercel.app/api/health

# Expected response (healthy)
{
  "timestamp": "2025-02-03T12:00:00.000Z",
  "database": "healthy",
  "quotes": 30,
  "images": 5,
  "pairings": 10
}

# Response when database down
{
  "timestamp": "2025-02-03T12:00:00.000Z",
  "database": "down",
  "quotes": 0,
  "images": 0,
  "pairings": 0,
  "error": "Connection timeout"
}
```

---

## 7. Testing Checklist

### 7.1 Database-Driven Content
- [ ] Create pairing for today → homepage shows paired quote + image
- [ ] Create pairing for tomorrow → verify via date override
- [ ] No pairing for date → shows deterministic quote from database
- [ ] Database empty → falls back to hardcoded QUOTES array

### 7.2 Fallback Scenarios
- [ ] Database connection fails → site shows hardcoded quote
- [ ] Database timeout (>5s) → fast fallback, site responsive
- [ ] Quote pairing exists but image missing → Unsplash fallback
- [ ] Image pairing exists but quote missing → hardcoded fallback
- [ ] Both pairings missing → both fallbacks

### 7.3 Feature Flag
- [ ] `USE_DATABASE=true` → uses database
- [ ] `USE_DATABASE=false` → uses hardcoded quotes
- [ ] Environment variable missing → defaults to database mode
- [ ] Toggle flag in production → site switches sources

### 7.4 Metadata & OG Images
- [ ] OG image generates with database quote
- [ ] OG image falls back if database down
- [ ] Metadata description uses database quote
- [ ] Twitter card preview correct

### 7.5 ISR Caching
- [ ] Page regenerates every 24 hours
- [ ] New pairing appears after cache expires
- [ ] Manual revalidation works: `revalidatePath('/')`
- [ ] Fallback doesn't break cache

### 7.6 Performance
- [ ] Homepage loads < 500ms (database query)
- [ ] Homepage loads < 200ms (fallback)
- [ ] Database timeout doesn't block page load
- [ ] No N+1 queries (check Prisma logs)

### 7.7 Admin Workflow
- [ ] Create quote → appears in deterministic rotation
- [ ] Create image → available for pairing
- [ ] Create pairing for today → immediately visible on homepage (after cache)
- [ ] Edit pairing → changes reflect after cache
- [ ] Delete pairing → reverts to deterministic selection

### 7.8 Error Handling
- [ ] Database connection error → logs error, uses fallback
- [ ] Invalid date format → handles gracefully
- [ ] Missing environment variables → clear error message
- [ ] Prisma query errors → caught and logged

---

## 8. Risks

### 8.1 Database Downtime Breaking Site

**Risk:** Database unavailable, site shows errors  
**Likelihood:** Low  
**Impact:** Critical (site down)  

**Mitigation:**
- ✅ Graceful fallback to hardcoded quotes
- ✅ 5-second timeout prevents hanging
- ✅ Feature flag for emergency disable
- ✅ Health check endpoint monitors status

**Recovery Time:** Instant (fallback automatic)

### 8.2 Cache Invalidation Issues

**Risk:** New pairing doesn't appear (ISR cache stale)  
**Likelihood:** Medium  
**Impact:** Low (quote updates within 24h)  

**Mitigation:**
- ISR set to 24 hours (reasonable for daily quotes)
- Admin can manually revalidate: `revalidatePath('/')`
- Future: Add "Preview" button in admin to see changes

### 8.3 Performance Degradation

**Risk:** Database queries slow down homepage  
**Likelihood:** Low  
**Impact:** Medium (user experience)  

**Mitigation:**
- Database queries optimized with indexes
- ISR caching reduces database load (1 query per 24h per region)
- Timeout ensures fast fallback
- Monitor with Vercel Analytics

**Acceptable Load:**
- Cold start: < 500ms
- Warm cache: < 50ms (ISR served from edge)

### 8.4 Data Inconsistency

**Risk:** Different quotes shown based on cache state  
**Likelihood:** Low  
**Impact:** Low (minor UX issue)  

**Mitigation:**
- ISR ensures eventual consistency
- All regions see same content (after cache refresh)
- No user-specific customization (same for everyone)

### 8.5 Migration Breaking Existing Links

**Risk:** OG image URLs break (social media previews)  
**Likelihood:** Low  
**Impact:** Low (social cards show generic image)  

**Mitigation:**
- OG route path unchanged: `/api/og`
- Graceful fallback ensures OG always works
- Social platforms re-fetch after changes

---

## 9. Rollback

### 9.1 Emergency Rollback (Feature Flag)

**Fastest option (no deploy needed):**

```bash
# Disable database via Vercel Dashboard
vercel env add USE_DATABASE false

# Or via CLI
vercel env rm USE_DATABASE
vercel env add USE_DATABASE false

# Changes take effect on next request (no redeploy)
```

**Result:** Site immediately uses hardcoded quotes, zero downtime.

### 9.2 Code Rollback (Git Revert)

**If integration code has bugs:**

```bash
# Revert to Plan 04 state
git revert HEAD

# Deploy previous version
vercel --prod

# Estimated downtime: 2-3 minutes (deploy time)
```

### 9.3 Partial Rollback (Quotes Only)

**Keep database for admin, disable for frontend:**

```typescript
// src/lib/quotes-service.ts
export async function getTodaysQuote(): Promise<QuoteResult> {
  // Force fallback temporarily
  return getFallbackQuote(format(new Date(), 'yyyy-MM-dd'));
}
```

**Result:** Admin CMS still works, frontend uses hardcoded quotes.

### 9.4 Database Rollback

**If database data corrupted:**

```sql
-- Drop all pairings
DELETE FROM pairings;

-- Reset quotes to original 30
DELETE FROM quotes;
-- Then re-run seed: npm run db:seed

-- Keep images (independent)
```

### 9.5 Complete Rollback

**Nuclear option (return to pre-CMS state):**

```bash
# Remove all CMS code
git checkout v1.0.0  # Tag before CMS work

# Remove database (optional)
# Via Vercel Dashboard: Storage → Delete Database

# Deploy old version
vercel --prod

# Estimated downtime: 3-5 minutes
```

---

## 10. Success Criteria

✅ Plan is complete when:

1. **Frontend Integration Works**
   - Homepage displays database quotes (when paired)
   - Homepage displays database images (when paired)
   - Deterministic fallback works (no pairing)
   - Hardcoded fallback works (database down)

2. **Graceful Degradation**
   - Database errors don't break site
   - Timeout fast-fails to fallback
   - Site responsive even with database issues
   - Error logging captures failures

3. **Feature Flag Operational**
   - `USE_DATABASE=true` enables database
   - `USE_DATABASE=false` disables database
   - Toggle works without code changes
   - Emergency rollback < 1 minute

4. **Performance Acceptable**
   - Homepage loads < 500ms (database)
   - Homepage loads < 200ms (fallback)
   - ISR caching works (24h revalidate)
   - No blocking queries

5. **Admin Workflow Complete**
   - Quote created → appears on site (after cache)
   - Image created → available for pairing
   - Pairing created → shows on homepage
   - Edit pairing → updates homepage
   - Delete pairing → reverts to deterministic

6. **Monitoring & Observability**
   - Health check endpoint responds
   - Error logs captured
   - Source logging (database vs fallback)
   - Vercel Analytics tracking

7. **Documentation Complete**
   - README updated with CMS instructions
   - Environment variables documented
   - Rollback procedures documented
   - Admin user guide written

---

## 11. Post-Deployment Checklist

After deploying to production:

### Immediate (0-1 hour)
- [ ] Verify homepage loads successfully
- [ ] Check health endpoint: `https://site.vercel.app/api/health`
- [ ] Test admin login: `https://site.vercel.app/admin`
- [ ] Create test pairing for tomorrow
- [ ] Monitor Vercel logs for errors

### Short-term (1-24 hours)
- [ ] Wait for ISR cache to expire (24h)
- [ ] Verify test pairing appears on homepage
- [ ] Monitor database usage (Vercel Dashboard → Storage)
- [ ] Check Vercel Analytics for traffic patterns
- [ ] Test fallback by disabling database (`USE_DATABASE=false`)

### Long-term (1-7 days)
- [ ] Create pairings for next 7 days
- [ ] Monitor error rates (should be near zero)
- [ ] Collect admin feedback (if applicable)
- [ ] Review database query performance
- [ ] Plan next phase (v2 Phase 2: Social Sharing)

---

## 12. Documentation Updates

### 12.1 README.md

Add to main README:

```markdown
## Content Management System

Daily Demotivations now includes an admin CMS for managing quotes, images, and daily pairings.

### Admin Access

1. Visit `/admin` and log in with admin password
2. Manage quotes: `/admin/quotes`
3. Manage images: `/admin/images`
4. Create pairings: `/admin/pairings`

### Environment Variables

```bash
# Database (Vercel Postgres)
DATABASE_URL="<vercel postgres pooled URL>"
DIRECT_DATABASE_URL="<vercel postgres direct URL>"

# Authentication
ADMIN_PASSWORD="<strong password 12+ chars>"
SESSION_SECRET="<32+ character secret>"

# Feature Flags
USE_DATABASE="true"  # Enable database-driven content

# Existing
UNSPLASH_ACCESS_KEY="<your key>"
```

### Graceful Fallbacks

- **Database down?** Site automatically uses hardcoded quotes
- **No pairing for date?** Deterministic selection from database
- **No database quotes?** Falls back to original 30 quotes
- **Image unavailable?** Falls back to Unsplash random

### 5-Day Repetition Rule

Quotes cannot be used within 5 days of each other. The CMS enforces this rule when creating pairings.

### Monitoring

Check system health: `GET /api/health`

```json
{
  "timestamp": "2025-02-03T12:00:00.000Z",
  "database": "healthy",
  "quotes": 30,
  "images": 5,
  "pairings": 10
}
```
```

### 12.2 Admin User Guide

**File: `.planning/ADMIN_GUIDE.md`**

```markdown
# Admin User Guide

## Getting Started

1. Navigate to `/admin`
2. Enter admin password (stored securely in environment variables)
3. You're logged in for 24 hours

## Managing Quotes

### Add New Quote
1. Go to "Quotes" → "Add New Quote"
2. Enter quote text (required, max 500 characters)
3. Add author (optional)
4. Click "Create Quote"

**Duplicate Detection:** The system prevents exact duplicate quotes (case-insensitive).

### Edit Quote
1. Find quote in list
2. Click "Edit"
3. Make changes
4. Click "Update Quote"

⚠️ **Warning:** Editing a quote updates it everywhere (all pairings).

### Delete Quote
1. Click "Edit" on quote
2. Scroll to "Danger Zone"
3. Click "Delete Quote" → Confirm

⚠️ **Warning:** Deleting a quote removes all its pairings.

## Managing Images

### Add New Image
1. Go to "Images" → "Add New Image"
2. Copy image URL from Unsplash (recommended)
3. Enter photographer name and URL for attribution
4. Select source (Unsplash, Pexels, or Custom)
5. Click "Add Image"

**Unsplash Tips:**
- Search: [unsplash.com/s/photos/landscape](https://unsplash.com/s/photos/landscape)
- Right-click → "Copy Image Address"
- Landscape orientation recommended (16:9 or wider)

## Creating Pairings

### Pair Quote + Image for Specific Date
1. Go to "Pairings" → "Create Pairing"
2. Select date (future dates recommended)
3. Choose quote from dropdown
4. Choose image from dropdown
5. Click "Create Pairing"

**5-Day Rule:** Quotes cannot be used within 5 days of each other. The system will block this with an error message.

### Edit Pairing
1. Find pairing in list
2. Click "Edit"
3. Change date, quote, or image
4. Click "Update Pairing"

### Delete Pairing
1. Click "Edit" on pairing
2. Click "Delete Pairing" → Confirm

**Note:** Deleting a pairing doesn't delete the quote or image, just the assignment.

## Dashboard

The dashboard shows:
- **Stats:** Total quotes, images, and pairings
- **Upcoming:** Next 7 days of pairings
- **Quick Actions:** Links to create content

## Tips & Best Practices

### Planning Content
- Create pairings 7-14 days in advance
- Keep a buffer of unpaired quotes and images
- Review upcoming pairings weekly

### Quote Writing
- Keep quotes concise (under 100 characters ideal)
- Ironic pessimism works best
- Test readability on mobile

### Image Selection
- Landscape orientation only
- High contrast for text overlay
- Avoid busy/cluttered images

### 5-Day Rule
- Plan quote rotation to avoid repetition
- Use "Upcoming Pairings" view to check spacing
- System enforces rule automatically

## Troubleshooting

### "Quote already exists"
- Exact duplicate detected (case-insensitive)
- Edit existing quote or change text slightly

### "Date already has a pairing"
- Only one pairing per date allowed
- Edit existing pairing or choose different date

### "5-day separation required"
- Quote used within ±5 days of target date
- Choose different quote or date at least 6 days away

### "Session expired"
- You're logged out after 24 hours
- Simply log in again (password manager recommended)

## Support

Questions? Check:
1. This guide
2. Main README.md
3. Contact developer: [your contact info]
```

---

## 13. Final Validation

Before marking Phase 1 complete:

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console.error in production (except intentional logging)
- [ ] All Prisma queries optimized
- [ ] Environment variables documented

### Functionality
- [ ] All 5 plans completed
- [ ] All 18 requirements covered (CMS + DB + AUTH + DATA)
- [ ] End-to-end workflow tested (create quote → pair → display)
- [ ] Fallbacks tested (database down scenario)

### Performance
- [ ] Homepage load < 500ms (database)
- [ ] Homepage load < 200ms (fallback)
- [ ] Admin CMS responsive (all CRUD < 200ms)
- [ ] No blocking queries

### Security
- [ ] Admin routes protected
- [ ] Session encryption working
- [ ] CSRF protection enabled
- [ ] Secure cookies in production

### Documentation
- [ ] README updated
- [ ] Admin guide written
- [ ] Environment variables documented
- [ ] Rollback procedures documented

### Deployment
- [ ] Production deployment successful
- [ ] Health check endpoint responds
- [ ] Monitoring enabled (Vercel Analytics)
- [ ] Error logging configured

---

## 14. Known Limitations

Document for future phases:

1. **No bulk operations**
   - Can't create multiple pairings at once
   - Can't assign random pairings for date range
   - **Future:** Add "Auto-fill next 30 days" feature

2. **No quote search**
   - Must scroll through paginated list
   - Dropdown limited to 100 items
   - **Future:** Add search/filter functionality

3. **No image preview in list**
   - Grid view only
   - No lightbox for full-size preview
   - **Future:** Add modal preview

4. **No analytics in CMS**
   - Can't see which quotes are most used
   - No pairing usage statistics
   - **Future:** Add analytics dashboard

5. **No soft delete toggle in UI**
   - Hard delete only (via cascade)
   - Can't "archive" quotes temporarily
   - **Future:** Add active/inactive toggle

6. **No URL validation for images**
   - Trust admin input (per decision)
   - Broken URLs not detected
   - **Future:** Add optional background validation

---

**Estimated Completion:** 8 hours  
**Blockers:** Requires Plans 01-04 completed  
**Phase 1 Complete:** All CMS requirements delivered with zero-downtime deployment

---

## 15. Celebration Checklist 🎉

When Phase 1 is complete:

- [ ] Take screenshot of working CMS
- [ ] Test end-to-end: login → create quote → create image → create pairing → view on homepage
- [ ] Document any learnings/gotchas
- [ ] Commit final changes with message: "feat: Complete Phase 1 - CMS"
- [ ] Tag release: `git tag v2.0.0-cms`
- [ ] Update project board: Phase 1 → Done
- [ ] Plan celebration (you deserve it!)
- [ ] Review Phase 2 plans (Social Sharing)

**Phase 1 Achievement Unlocked:**
✅ Database-driven content management  
✅ Secure admin authentication  
✅ Full CRUD for quotes, images, pairings  
✅ 5-day repetition validation  
✅ Graceful fallbacks  
✅ Zero-downtime deployment  

**Next up:** Phase 2 - Enhanced Social Sharing 🚀
