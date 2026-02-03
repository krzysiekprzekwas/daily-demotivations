# Roadmap v2: Daily Demotivations

**Created:** 2026-02-03  
**Structure:** 3 phases (content management, monetization prep, enhanced sharing)  
**Focus:** CMS capabilities, historical access (3-5 days), multi-format sharing

## Overview

v2 transforms Daily Demotivations from a hardcoded prototype into a managed content platform with monetization foundations. Phase 1 builds admin CMS for managing quotes and images. Phase 2 enables historical access (3-5 days back) to prepare for freemium model. Phase 3 adds multi-format sharing (landscape/square/vertical) for platform optimization.

## v1 Recap

**Completed:**
- ✅ Daily quote display with deterministic selection
- ✅ Unsplash integration with caching
- ✅ Social sharing (download + Web Share API)
- ✅ OG image generation
- ✅ Production deployment

**Current Limitations:**
- Quotes hardcoded in `src/lib/quotes.ts` (30 quotes)
- Images randomly fetched from Unsplash (no curation)
- Only today's quote accessible (no history)
- Single share format (1200x1200 square)
- No content management capabilities

## Phase 1: Content Management System (CMS)

**Goal:** Admin can manage quotes and images through web interface without code deployments.

**Why first:** All v2 features depend on structured data storage. CMS enables content scaling, curation, and A/B testing. Must establish database schema before adding historical access or user features.

### Requirements Covered

- **CMS-01**: Admin interface for managing quotes (CRUD operations)
- **CMS-02**: Admin interface for managing background images (upload, select, archive)
- **CMS-03**: Quote-to-image pairing system (manually pair specific quotes with images)
- **CMS-04**: Database migration from hardcoded arrays to persistent storage
- **CMS-05**: Admin authentication and authorization system
- **DB-01**: Database setup (PostgreSQL on Vercel/Supabase)
- **DB-02**: Schema for quotes table
- **DB-03**: Schema for images table
- **DB-04**: Schema for pairings table
- **AUTH-01**: Admin authentication system
- **AUTH-02**: Protected admin routes

### Success Criteria

Admins can:
1. Log in to `/admin` with secure authentication
2. Add, edit, deactivate quotes without touching code
3. Upload or link background images with photographer attribution
4. Manually pair specific quotes with specific images for specific dates
5. View all quotes and images in searchable/filterable tables
6. See which pairings are scheduled for upcoming dates

Users experience:
1. No change to homepage UX (same daily quote experience)
2. Curated quote-image pairings instead of random combinations
3. Higher quality background images (admin-selected instead of Unsplash random search)

**Database Layer:**
- PostgreSQL database (Vercel Postgres)
- `quotes` table (id, text, author, active, created_at, updated_at)
- `images` table (id, url, photographer_name, photographer_url, source, active, created_at)
- `pairings` table (id, quote_id, image_id, date, created_at)
- Prisma ORM setup with migrations
- **Important:** Pairing validation prevents quote repetition within 5-day rolling window

**Authentication:**
- Simple password-based authentication (single admin, no NextAuth.js needed)
- Admin credentials stored in environment variable (ADMIN_PASSWORD)
- Protected `/admin/*` routes with middleware (session cookie after login)
- Minimal UX: basic login form, no fancy features needed

**Admin Interface (rough UX acceptable):**
- `/admin/login` - Simple password form
- `/admin/dashboard` - Basic stats + upcoming pairings table (next 7-10 days)
- `/admin/quotes` - Quote CRUD (simple table with add/edit forms)
- `/admin/images` - Image CRUD (URL input with Unsplash hint: "Use Unsplash photo URLs")
- `/admin/pairings` - Pairing management (date input + quote/image dropdowns)
  - Validation: warns if quote used within last 5 days

**Data Migration:**
- Seed script to migrate 30 hardcoded quotes to database
- Fallback logic if database unavailable (still works with hardcoded quotes)

**Frontend Integration:**
- Update `getTodaysQuote()` to fetch from database (with hardcoded fallback)
- Update image fetching to prioritize paired images over Unsplash random

### Technical Stack

- **Database:** PostgreSQL (Vercel Postgres recommended)
- **ORM:** Prisma (type-safe, great DX, migrations)
- **Auth:** Simple password check (no NextAuth.js - just middleware + session cookie)
- **Admin UI:** Basic forms with Tailwind CSS (rough UX acceptable, functionality over polish)
- **Image Input:** URL-only (Unsplash URLs hinted/suggested in placeholder text)

### Phase Complete When

- [ ] Admin can log in to `/admin` and sees dashboard
- [ ] Admin can CRUD quotes without code changes
- [ ] Admin can add images via URL with attribution
- [ ] Admin can pair quotes to images for specific dates
- [ ] Homepage uses database for quote selection (with hardcoded fallback)
- [ ] Homepage prioritizes paired images over Unsplash random
- [ ] All 30 existing quotes migrated to database
- [ ] At least 5 quote-image pairings manually created
- [ ] Authentication prevents unauthorized access to `/admin/*`
- [ ] Vercel deployment includes database connection

---

## Phase 2: Historical Access (Monetization Preparation)

**Goal:** Users can view quotes from 3-5 days back, preparing for freemium monetization model.

**Why second:** Requires database from Phase 1 (pairings by date). Historical access creates value differentiation for future premium tier (unlimited history, favorites, etc.). 3-5 day window balances user value with scarcity.

### Requirements Covered

- **HISTORY-01**: View quotes from 3-5 days back (unauthenticated users)
- **HISTORY-02**: Previous/next day navigation buttons
- **HISTORY-03**: Date picker for selecting specific past days (3-5 day window)
- **HISTORY-04**: URL structure supports date parameter (/?date=2025-01-15)
- **HISTORY-05**: Clear messaging about historical access limits

### Success Criteria

Users can:
1. Click "Previous Day" button and see yesterday's quote
2. Navigate up to 3-5 days back using previous/next buttons
3. Open date picker and select any day within the 3-5 day window
4. Share direct links to specific dates (e.g., `/?date=2025-01-14`)
5. See clear message when reaching the limit ("Want more? Premium unlocks full archive")
6. Always return to "today" via header link or "Today" button

Technical requirements:
1. Database pairings support date-based queries
2. OG image route generates images for historical dates (`/api/og?date=2025-01-14`)
3. Download/share preserve the selected date (not today's quote)
4. SEO handles canonical URLs (today = canonical, historical = noindex)

### Key Deliverables

**Navigation Components:**
- Previous/Next day buttons (disabled when reaching limits)
- Date picker component (only shows last 3-5 days + today)
- "Today" button (quick return to current quote)
- Day counter badge (e.g., "Yesterday", "3 days ago")

**Date Handling:**
- URL query parameter support (`?date=YYYY-MM-DD`)
- Date validation (reject future dates, limit to 3-5 days back)
- Timezone handling (UTC for consistency)

**Database Queries:**
- `getPairingByDate(date: string)` function
- Fallback to random quote if no pairing exists for date
- Efficient query with date indexing

**Limit Messaging:**
- Subtle CTA when viewing older quotes ("Viewing 3 days ago · Unlock full archive")
- Empty state when no more history available
- Footer link to "Coming Soon: Premium" page

**SEO Considerations:**
- Canonical tag points to today's page
- Noindex meta tag on historical pages (prevent duplicate content)
- OG tags reflect selected date quote (for sharing specific quotes)

### Historical Access Window Options

**Option A: 3 days back** (conservative)
- Today + 3 past days = 4 total quotes accessible
- Creates strong scarcity for premium
- Lower database load

**Option B: 5 days back** (balanced)
- Today + 5 past days = 6 total quotes accessible
- Shows pattern/variety to encourage premium
- Moderate database load

**Option C: 7 days back** (generous)
- Today + 7 past days = 8 total quotes accessible
- Full week of content (higher retention)
- Higher database load, less scarcity

**Recommendation:** Start with **5 days back** (Option B). Balances user value with monetization potential. Easy to adjust based on analytics.

### Phase Complete When

- [ ] Users can navigate to yesterday's quote via "Previous" button
- [ ] Users can navigate 5 days back (configurable via environment variable)
- [ ] Date picker shows only valid date range (last 5 days + today)
- [ ] URL parameter `?date=2025-01-14` loads correct quote
- [ ] Sharing historical quotes generates correct OG images
- [ ] Download preserves selected date (not today's quote)
- [ ] Limit messaging appears when viewing older quotes
- [ ] Future dates and dates beyond limit are rejected (404 or redirect)
- [ ] SEO tags properly configured (canonical, noindex)
- [ ] Navigation buttons disabled when limits reached

---

## Phase 3: Enhanced Sharing Formats

**Goal:** Users can choose image format before download/share (landscape, square, vertical) for platform optimization.

**Why third:** Requires stable historical access (share specific dates) and database (quote-image pairings). Multi-format sharing increases viral potential (optimized for Instagram Stories, Twitter, LinkedIn). Non-blocking enhancement—v2 valuable without it.

### Requirements Covered

- **SHARE-05**: User can choose format: Landscape (1920x1080), Square (1200x1200), or Vertical/Story (1080x1920)
- **SHARE-06**: Format picker modal or dropdown UI component
- **SHARE-07**: All three formats properly compose quote + image + attribution
- **SHARE-08**: Format selection persists for session (localStorage)

### Success Criteria

Users can:
1. Click "Share" and see format picker (3 options with icons/labels)
2. Select Landscape and download 1920x1080 image
3. Select Square and download 1200x1200 image (current default)
4. Select Vertical and download 1080x1920 image (Instagram Story format)
5. See format selection remembered in same session (don't ask again)
6. Preview format dimensions before download/share

Technical requirements:
1. Canvas composition adjusts layout for each aspect ratio
2. Text sizing and positioning optimized per format
3. All formats include proper attribution and date
4. Image background properly cropped/fitted for each ratio
5. Download filename includes format (e.g., `demotivation-2025-01-15-landscape.png`)

### Key Deliverables

**Format Picker Component:**
- Modal overlay with 3 format options
- Visual preview cards (show aspect ratio)
- Labels: "Landscape (Twitter/LinkedIn)", "Square (Instagram Post)", "Vertical (Instagram Story)"
- "Remember choice" checkbox

**Canvas Generation Updates:**
- Extend `createImageBlob()` to accept format parameter
- Layout calculations per format:
  - **Landscape (1920x1080):** Horizontal composition, larger text
  - **Square (1200x1200):** Current implementation (centered)
  - **Vertical (1080x1920):** Portrait composition, upper 2/3 image, lower 1/3 text
- Responsive text sizing per format
- Background cropping/fitting per aspect ratio

**API Route Updates:**
- Update `/api/download` to accept `format` parameter
- Update `/api/og` to optionally generate different formats (stretch goal)

**User Preferences:**
- Store format choice in localStorage
- Respect choice for subsequent shares in same session
- "Change format" link in share modal

**Download/Share Integration:**
- Update ShareModal to include format picker
- Pass format to download/share functions
- Update filenames to include format suffix

### Format Specifications

| Format | Dimensions | Aspect Ratio | Best For | Text Layout |
|--------|-----------|--------------|----------|-------------|
| **Landscape** | 1920x1080 | 16:9 | Twitter, LinkedIn, Facebook posts | Centered, large text (64px) |
| **Square** | 1200x1200 | 1:1 | Instagram posts, Facebook | Centered, medium text (56px) - current |
| **Vertical** | 1080x1920 | 9:16 | Instagram Stories, TikTok | Upper image, lower text block (48px) |

### Typography Adjustments per Format

**Landscape (1920x1080):**
- Quote text: `500 64px serif` (larger, bolder)
- Max width: 1600px (leave margins)
- Line height: 1.3

**Square (1200x1200):**
- Quote text: `400 56px serif` (current implementation)
- Max width: 1000px
- Line height: 1.4

**Vertical (1080x1920):**
- Quote text: `400 48px serif` (smaller for readability)
- Max width: 900px
- Line height: 1.5
- Text positioned in lower third (y: 1280-1850)

### Phase Complete When

- [ ] Share modal includes format picker UI
- [ ] Users can select Landscape and download 1920x1080 PNG
- [ ] Users can select Square and download 1200x1200 PNG
- [ ] Users can select Vertical and download 1080x1920 PNG
- [ ] All formats properly compose quote + image + attribution
- [ ] Text layout optimized for each aspect ratio (readable, centered)
- [ ] Format choice persists in localStorage
- [ ] Filename includes format suffix (e.g., `-landscape.png`)
- [ ] Web Share API shares correct format selection
- [ ] All formats work with historical dates (Phase 2 integration)

---

## Phase 4: Analytics Integration

**Goal:** Track page views and user behavior with Vercel Analytics to inform product decisions.

**Why fourth:** Quick win (15-30 min implementation), non-blocking, provides data for future optimization. Can be done in parallel with other phases or after Phase 1 complete.

### Requirements Covered

- **ANALYTICS-01**: Install and configure @vercel/analytics for page view tracking
- **ANALYTICS-02**: Track custom events for share/download actions (optional)

### Success Criteria

Product owner can:
1. View page views, unique visitors, and traffic sources in Vercel dashboard
2. See Core Web Vitals (LCP, FID, CLS) for performance monitoring
3. Track custom events like "quote_shared", "quote_downloaded" (optional)
4. Understand which dates/quotes get most traffic (via URL analysis)

### Key Deliverables

**Analytics Setup:**
- Install `@vercel/analytics` package
- Add `<Analytics />` component to root layout
- Optional: Add custom event tracking for share/download buttons

**Implementation:**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Optional Custom Events:**
```tsx
// Track share action
import { track } from '@vercel/analytics';

function handleShare() {
  track('quote_shared', { date: currentDate, format: selectedFormat });
  // ... share logic
}
```

### Phase Complete When

- [ ] `@vercel/analytics` installed and configured
- [ ] Analytics component added to root layout
- [ ] Page views visible in Vercel dashboard after deployment
- [ ] (Optional) Custom events tracked for share/download actions
- [ ] No performance impact (Analytics loads asynchronously)

**Time Estimate:** 15-30 minutes (can be done as quick task between phases)

---

## Phase Dependencies

```
Phase 1 (CMS)
    ↓
Phase 2 (Historical Access) — depends on database pairings from Phase 1
    ↓
Phase 3 (Enhanced Formats) — depends on historical sharing from Phase 2

Phase 4 (Analytics) — independent, can be done anytime (recommend after Phase 1)
```

**Limited parallelization:** Phase 2 can't start until database schema complete. Phase 3 can be partially developed in parallel with Phase 2 (format logic separate from date handling). Phase 4 is fully independent and can be done in parallel with any other phase.

---

## Out of Scope (v2)

Deferred to v3 or beyond:

- **Analytics & Tracking** — Deferred to v3 (polish & optimization)
- **User Accounts** — Wait until monetization model validated
- **Favorite Quotes** — Requires user accounts
- **Streak Tracking** — Requires user accounts
- **Email Notifications** — Low priority until retention proven
- **User Submissions** — Requires moderation system
- **Image Upload (Vercel Blob)** — URL input sufficient for Phase 1
- **Premium Tier** — Build after historical access validated
- **Full Calendar View** — Too complex, may hurt daily habit
- **Advanced CMS Features** — Scheduling, drafts, versioning (YAGNI)

---

## Monetization Strategy (Future)

Phase 2 prepares for freemium model:

**Free Tier:**
- Today's quote + 5 days history
- Basic sharing (all formats)
- No account required

**Premium Tier ($3-5/month):**
- Unlimited historical archive
- Favorite quotes collection
- Email notifications (daily quote delivery)
- Ad-free experience (if ads added later)
- Early access to new quotes
- Exclusive demotivation themes (stretch)

**Not in scope for v2 but enabled by Phase 2 architecture.**

---

## Success Metrics (v2 Post-Launch)

How we'll know v2 delivers value:

- **Content Management Efficiency:** Admin adds 10+ new quotes in first month without developer help
- **Historical Access Engagement:** >20% of visitors navigate to past quotes
- **Format Usage:** >30% of users download non-square formats (validates multi-format feature)
- **Database Performance:** Quote/pairing queries <50ms p95
- **CMS Uptime:** Admin interface available 99.9%+ (no broken deployments)

---

## Risk Management

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Database cost overrun | MEDIUM | Use free tier (Vercel Postgres 60 hrs/mo or Supabase free) | Plan ahead |
| Migration breaks production | HIGH | Maintain hardcoded fallback, gradual rollout | Design decision |
| CMS complexity delays launch | MEDIUM | Phase 1 can be simplified (quotes-only, defer image upload) | Scope control |
| Historical access hurts daily habit | MEDIUM | Track return rate, easy to disable feature flag | Monitor post-launch |
| Format picker adds friction | LOW | Remember choice, skip picker after first use | UX design |
| Auth vulnerabilities | HIGH | Use battle-tested NextAuth.js, single admin account | Security review |

---

## Technical Decisions Needed

Before starting Phase 1:

1. **Database Provider:**
   - Vercel Postgres (tight integration, 60 hrs compute free)
   - Supabase (generous free tier, 500MB storage)
   - Recommendation: **Vercel Postgres** for simplicity

2. **ORM Choice:**
   - Prisma (type-safe, great DX, migrations)
   - Drizzle (lighter, faster, newer)
   - Recommendation: **Prisma** for maturity and documentation

3. **Auth Approach:**
   - Simple password (environment variable, session cookie)
   - NextAuth.js v5 (if multi-admin needed later)
   - Recommendation: **Simple password** for Phase 1 (single admin sufficient)

4. **Image Storage (Phase 1):**
   - URL input only (simplest, start here)
   - Vercel Blob (paid, $0.15/GB storage)
   - Recommendation: **URL input** for Phase 1, revisit in Phase 2 or v3

5. **Historical Access Window:**
   - 3 days (scarcity)
   - 5 days (balanced) ⭐
   - 7 days (generous)
   - Recommendation: **5 days** (configurable via env var)

---

*Roadmap v2 created: 2026-02-03*  
*Next: Discuss priorities and begin Phase 1 research*
