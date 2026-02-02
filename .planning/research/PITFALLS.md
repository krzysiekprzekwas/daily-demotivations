# Pitfalls Research

**Domain:** Daily quote/content websites with server-side image generation
**Researched:** 2026-02-02
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Cold Start Image Generation Timeout

**What goes wrong:**
Serverless functions hit timeout (5 minutes on Hobby, 13 minutes on Pro) when generating images during cold starts. Image generation libraries load slowly, fonts must be downloaded/initialized, and the first request can easily exceed timeout limits. Users see 504 errors instead of images.

**Why it happens:**
- Image generation libraries (canvas, sharp, puppeteer) are large and slow to initialize
- Font files must be loaded into memory
- External API calls (Unsplash) add latency
- Vercel cold starts compound the problem (no warm runtime)

**How to avoid:**
1. Use Edge Runtime instead of Node.js runtime (25-second streaming requirement but can continue for 5 minutes)
2. Pre-generate and cache images at build time for deterministic content
3. Use lightweight image generation libraries (@vercel/og uses Satori, much faster than canvas)
4. Implement aggressive caching with stale-while-revalidate pattern
5. Keep function bundle size under 1MB (slower cold starts above this)

**Warning signs:**
- Local generation works fine but production times out
- Image generation takes >2 seconds locally
- Function bundle size approaching 250MB limit
- Memory usage approaching 2GB on Hobby tier

**Phase to address:**
Phase 1 (Core Infrastructure) - Choose the right image generation approach from the start. Migration later is expensive.

---

### Pitfall 2: Unsplash API Rate Limit Exhaustion

**What goes wrong:**
Unsplash API has strict rate limits: 50 requests/hour in demo mode, 5000 requests/hour in production. A single viral day can exhaust limits, causing all images to fail. The site breaks for all users simultaneously.

**Why it happens:**
- Each user visit = 1 API call if not cached properly
- Demo mode limits are extremely low (50/hour = less than 1 per minute)
- Production approval takes time and isn't guaranteed
- No fallback when limits hit
- Deterministic daily content means cache misses are synchronized (everyone hits at midnight)

**How to avoid:**
1. Implement multi-layer caching strategy:
   - CDN cache with 24-hour TTL for generated images
   - Edge cache for image URLs (separate from generated images)
   - Local fallback images for when API fails
2. Pre-fetch and cache Unsplash images at build time for deterministic content
3. Apply for production API access BEFORE launching
4. Implement exponential backoff and circuit breaker for API calls
5. Use Unsplash's `download` endpoint to track views (required by TOS but doesn't count against limits)
6. Monitor rate limit headers (`X-Ratelimit-Remaining`) and implement soft limits

**Warning signs:**
- Rate limit headers show <100 remaining requests
- 429 status codes from Unsplash API
- Multiple requests for the same daily content
- Missing `Cache-Control` headers on image endpoints

**Phase to address:**
Phase 1 (Core Infrastructure) - Caching architecture must be designed upfront. Retrofitting caching is risky.

---

### Pitfall 3: Missing `ixid` Parameter Breaks Unsplash Analytics

**What goes wrong:**
Unsplash requires the `ixid` parameter in all image URLs to track attribution and usage. Removing or losing this parameter violates API guidelines and can result in API access revocation. Many developers accidentally strip it during URL manipulation.

**Why it happens:**
- Image URLs are transformed for resizing (`w`, `h`, `fit` parameters)
- URL parsing libraries may drop "unknown" parameters
- Developers copy the wrong URL property (using `urls.full` instead of `urls.raw`)
- Query parameters get encoded/decoded incorrectly during transformations

**How to avoid:**
1. Always start with `urls.raw` and append parameters
2. Parse and preserve `ixid` explicitly in URL transformation logic
3. Add validation tests that check for `ixid` presence
4. Document this requirement in code comments
5. Use Unsplash's official SDKs when possible (they handle this correctly)

**Warning signs:**
- Generated image URLs missing `ixid` parameter
- Using `urls.full` or other pre-formatted URLs as base
- Custom URL manipulation code without `ixid` preservation logic

**Phase to address:**
Phase 1 (Core Infrastructure) - Image URL handling must preserve `ixid` from day one. Violation can result in API ban.

---

### Pitfall 4: Social Media OG Image Caching Hell

**What goes wrong:**
Facebook, LinkedIn, and Twitter aggressively cache Open Graph images. When you fix bugs or update designs, social platforms continue showing old cached images for weeks. The scraper cache is separate from browser cache, making debugging extremely confusing.

**Why it happens:**
- Social platforms cache OG images independently at scrape time
- Cache invalidation requires using platform-specific debug tools
- Dynamic query parameters in OG image URLs trigger re-scraping but may violate some scrapers
- Each platform has different caching behavior and debug tools

**How to avoid:**
1. Use deterministic URLs with date in path (e.g., `/og-image/2026-02-02.png`) not query params
2. Test with platform scraper debug tools BEFORE launching:
   - Facebook: https://developers.facebook.com/tools/debug/
   - LinkedIn: https://www.linkedin.com/post-inspector/
   - Twitter: Card Validator (requires developer account)
3. Implement versioning in OG image URLs for design changes (`/og-image/v2/2026-02-02.png`)
4. Set appropriate cache headers for social scrapers:
   - `Cache-Control: public, max-age=86400` (24 hours for daily content)
   - `Vercel-CDN-Cache-Control: public, max-age=86400`
5. Document the cache busting process for future updates

**Warning signs:**
- Shared links show old images on social platforms
- OG image URL uses query parameters for content variations
- No versioning strategy for OG images
- Missing or incorrect `Cache-Control` headers

**Phase to address:**
Phase 2 (Social Sharing) - Test social sharing URLs with real scraper tools before announcing launch. Post-launch fixes are painful.

---

### Pitfall 5: Serverless Payload Size Limit for Generated Images

**What goes wrong:**
Vercel Functions have a 4.5MB response payload limit. High-quality generated images (especially PNG format) easily exceed this limit, causing 413 errors. Users can't download or share images.

**Why it happens:**
- PNG format produces large files for photos with gradients (landscape backgrounds)
- Default quality settings prioritize quality over size
- Multiple text layers or effects increase image size
- 1200x630 images at high quality approach or exceed 4.5MB

**How to avoid:**
1. Use JPEG format for generated images (much smaller than PNG for photos)
2. Set compression quality to 80-85% (imperceptible quality loss, significant size reduction)
3. Use WebP format where supported (better compression than JPEG)
4. Implement size checking and adaptive quality:
   ```javascript
   let quality = 85;
   let buffer = await generateImage(quality);
   while (buffer.length > 4_000_000 && quality > 60) {
     quality -= 5;
     buffer = await generateImage(quality);
   }
   ```
5. Consider redirecting to CDN-hosted static image if generation would exceed limit
6. For streaming responses, check size incrementally

**Warning signs:**
- Generated images approaching 3MB in size
- Using PNG format for photo backgrounds
- No compression quality configuration
- No size validation before sending response

**Phase to address:**
Phase 1 (Core Infrastructure) - Image format and compression settings must be right from the start.

---

### Pitfall 6: Deterministic Content Cache Stampede at Midnight

**What goes wrong:**
All users see the same daily content, which changes at midnight. At 00:00:00, thousands of simultaneous requests all miss the cache, causing a stampede that overwhelms the serverless functions. The site becomes unavailable for minutes during the busiest traffic moment.

**Why it happens:**
- Cache expires at midnight when content changes
- All users in a timezone hit at the same moment
- Serverless cold starts can't scale fast enough
- Each request generates a new image until cache is populated
- Multiple regions create multiple cache stampedes

**How to avoid:**
1. Pre-generate tomorrow's content at 23:45 and warm the cache
2. Use stale-while-revalidate to serve yesterday's content during regeneration:
   ```
   Cache-Control: public, s-maxage=86400, stale-while-revalidate=300
   ```
3. Implement request coalescing (deduplicate simultaneous identical requests)
4. Use Edge Runtime for faster cold starts
5. Consider build-time generation for deterministic content
6. Add randomized jitter to cache expiry (23:59:30 ± 60s instead of exactly midnight)
7. Use Vercel ISR (Incremental Static Regeneration) for Next.js apps

**Warning signs:**
- Traffic spikes exactly at midnight
- Multiple identical image generation requests in logs
- Cold start latency during traffic peaks
- No stale-while-revalidate strategy
- Cache TTL aligns exactly with content change time

**Phase to address:**
Phase 1 (Core Infrastructure) - Caching strategy must prevent stampedes from day one. Post-launch fixes during outages are stressful.

---

### Pitfall 7: Font Loading Failures in Serverless Environment

**What goes wrong:**
Custom fonts fail to load in serverless functions, causing generated images to use fallback fonts (usually ugly system fonts). The polished aesthetic is lost. Fonts may load locally but fail in production.

**Why it happens:**
- Font files not included in function deployment bundle
- Incorrect font file paths in serverless environment
- Font files exceed function size limits when bundled
- Dynamic font loading requires filesystem access (limited in serverless)
- Font licensing restrictions prevent bundling

**How to avoid:**
1. Use `@vercel/og` with built-in fonts (automatically bundled)
2. For custom fonts, use `includeFiles` in vercel.json:
   ```json
   {
     "functions": {
       "api/og-image.ts": {
         "includeFiles": "public/fonts/**"
       }
     }
   }
   ```
3. Embed fonts as base64 data URLs (small fonts only, increases bundle size)
4. Use Google Fonts or CDN-hosted fonts with proper CORS headers
5. Verify font licensing allows server-side rendering
6. Test font loading in production-like environment before launch

**Warning signs:**
- Fonts work locally but fail in deployment
- Function bundle size increases significantly with fonts
- No font files in deployment preview
- Using dynamic font loading from external sources

**Phase to address:**
Phase 1 (Core Infrastructure) - Font strategy must work in serverless from the start. Typography is critical to aesthetic.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip Unsplash production approval, use demo mode | Launch immediately, no approval wait | Hard 50 req/hour limit, site breaks with any traffic | Never for public launch, only for private testing |
| Use query params for date in OG image URL (`/og?date=2026-02-02`) | Simpler routing logic | Social media caching issues, harder to debug, CDN cache key conflicts | Never - path-based URLs are just as easy |
| Generate images on every request (no caching) | Simpler code, no cache invalidation logic | Unsplash rate limits exhausted, slow response times, high costs | Only during initial development/testing |
| Bundle large image libraries (canvas, puppeteer) | Full feature set, familiar APIs | Slow cold starts (>5 seconds), large bundle size, timeout risk | Never on Vercel - use lightweight alternatives |
| Hard-code font paths from local development | Works on your machine | Fails in production, silent fallback to system fonts | Never - use environment-aware paths from day one |
| Use PNG format for all images | Best quality, transparency support | Large file sizes, 4.5MB limit issues, slower downloads | Only for logos/UI elements, never for photo backgrounds |
| Skip social scraper testing | Ship faster, no external tool dependencies | Broken social sharing discovered by users, embarrassing public failures | Never - testing takes 5 minutes per platform |
| Use `urls.full` instead of `urls.raw` | One less string concatenation | Lose control over image size, miss `ixid` requirement, violate API terms | Never - proper URL handling is critical |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Unsplash API | Not calling the `download` endpoint when image is used | Call `photo.links.download_location` via API (doesn't count against rate limit, required by TOS) |
| Unsplash API | Removing `ixid` parameter during URL transformations | Always preserve `ixid` parameter, start with `urls.raw` |
| Facebook OG | Using relative URLs for `og:image` | Use absolute URLs with protocol: `https://domain.com/og-image.png` |
| LinkedIn OG | Image dimensions below 1200x627 minimum | Use exactly 1200x630 (or larger), aspect ratio ~1.91:1 |
| Twitter Cards | Missing `twitter:card` meta tag | Include both OG tags and Twitter-specific tags for best compatibility |
| Vercel CDN | Not setting `s-maxage` for caching | Use `Cache-Control: public, s-maxage=86400` for daily content |
| Vercel Functions | Exceeding 4.5MB response size | Compress images, use JPEG, check size before sending |
| Next.js Image | Using `next/image` for dynamically generated OG images | Social scrapers can't render Next.js Image - use direct URLs |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Generating images in browser/client-side | Slow renders, inconsistent output, mobile failures | Always generate server-side, cache aggressively | Any mobile device, slow connections |
| Missing CDN cache headers | Every request hits serverless function, high latency, costs increase | Set `Cache-Control` with `s-maxage` on all image responses | >100 requests/day |
| Large function bundle (>50MB) | Slow cold starts (>3s), frequent timeouts | Use lightweight libraries (@vercel/og not canvas), optimize imports | First request after idle |
| Synchronous external API calls | Compounding latency (500ms Unsplash + 2s generation = 2.5s response) | Fetch images ahead of time, cache URLs, parallel requests | Every uncached request |
| No image optimization | Large downloads (>5MB), slow social sharing, poor mobile experience | Compress images, use appropriate formats, quality 80-85% | Users on slow connections |
| Missing stale-while-revalidate | Cache expiry causes stampede, all users wait for regeneration | Use `stale-while-revalidate=300` to serve stale during regen | Midnight rollover, deployments |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Unsplash API key in client-side code | Key theft, quota exhaustion, API access revocation | Keep API keys server-side only, use environment variables |
| No rate limiting on image generation endpoint | DDoS vulnerability, quota exhaustion, high costs | Implement rate limiting (Vercel Edge Config, Upstash), cache aggressively |
| Accepting arbitrary text input without sanitization | XSS in generated images, injection attacks | Sanitize all text input, validate against whitelist for demo content |
| Missing CORS headers on image endpoints | Images blocked from other domains, social sharing fails | Set appropriate CORS headers: `Access-Control-Allow-Origin: *` for public images |
| No input validation for date parameters | Server errors, cache poisoning, potential exploits | Validate date format, range (e.g., only future 7 days, past 30 days) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state while image generates | Blank screen, user thinks site is broken | Show loading indicator, pre-render placeholder |
| Broken social share on first attempt | User thinks sharing is broken, doesn't retry | Warm cache before user clicks share, implement retry logic |
| Generic error messages ("Something went wrong") | User can't report useful bug info, support nightmare | Show specific errors in dev, friendly but actionable messages in production |
| No fallback when Unsplash API fails | Site completely broken, no content shown | Implement fallback images, graceful degradation |
| Download button produces 4.5MB+ images | Download fails silently, user blames browser | Compress images, show file size, offer quality options |
| Mobile text too small on generated images | Unreadable on mobile devices where users share most | Test text size on mobile screens, use responsive font sizing |
| No visual feedback on share button click | User clicks multiple times, creates duplicate shares | Show loading/success state, disable button temporarily |

## "Looks Done But Isn't" Checklist

- [ ] **Social Sharing:** Tested with actual social platform scraper tools (Facebook Debugger, LinkedIn Inspector), not just local browser
- [ ] **Caching:** Verified `Cache-Control` headers are present in production responses (not just dev)
- [ ] **Unsplash Attribution:** Download endpoint called when image is used (check network tab), not just displaying the image
- [ ] **Image URLs:** `ixid` parameter present in all Unsplash URLs (check generated HTML source)
- [ ] **Mobile Testing:** Generated images tested on actual mobile devices, not just responsive browser tools
- [ ] **Error Handling:** Tested behavior when Unsplash API returns errors (disable network, test 429 rate limit)
- [ ] **Performance:** Cold start tested by clearing cache and waiting 5 minutes (simulates real cold start)
- [ ] **Bundle Size:** Verified deployed function size is <10MB (check Vercel deployment logs)
- [ ] **Midnight Rollover:** Tested cache behavior at content change time (simulate by changing system date)
- [ ] **Rate Limits:** Monitored rate limit headers in production, not just assumed they work

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Unsplash rate limit exhausted | LOW | 1. Implement fallback images immediately 2. Wait for limit reset (1 hour) 3. Fix caching to prevent recurrence |
| Social media showing cached old images | MEDIUM | 1. Update OG image URL path (add version or date) 2. Use platform debugger tools to force re-scrape 3. Wait 24-48 hours for cache expiry |
| Function timeout on image generation | HIGH | 1. Switch to Edge Runtime or lighter library 2. May require full rewrite of image generation 3. Pre-generate images at build time as interim fix |
| 4.5MB payload exceeded | LOW | 1. Add image compression logic 2. Lower JPEG quality to 75% 3. Deploy fix immediately (5 minutes) |
| Font loading fails in production | MEDIUM | 1. Switch to system fonts temporarily 2. Fix font bundling configuration 3. Redeploy (requires testing) |
| Cache stampede at midnight | MEDIUM | 1. Add stale-while-revalidate header 2. Implement pre-warming script 3. Requires deployment + monitoring |
| Missing `ixid` parameter | HIGH | 1. Fix URL generation logic immediately 2. Risk of API access revocation if reported 3. Audit all code paths that touch Unsplash URLs |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Cold start timeout | Phase 1: Core Infrastructure | Load test with cold function, verify <3s response time |
| Unsplash rate limits | Phase 1: Core Infrastructure | Monitor rate limit headers, verify caching works, apply for production access |
| Missing `ixid` parameter | Phase 1: Core Infrastructure | Automated test checks for `ixid` in generated URLs |
| Social OG caching | Phase 2: Social Sharing | Test all sharing platforms with scraper tools before launch |
| 4.5MB payload limit | Phase 1: Core Infrastructure | Test image generation with largest expected content, verify size <4MB |
| Cache stampede | Phase 1: Core Infrastructure | Simulate midnight rollover with date changes, verify stale-while-revalidate works |
| Font loading failures | Phase 1: Core Infrastructure | Deploy to staging, verify fonts render correctly |

## Sources

- Vercel Functions Limitations: https://vercel.com/docs/functions/limitations (Official, HIGH confidence)
- Vercel CDN Caching: https://vercel.com/docs/edge-network/caching (Official, HIGH confidence)
- Unsplash API Documentation: https://unsplash.com/documentation (Official, HIGH confidence)
- Unsplash API Guidelines: https://help.unsplash.com/api-guidelines/unsplash-api-guidelines (Referenced in docs, MEDIUM confidence)
- Domain knowledge: Daily content website patterns, serverless image generation (Based on common patterns, MEDIUM confidence)
- Social media OG caching behavior (Industry knowledge, MEDIUM confidence)

---
*Pitfalls research for: Daily quote/content websites with server-side image generation*
*Researched: 2026-02-02*
