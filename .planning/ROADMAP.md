# Roadmap: Daily Demotivations

**Created:** 2025-01-15  
**Structure:** 3 phases (quick depth)  
**Coverage:** 12/12 v1 requirements mapped

## Overview

This roadmap delivers a daily demotivating quote website in three focused phases. Phase 1 establishes the core content display with server-side image generation while preventing critical serverless pitfalls. Phase 2 adds viral growth mechanisms through social sharing. Phase 3 iterates with polish and optimization based on real usage data.

## Phase 1: Core Foundation & Content Display

**Goal:** Users can visit daily to see today's demotivating quote on a romantic background with responsive design.

**Why first:** All features depend on deterministic daily content and reliable image generation. Architecture decisions (caching, serverless configuration, image format) are expensive to change later. Must prevent cold start timeouts and rate limit exhaustion before adding any features.

### Requirements Covered

- **CORE-01**: User visits site and sees today's demotivating quote (deterministic - same for everyone on a given day)
- **CORE-02**: Site is fully responsive and works well on mobile devices
- **CORE-03**: Quote is displayed with clean, sophisticated typography mimicking daily affirmations aesthetic
- **CORE-04**: Quote is overlaid on a romantic landscape background image
- **CONTENT-01**: System has a curated collection of demotivating quotes stored in code
- **CONTENT-02**: System uses deterministic date-based mapping to select today's quote (same quote for everyone on same day)
- **TECH-01**: Site is deployed to Vercel platform
- **TECH-02**: Site integrates with Unsplash API to fetch romantic landscape backgrounds

### Success Criteria

Users can:
1. Visit the site from any device and immediately see today's quote on a romantic landscape
2. Read the quote comfortably on mobile (320px) through desktop (1920px+) without horizontal scrolling
3. See the same quote as every other visitor on the same calendar day (deterministic experience)
4. View quotes that maintain aesthetic contrast—demotivating content in polished, inspirational presentation
5. Experience fast initial load times (<2.5s LCP) even on mobile networks

### Key Deliverables

- Next.js 16 application with App Router
- Deterministic date-to-quote resolver (same date = same quote globally)
- Server-side OG image generation route (Satori + Sharp)
- Unsplash API integration with 24-hour caching and fallback images
- Mobile-responsive quote display component
- Basic SEO metadata
- Vercel deployment with CDN caching (`s-maxage=86400, stale-while-revalidate=300`)

### Critical Pitfalls Addressed

- **Cold start timeout** — Use lightweight Satori + Sharp (not Puppeteer), keep bundle <1MB
- **Unsplash rate limits** — Apply for production API access immediately, implement multi-layer caching, fallback images
- **Missing `ixid` parameter** — Preserve in all Unsplash URL transformations
- **4.5MB payload limit** — Use JPEG at 85% quality for generated images
- **Cache stampede** — Stale-while-revalidate prevents midnight rollover stampede
- **Font loading failures** — Use @vercel/og built-in fonts or proper bundling

### Plans

**Plans:** 6 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md — Initialize Next.js project with TypeScript and Tailwind (Complete: 2026-02-02)
- [ ] 01-02-PLAN.md — Create quote collection with deterministic selection
- [ ] 01-03-PLAN.md — Integrate Unsplash API with caching and fallbacks
- [ ] 01-04-PLAN.md — Build responsive homepage with quote display
- [ ] 01-05-PLAN.md — Create OG image generation endpoint
- [ ] 01-06-PLAN.md — Deploy to Vercel with production configuration

### Phase Complete When

- [ ] Homepage displays today's quote with romantic background on all screen sizes
- [ ] Same date shows same quote for all users (test with multiple devices/browsers)
- [ ] OG image generation route produces <4MB JPEGs in <10s (including cold starts)
- [ ] Site deployed to Vercel with production domain
- [ ] Lighthouse mobile score >90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Unsplash production API application submitted (or demo mode working with fallbacks)

---

## Phase 2: Social Sharing & Virality

**Goal:** Users can effortlessly share quotes to social media, driving viral growth through beautiful preview images.

**Why second:** Requires stable core infrastructure from Phase 1 (OG image generation, deterministic quote selection). Social sharing is the primary growth driver for daily content sites. Must test with actual social platform scrapers to avoid embarrassing cache issues.

### Requirements Covered

- **SHARE-01**: User can download the quote+image as a single image file (PNG/JPEG)
- **SHARE-02**: User can share via native mobile share menu (Web Share API)
- **SHARE-03**: Shared links display proper Open Graph preview images on social platforms
- **SHARE-04**: User can share directly to Facebook, LinkedIn, and Instagram via share buttons

### Success Criteria

Users can:
1. Tap "Share" on mobile and see native OS share menu with Facebook, Instagram, LinkedIn, etc.
2. Click "Download" on desktop and receive a shareable image file containing the quote and background
3. Share a link to any platform (Facebook, LinkedIn, Twitter) and see quote image in preview (not blank or broken)
4. Share directly to Facebook, LinkedIn, or Instagram with pre-populated text via share buttons
5. Experience zero friction in sharing flow—no account required, no forms, instant action

### Key Deliverables

- Web Share API implementation with desktop fallback (download button)
- Share button component for Facebook, LinkedIn, Instagram
- Open Graph meta tags optimized for all platforms (1200x630 image, title, description)
- Download image functionality (triggers browser download of generated image)
- Social scraper validation testing

### Social Platform Testing

Must validate with actual scraper tools before launch:
- Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/)
- LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/)
- Twitter Card Validator (https://cards-dev.twitter.com/validator)
- Test on physical mobile devices (iPhone, Android), not just responsive mode

### Phase Complete When

- [ ] Mobile users can tap Share and see native share menu with social apps listed
- [ ] Desktop users can click Download and receive quote+background image file
- [ ] Facebook scraper shows quote image preview (not broken or blank)
- [ ] LinkedIn scraper shows quote image preview
- [ ] Twitter scraper shows quote image card preview
- [ ] Instagram share button opens Instagram with pre-populated caption
- [ ] All share actions work without requiring user accounts or login

---

## Phase 3: Polish & Optimization

**Goal:** Understand user behavior through analytics and optimize performance based on real usage patterns.

**Why last:** Optimization should be data-driven after seeing real usage. Premature optimization wastes time. Analytics show where to focus effort. Can defer indefinitely if metrics are good.

### Requirements Covered

*No v1 requirements mapped to this phase—this is iterative polish based on validated product.*

### Success Criteria

Users experience:
1. Fast, reliable performance tracked by Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
2. Diverse quote variety without obvious repetition over 30-day period
3. Error-free experience with graceful fallbacks for API failures
4. Accessible interface meeting WCAG AA standards
5. Smooth interactions with no janky animations or layout shifts

### Key Deliverables

- Analytics integration (Vercel Analytics or Google Analytics)
- Performance monitoring dashboard (Core Web Vitals tracking)
- Error tracking and logging (Sentry or similar)
- Quote variety expansion (add more quotes if users report repetition)
- Accessibility audit and improvements (ARIA labels, keyboard navigation, contrast checks)
- Performance optimizations based on real user metrics (only if needed)

### Optimization Triggers

Only implement when data shows need:
- **Analytics:** Deploy after consistent traffic (>100 daily users)
- **Performance:** Only if Core Web Vitals fail thresholds (LCP >2.5s, CLS >0.1)
- **Quote variety:** User feedback about repetition or running out of content
- **Accessibility:** Audit findings or user accessibility complaints
- **Error tracking:** If production errors exceed 0.1% of requests

### Phase Complete When

- [ ] Analytics tracking page views, unique visitors, and share actions
- [ ] Core Web Vitals meet green thresholds (LCP <2.5s, FID <100ms, CLS <0.1)
- [ ] Error rate <0.1% of total requests with graceful fallback behavior
- [ ] Lighthouse Accessibility score 100 (or documented exceptions with justification)
- [ ] No user reports of quote repetition over 30-day observation period

---

## Phase Dependencies

```
Phase 1 (Core Foundation)
    ↓
Phase 2 (Social Sharing) — depends on OG image generation from Phase 1
    ↓
Phase 3 (Polish) — depends on deployed product with real usage data
```

**No parallelization:** Each phase must complete before next begins. Phase 1 architecture decisions affect everything. Phase 2 needs stable infrastructure. Phase 3 needs real user data.

---

## Out of Scope (v1)

Explicitly excluded to prevent scope creep:

- Historical archive/calendar view — Deferred to v2, may hurt daily return habit
- User-submitted quotes — Requires moderation system, only valuable if v1 succeeds
- Email subscriptions — Focus on social virality first
- User accounts — Creates friction, reduces viral spread
- Quote CMS/admin panel — Not needed until quote variety becomes problem
- Multiple languages — English-only for v1 to validate concept
- Native mobile apps — Web-first, mobile web sufficient

These features are documented in REQUIREMENTS.md v2 section and may be considered after v1 validates core value proposition.

---

## Success Metrics (Post-Launch)

How we'll know if the product delivers core value:

- **Daily Active Users:** >100 within first month (organic + initial seeding)
- **Return Rate:** >30% of users return next day (validates daily habit)
- **Share Rate:** >10% of visitors share quote (validates viral potential)
- **Mobile/Desktop Split:** >60% mobile traffic (validates mobile-first design)
- **Bounce Rate:** <50% (validates content engages users)
- **Load Time:** LCP <2.5s on mobile (validates performance)

---

*Roadmap created: 2025-01-15*  
*Next: Begin Phase 1 planning*
