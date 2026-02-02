# Architecture Research

**Domain:** Daily quote/content websites
**Researched:** 2025-02-02
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Page   │  │ Image   │  │ Share   │  │  Meta   │        │
│  │  Route  │  │  Route  │  │ Buttons │  │  Tags   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                      BUSINESS LOGIC                          │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Date-to-Content Resolver (Pure Logic)         │  │
│  │  • Deterministic date hashing                         │  │
│  │  • Content selection from static pool                 │  │
│  │  • URL generation for images                          │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      DATA/SERVICE LAYER                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Quotes  │  │ Unsplash │  │   OG     │                   │
│  │   Data   │  │   API    │  │  Image   │                   │
│  │  (JSON)  │  │  Client  │  │  Gen     │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Page Route** | Main UI rendering, date detection, server-side data fetching | Next.js Server Component (`app/page.tsx`) |
| **Image Route** | Dynamic OG/share image generation via serverless function | Next.js Route Handler (`app/api/og/route.tsx`) |
| **Date Resolver** | Pure function: maps date → quote index deterministically | Utility module (`lib/date-resolver.ts`) |
| **Quote Store** | Static data source of quotes | JSON file (`data/quotes.json`) |
| **Unsplash Client** | Fetches background images based on quote keywords | Service wrapper (`lib/unsplash.ts`) |
| **Share Buttons** | Client-side social sharing interactions | Client Component (`components/share-buttons.tsx`) |
| **Meta Tags** | Dynamic Open Graph/Twitter metadata for sharing | Server Component with `generateMetadata()` |

## Recommended Project Structure

```
daily-demotivations/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Main daily quote page (Server Component)
│   ├── layout.tsx            # Root layout with global metadata
│   ├── api/
│   │   └── og/
│   │       └── route.tsx     # OG image generation endpoint
│   └── [date]/
│       └── page.tsx          # Optional: view specific past dates
├── components/               # React components
│   ├── quote-card.tsx        # Server: displays quote + background
│   ├── share-buttons.tsx     # Client: social sharing UI
│   └── date-navigator.tsx    # Client: prev/next day navigation
├── lib/                      # Business logic & utilities
│   ├── date-resolver.ts      # Pure: date → quote index mapping
│   ├── quote-selector.ts     # Pure: selects quote for given index
│   ├── unsplash.ts           # Service: fetches background images
│   ├── image-cache.ts        # Service: caches Unsplash URLs
│   └── share-utils.ts        # Utility: generates share URLs
├── data/                     # Static data
│   └── quotes.json           # Array of quote objects
├── public/                   # Static assets
│   ├── og-fallback.png       # Fallback OG image
│   └── fonts/                # Custom fonts for OG images
└── types/                    # TypeScript definitions
    └── quote.ts              # Quote data shape
```

### Structure Rationale

- **`app/` with App Router:** Leverages Next.js 13+ for server components, simplified routing, and built-in metadata support
- **`lib/` for pure logic:** Date resolution and quote selection are framework-agnostic, testable pure functions
- **`data/` for static content:** No database needed initially—JSON file is version-controlled and easily editable
- **`components/` split by render type:** Server components for data-heavy UI, client components for interactivity
- **`api/og/` route handler:** Serverless function for dynamic image generation, automatically cached by CDN

## Architectural Patterns

### Pattern 1: Deterministic Content Resolution

**What:** Use date as seed for consistent daily content selection without database

**When to use:** Daily content sites where same date always shows same content

**Trade-offs:**
- ✅ Zero database queries
- ✅ Perfectly cacheable (same date = same content)
- ✅ Content can be pre-rendered for SEO
- ❌ Changing quote order breaks determinism (requires versioning)
- ❌ Can't do user-specific personalization

**Example:**
```typescript
// lib/date-resolver.ts
export function getQuoteIndexForDate(date: Date): number {
  // Deterministic hash: YYYYMMDD → index
  const dateStr = format(date, 'yyyyMMdd')
  const hash = simpleHash(dateStr)
  return hash % TOTAL_QUOTES
}

function simpleHash(str: string): number {
  return str.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)
}
```

### Pattern 2: Server-Side Image Generation as Route Handler

**What:** Generate OG images dynamically using serverless function + @vercel/og

**When to use:** When images contain dynamic text/data, and pre-generating all variants is impractical

**Trade-offs:**
- ✅ Images always match current content
- ✅ No manual design work in Photoshop
- ✅ Automatically cached by CDN after first request
- ❌ First request per unique URL has ~200-500ms generation time
- ❌ Limited to subset of CSS (flexbox only)

**Example:**
```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const quote = searchParams.get('quote')
  const author = searchParams.get('author')
  
  return new ImageResponse(
    (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${bgImageUrl})`,
      }}>
        <div style={{ fontSize: 60 }}>{quote}</div>
        <div style={{ fontSize: 40 }}>— {author}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

### Pattern 3: External API Integration with Fallbacks

**What:** Fetch background images from Unsplash API with graceful degradation

**When to use:** When content enrichment is valuable but not critical

**Trade-offs:**
- ✅ Rich, professional imagery without manual sourcing
- ✅ Cost-effective (Unsplash free tier is generous)
- ❌ Adds external dependency (rate limits, downtime)
- ❌ Requires API key management
- ✅ Mitigated with fallback images

**Example:**
```typescript
// lib/unsplash.ts
export async function getBackgroundImage(keyword: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${keyword}`,
      {
        headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    )
    
    if (!response.ok) throw new Error('Unsplash API error')
    
    const data = await response.json()
    return data.urls.regular
  } catch (error) {
    console.error('Unsplash fetch failed:', error)
    return '/og-fallback.png' // Fallback to local image
  }
}
```

### Pattern 4: Static Generation with Dynamic Params

**What:** Pre-render pages at build time while supporting runtime params via generateStaticParams

**When to use:** When you want fast loads but can't pre-render infinite combinations

**Trade-offs:**
- ✅ Best of both: static shell + dynamic data
- ✅ Great Core Web Vitals scores
- ❌ Build time grows with number of pre-rendered pages
- ✅ Can limit pre-rendering to "important" pages (today, recent dates)

**Example:**
```typescript
// app/[date]/page.tsx
export async function generateStaticParams() {
  // Pre-render last 7 days + next 7 days
  const dates = []
  const today = new Date()
  
  for (let i = -7; i <= 7; i++) {
    const date = addDays(today, i)
    dates.push({ date: format(date, 'yyyy-MM-dd') })
  }
  
  return dates
}

export default async function DatePage({ params }: { params: { date: string } }) {
  const quote = getQuoteForDate(parseISO(params.date))
  return <QuoteDisplay quote={quote} />
}
```

## Data Flow

### Request Flow

```
[User visits /]
    ↓
[Server Component reads system date] → [getQuoteIndexForDate(today)]
    ↓                                         ↓
[Fetch quote from quotes.json]←───────[deterministic hash]
    ↓
[Fetch Unsplash background for quote keywords]
    ↓
[Render HTML with quote + background + metadata]
    ↓
[Send to client with OG image URL: /api/og?quote=...&author=...]
    ↓
[Client hydrates Share buttons (Client Component)]

When social platform crawls page:
    ↓
[Crawler hits og:image URL: /api/og?quote=...]
    ↓
[Route Handler: ImageResponse generates PNG]
    ↓
[CDN caches image (Cache-Control: public, max-age=31536000)]
```

### State Management

**No global state needed.** This architecture is inherently stateless:

1. **Server state:** Derived from date (pure function)
2. **Client state:** Minimal (share button open/closed, copy confirmation)
3. **Cached data:**
   - Quote selection: computed, no cache needed
   - Unsplash images: Next.js fetch cache (24h revalidation)
   - OG images: CDN cache (immutable URLs)

### Key Data Flows

1. **Date → Content:** Pure function ensures same date always yields same quote
2. **Quote → Background:** Keywords from quote → Unsplash API → cached URL
3. **Content → OG Image:** Quote data → URL params → serverless render → PNG
4. **Sharing:** Client reads current URL + metadata → constructs share URL → opens platform

## Build Order & Dependencies

### Phase 1: Core Content System
**Build first. Everything depends on this.**

Components:
1. `data/quotes.json` — Static data source
2. `lib/date-resolver.ts` — Date → index mapping
3. `lib/quote-selector.ts` — Index → quote object
4. `types/quote.ts` — TypeScript definitions

**Why first:** No external dependencies, pure logic, foundation for all features

**Dependencies:** None

**Testing:** Easy to unit test (pure functions)

### Phase 2: Basic Page Rendering
**Build second. Proves the core system works.**

Components:
1. `app/page.tsx` — Server Component displaying today's quote
2. `components/quote-card.tsx` — UI for quote display
3. `app/layout.tsx` — Basic HTML shell

**Why second:** Validates Phase 1 works, provides visible progress

**Dependencies:** Phase 1 (needs quote selection)

**Testing:** Can see quote in browser immediately

### Phase 3: OG Image Generation
**Build third. Critical for sharing but isolated.**

Components:
1. `app/api/og/route.tsx` — Image generation endpoint
2. `public/fonts/` — Custom fonts if needed

**Why third:** Independent of main page rendering, but needed before metadata

**Dependencies:** Phase 1 (needs quote data)

**Testing:** Visit `/api/og?quote=test` directly in browser

### Phase 4: Metadata & Sharing
**Build fourth. Enhances discoverability.**

Components:
1. `app/page.tsx` — Add `generateMetadata()` export
2. `components/share-buttons.tsx` — Client Component for social sharing
3. `lib/share-utils.ts` — Share URL generators

**Why fourth:** Needs OG image route from Phase 3

**Dependencies:** Phase 3 (OG image must exist for og:image meta tag)

**Testing:** Use [Open Graph Debugger](https://www.opengraph.xyz/)

### Phase 5: Unsplash Integration
**Build fifth. Enhancement, not critical path.**

Components:
1. `lib/unsplash.ts` — API client
2. Environment variable: `UNSPLASH_ACCESS_KEY`
3. Update `quote-card.tsx` to use dynamic backgrounds

**Why fifth:** External dependency, requires API key, has fallbacks

**Dependencies:** Phase 2 (enhances existing quote display)

**Testing:** Start with hardcoded fallback, then add API

### Phase 6: Navigation & Polish
**Build last. Nice-to-have features.**

Components:
1. `app/[date]/page.tsx` — View specific dates
2. `components/date-navigator.tsx` — Prev/next buttons
3. `generateStaticParams()` — Pre-render recent dates

**Why last:** Requires all core functionality working first

**Dependencies:** Phases 1-4 (everything)

**Testing:** Click prev/next, share specific date URLs

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Unsplash API** | HTTP fetch with API key in headers | Free tier: 50 requests/hour. Cache responses 24h. Fallback to local images. |
| **Vercel hosting** | Git push → automatic deployment | Serverless functions auto-scale. Edge caching for OG images. |
| **Social platforms** | Meta tags + OG image URL | Crawlers fetch og:image. Ensure robots.txt allows `/api/og/`. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Page ↔ Date Resolver** | Direct function call (pure) | Server-side only. No async needed. |
| **Page ↔ Unsplash Client** | Async fetch with caching | Server-side only. Uses Next.js fetch cache. |
| **Page ↔ OG Route** | URL reference (meta tag) | No direct coupling. Page just generates URL. |
| **Server ↔ Client Components** | Props (serializable only) | Quote data flows down as props. No functions/dates/classes. |
| **Client Component ↔ Browser APIs** | Direct (navigator.share, clipboard) | Feature detection required. Fallback to copy-link. |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-10k visits/day** | Current architecture perfect. Static pages + CDN = near-zero server cost. Unsplash free tier sufficient. |
| **10k-100k visits/day** | Add ISR (Incremental Static Regeneration) with 24h revalidation. Consider Redis for Unsplash URL caching (reduce API calls). OG images already cached by CDN. |
| **100k-1M visits/day** | Move quotes to database for easier editing at scale. Add image CDN (Cloudinary/Imgix) for Unsplash caching + optimization. Consider paid Unsplash tier (5000 req/hour). |
| **1M+ visits/day** | Add edge middleware for A/B testing. Consider pre-generating OG images at build time (finite date range). Multi-region deployment for global audience. |

### Scaling Priorities

1. **First bottleneck:** Unsplash API rate limits
   - **Fix:** Cache URLs in KV store (Vercel KV/Redis), revalidate daily
   - **Cost:** ~$20/month (Vercel KV)

2. **Second bottleneck:** OG image generation cold starts
   - **Fix:** Pre-generate images for current month at build time, fall back to dynamic for others
   - **Cost:** ~5 minutes added to build time

3. **Not a bottleneck (surprisingly):** Quote data fetching
   - JSON file is tiny (<100KB), read from filesystem is ~1ms
   - Database NOT needed until 100k+ quotes

## Anti-Patterns

### Anti-Pattern 1: Dynamic Database Queries for Static Content

**What people do:** Store quotes in PostgreSQL/MongoDB, query on every page load

**Why it's wrong:** 
- Adds latency (network round-trip)
- Requires database hosting ($)
- Same data queried repeatedly (wasteful)
- Harder to version control content

**Do this instead:** 
- Use JSON file for <1000 quotes
- Pre-load at build time
- Only move to DB when you need admin UI or 10k+ quotes

### Anti-Pattern 2: Client-Side Date Resolution

**What people do:** Calculate today's quote in browser JavaScript

**Why it's wrong:**
- User's timezone affects which quote they see (not deterministic globally)
- SEO crawlers may see different content than users
- Can't pre-render for social cards (no server-side data)

**Do this instead:**
- Resolve date on server (use UTC for consistency)
- Pass resolved quote to client as props
- Client only handles presentation + interaction

### Anti-Pattern 3: Pre-Generating All OG Images

**What people do:** Generate 365 OG images at build time, store in `/public`

**Why it's wrong:**
- Inflates deployment size
- Build time grows linearly with quote count
- Can't include future dates
- Cache invalidation nightmare when quote changes

**Do this instead:**
- Generate OG images on-demand via Route Handler
- Let CDN cache generated images (automatic with Vercel)
- Images are immutable (quote content in URL means cache forever)

### Anti-Pattern 4: Mixing Server and Client Component Boundaries

**What people do:** Make entire page a Client Component because share buttons need `use client`

**Why it's wrong:**
- Forces data fetching to move client-side (slower)
- Loses automatic metadata generation
- Bigger JavaScript bundle
- Worse SEO and performance

**Do this instead:**
- Keep page as Server Component
- Extract interactive parts (share buttons) into separate Client Components
- Pass data down via props
- Server fetches data, client handles UI interactions only

### Anti-Pattern 5: No Fallbacks for External APIs

**What people do:** Rely on Unsplash 100%, app breaks if API is down

**Why it's wrong:**
- Third-party APIs have downtime
- Rate limits can be hit during traffic spikes
- Degrades user experience unnecessarily

**Do this instead:**
- Always have fallback images in `/public`
- Wrap API calls in try/catch
- Log failures but don't crash
- Consider showing "generic inspirational background" on API failure

## API Boundaries

### Public API Routes

#### `GET /api/og`

**Purpose:** Generate Open Graph share image

**Query Params:**
- `quote` (string, required): The quote text
- `author` (string, optional): Attribution
- `date` (string, optional): Date for background selection

**Response:**
- `Content-Type: image/png`
- `Cache-Control: public, max-age=31536000, immutable`
- 1200x630 PNG image

**Example:**
```
GET /api/og?quote=Give%20up%20on%20your%20dreams&author=Anonymous
→ Returns PNG image with quote rendered on background
```

**Caching:** Immutable (quote content in URL → unique URL per quote → cache forever)

### Internal Module APIs

#### `lib/date-resolver.ts`

```typescript
export function getQuoteIndexForDate(date: Date): number
// Pure function: Date → deterministic index
// No side effects, same input = same output
```

#### `lib/quote-selector.ts`

```typescript
export function getQuoteByIndex(index: number): Quote
// Pure function: index → quote object
// Handles wraparound (index % quotes.length)
```

#### `lib/unsplash.ts`

```typescript
export async function getBackgroundImage(keyword: string): Promise<string>
// Impure: calls external API
// Returns: image URL (or fallback on error)
// Caching: 24h via Next.js fetch cache
```

## Deployment Architecture

### Vercel Platform

```
[GitHub Repository]
    ↓ (git push)
[Vercel Build]
    ├─ Next.js build (app/)
    ├─ Static asset optimization (public/)
    └─ Serverless function packaging (api routes)
    ↓
[Deployment]
    ├─ Static pages → Edge CDN (global)
    ├─ Serverless functions → AWS Lambda (regional)
    └─ OG images → CDN cache (after first request)
    ↓
[User Request]
    ├─ Page HTML: served from CDN (< 50ms)
    ├─ OG image: served from CDN (< 50ms after first gen)
    └─ API routes: executed in nearest region (< 200ms)
```

### Environment Variables

Required:
- `UNSPLASH_ACCESS_KEY` (Unsplash API key)

Optional:
- `NEXT_PUBLIC_SITE_URL` (for absolute URLs in metadata)

## Sources

**Architecture Patterns:**
- Vercel Functions documentation: https://vercel.com/docs/functions/serverless-functions
- Next.js Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- Next.js Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

**OG Image Generation:**
- Vercel OG Image Generation: https://vercel.com/docs/functions/og-image-generation
- @vercel/og library (uses Satori under the hood)

**Route Handlers:**
- Next.js Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route

**Real-world Examples:**
- Daily.dev (daily tech articles): similar date-based content
- Stoic quote apps: same deterministic pattern
- GitHub social cards: on-demand OG image generation

---
*Architecture research for: Daily Demotivations*
*Researched: 2025-02-02*
