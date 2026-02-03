# Requirements: Daily Demotivations

**Defined:** 2025-01-15
**Core Value:** Users get a daily laugh from the juxtaposition of demotivating content presented in the earnest, polished aesthetic of inspirational quote sites.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Content Display

- [x] **CORE-01**: User visits site and sees today's demotivating quote (deterministic - same for everyone on a given day)
- [x] **CORE-02**: Site is fully responsive and works well on mobile devices
- [x] **CORE-03**: Quote is displayed with clean, sophisticated typography mimicking daily affirmations aesthetic
- [x] **CORE-04**: Quote is overlaid on a romantic landscape background image

### Social Sharing

- [x] **SHARE-01**: User can download the quote+image as a single image file (PNG/JPEG)
- [x] **SHARE-02**: User can share via native mobile share menu (Web Share API)
- [x] **SHARE-03**: Shared links display proper Open Graph preview images on social platforms
- [x] **SHARE-04**: User can share directly to Facebook, LinkedIn, and Instagram via share buttons (Note: Instagram via Web Share API + download, no direct button due to platform limitation)

### Content Management

- [x] **CONTENT-01**: System has a curated collection of demotivating quotes stored in code
- [x] **CONTENT-02**: System uses deterministic date-based mapping to select today's quote (same quote for everyone on same day)

### Technical Foundation

- [x] **TECH-01**: Site is deployed to Vercel platform
- [x] **TECH-02**: Site integrates with Unsplash API to fetch romantic landscape backgrounds

## v2 Requirements

**Focus:** Content management, monetization preparation, enhanced sharing formats

### Content Management (Priority 1)

- **CMS-01**: Admin interface for managing quotes (CRUD operations: add, edit, deactivate)
- **CMS-02**: Admin interface for managing background images (add via URL, with photographer attribution, deactivate)
- **CMS-03**: Quote-to-image pairing system (manually pair specific quotes with images for specific dates)
- **CMS-04**: Database migration from hardcoded arrays to persistent storage
- **CMS-05**: Admin authentication via simple password/secret key (single admin, environment variable)
- **CMS-06**: Admin dashboard shows upcoming scheduled pairings (simple list/table view)
- **CMS-07**: Pairing validation prevents quote repetition within 5-day rolling window
- **CMS-08**: Image URL field hints/suggests Unsplash URLs (helper text or placeholder)

### Historical Access (Priority 2 - Monetization Preparation)

- **HISTORY-01**: View quotes from 5 days back (unauthenticated users, configurable via environment variable)
- **HISTORY-02**: Previous/next day navigation buttons (disabled when reaching limits)
- **HISTORY-03**: Simple dropdown or prev/next navigation for selecting past days (within 5-day window)
- **HISTORY-04**: URL structure supports date parameter (e.g., /?date=2025-01-15)
- **HISTORY-05**: Clear messaging about historical access limits (inline badge or subtle banner)
- **HISTORY-06**: Date indicator shows which day user is viewing ("January 14, 2025 · 2 days ago")
- **HISTORY-07**: "Today" button for quick return to current quote

### Enhanced Sharing Formats (Priority 3)

- **SHARE-05**: User can choose format before download/share: Landscape (1920x1080), Square (1200x1200), or Vertical/Story (1080x1920)
- **SHARE-06**: Format picker modal or dropdown UI component
- **SHARE-07**: All three formats properly compose quote + image + attribution
- **SHARE-08**: Format selection persists for session (remember user preference)

### Technical Infrastructure

- **DB-01**: Database setup (PostgreSQL - Vercel Postgres recommended)
- **DB-02**: Schema for quotes table (id, text, author, active, created_at, updated_at)
- **DB-03**: Schema for images table (id, url, photographer_name, photographer_url, source, active, created_at)
- **DB-04**: Schema for pairings table (id, quote_id, image_id, date, created_at)
- **AUTH-01**: Simple password-based admin authentication (environment variable, no user table needed)
- **AUTH-02**: Protected admin routes (/admin/*) via middleware

### Data Management & Validation

- **DATA-01**: Prevent duplicate quotes when adding new quotes (check text similarity)
- **DATA-02**: Validate image URLs are accessible before saving (optional HTTP HEAD request)
- **DATA-03**: Graceful fallback to hardcoded quotes if database unavailable (reliability)
- **DATA-04**: Graceful fallback to Unsplash random search if paired image URL broken

### SEO & Social Sharing

- **SEO-01**: Historical pages include noindex meta tag and canonical pointing to today
- **SHARE-09**: OG image route supports date parameter for historical quotes (/api/og?date=2025-01-14)

### Error Handling

- **ERROR-01**: Admin UI displays validation errors clearly (simple text messages, no fancy UX needed)
- **ERROR-02**: Frontend displays friendly error if quote/image loading fails

### Analytics (Priority 4)

- **ANALYTICS-01**: Install and configure @vercel/analytics for basic page view tracking
- **ANALYTICS-02**: Track custom events for share/download actions (optional, can use Web Vitals only)

### Deferred to v3 (Advanced Features)

- **ANALYTICS-03**: Quote performance metrics dashboard in admin
- **USER-01**: Optional user accounts to save favorite quotes
- **USER-02**: Daily visit streak tracking
- **USER-03**: Email/notification opt-in for daily quote reminders
- **CONTENT-04**: User submission system for community-contributed quotes
- **CONTENT-05**: Moderation queue for reviewing submitted quotes

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User authentication (v1) | Adds complexity, creates barrier to entry, conflicts with viral anonymous sharing |
| Comments/discussions | Not a community platform; simplicity is the differentiator |
| Categories/tags | Anti-feature per research; reduces focus on daily single quote |
| Quote customization | Defeats the shared daily experience; everyone should see the same quote |
| Video content | High complexity, storage costs; not aligned with core value |
| Real-time features | Unnecessary for daily update cadence |
| Native mobile apps | Web-first; mobile web sufficient for v1 |
| Multiple languages | English-only for v1 to validate concept |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| SHARE-01 | Phase 2 | Complete |
| SHARE-02 | Phase 2 | Complete |
| SHARE-03 | Phase 2 | Complete |
| SHARE-04 | Phase 2 | Complete (w/ deviation) |
| CONTENT-01 | Phase 1 | Complete |
| CONTENT-02 | Phase 1 | Complete |
| TECH-01 | Phase 1 | Complete |
| TECH-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12 (100% coverage) ✅
- Phase 1: 8 requirements (CORE-01 through CORE-04, CONTENT-01 through CONTENT-02, TECH-01 through TECH-02)
- Phase 2: 4 requirements (SHARE-01 through SHARE-04)
- Phase 3: 0 requirements (iterative polish only)

---
*Requirements defined: 2025-01-15*
*Last updated: 2025-01-15 after roadmap creation*
