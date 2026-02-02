# Stack Research

**Domain:** Daily quote/content websites with image generation
**Researched:** 2026-02-02
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | Full-stack React framework | Industry standard for Vercel deployment, built-in API routes for image generation, excellent SEO, server-side rendering for deterministic daily content. Next.js 16 is latest stable with App Router maturity. |
| React | 19.2.4 | UI library | Required by Next.js, latest stable version with improved performance and concurrent features. |
| TypeScript | 5.9.3 | Type safety | Essential for maintainable code, catches errors at compile time, excellent IDE support. Latest stable version. |
| Tailwind CSS | 4.1.18 | Styling framework | Fast development, small bundle size, utility-first approach perfect for simple layouts. v4 is latest with performance improvements. |

### Image Generation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Satori | 0.19.1 | HTML/CSS to SVG conversion | PRIMARY: Convert JSX/HTML to SVG for server-side image generation. Vercel's official library, performant, supports Flexbox layout. Perfect for overlaying text on backgrounds. |
| @vercel/og | 0.8.6 | OG image generation wrapper | OPTIONAL: Higher-level wrapper around Satori. Use if you need simplified API for Open Graph images. Built into Next.js App Router. |
| Sharp | 0.34.5 | Image processing | Convert SVG to PNG, resize images, compress. Fast, production-ready, used by Vercel's infrastructure. Needed for final PNG output and Unsplash image processing. |

### API Integration

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unsplash-js | latest | Official Unsplash SDK | Connect to Unsplash API for fetching landscape backgrounds. Official SDK with TypeScript support. |
| fetch (native) | Built-in | HTTP requests | Fallback if you don't want SDK dependency. Unsplash API is REST/JSON, easy to use directly. |

### Social Sharing

| Approach | Library | Purpose | When to Use |
|----------|---------|---------|-------------|
| Download Button | Native HTML | Browser download | PRIMARY: Let users download PNG and share manually. Simple, no external dependencies, works on all platforms. |
| Share API | Web Share API | Native mobile sharing | RECOMMENDED: Use `navigator.share()` for mobile devices. Zero dependencies, native OS share sheet. Fallback to download on desktop. |
| Direct Share Links | Custom implementation | Social platform URLs | ALTERNATIVE: Create direct share links for Twitter/Facebook/LinkedIn. Simple URL parameters, no library needed. |
| react-share | 5.1.0+ | Pre-built share buttons | AVOID for v1: Adds unnecessary weight. Build custom buttons with platform share URLs instead. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Code linting | Next.js includes config, use `next lint` |
| Prettier | Code formatting | Standard formatting rules |
| Vercel CLI | Local testing | Test deployment locally before pushing |

## Installation

```bash
# Core framework
npx create-next-app@latest daily-demotivations --typescript --tailwind --app --no-src-dir

# Image generation
npm install satori sharp

# Unsplash API
npm install unsplash-js

# Development (if not included)
npm install -D @types/node @types/react @types/react-dom
npm install -D eslint-config-next prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Satori + Sharp | Puppeteer/Playwright | Only if you need browser-level CSS features Satori doesn't support (rare). Much slower and heavier. |
| Next.js | Astro | If you want static site generation without React. Not recommended for this project due to less mature image generation ecosystem. |
| Tailwind CSS | Vanilla CSS | If team strongly prefers CSS. Tailwind is faster for prototyping and has smaller bundle with purging. |
| Web Share API | react-share library | Only if you need custom styled share buttons for desktop. Adds ~10KB+ for features you can build in 20 lines. |
| Unsplash API | Pexels/Pixabay | If Unsplash rate limits are too restrictive (unlikely for daily quotes). Unsplash has best API and attribution system. |
| Sharp | Jimp | Only for pure JavaScript environments. Sharp is 10-20x faster due to native bindings. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| html2canvas | Client-side only, slower, inconsistent rendering across browsers, can't run on server | Satori (server-side, consistent) |
| Canvas API directly | Low-level, complex text rendering, poor typography support | Satori (declarative JSX) |
| Older image libraries (ImageMagick bindings) | Heavy, complex API, harder to deploy on serverless | Sharp (modern, serverless-friendly) |
| @vercel/og on its own | Limits customization, abstracts too much for this use case | Satori directly (full control) |
| Social share button libraries | Add unnecessary weight (10-50KB), overkill for simple share links | Native Web Share API + custom share URLs |
| Pages Router (Next.js) | Older pattern, less optimal for this use case | App Router (better for server components, modern features) |
| Database for v1 | Over-engineering, not needed for static quote list | JSON file or TypeScript array |

## Stack Patterns by Variant

**For maximum simplicity (recommended for v1):**
- Next.js App Router with Route Handlers
- Satori for quote rendering
- Sharp for PNG conversion
- Static quote array in TypeScript
- Web Share API + download button
- Unsplash API with server-side caching

**If you need more flexibility:**
- Add Redis for caching Unsplash images
- Add database for dynamic quote management
- Add admin panel (keep for v2+)

**For static export (not recommended):**
- Use `output: 'export'` in next.config.js
- Pre-generate all daily images at build time
- Lose dynamic API routes and on-demand generation
- Significantly larger deploy size

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.1.6 | React 19.x | React 19 is default, fully compatible |
| Satori 0.19.1 | Next.js 16.x | Tested with latest Next.js |
| Sharp 0.34.5 | Node.js 18.17+ | Works on Vercel Edge Runtime |
| @vercel/og 0.8.6 | Next.js 13.3+ | Built-in ImageResponse in App Router |
| Tailwind CSS 4.x | Next.js 16.x | v4 has new engine, fully compatible with Next.js |

## Deployment Architecture

**Vercel (Recommended):**
```
- Next.js app deploys as Vercel Functions
- Image generation runs server-side (Edge Runtime compatible)
- Unsplash API calls from server (hide API key)
- Static assets (fonts, logos) served from CDN
- Daily quote determined by date on server
- Generated images cached at CDN edge
```

**Key Benefits:**
1. Zero configuration deployment
2. Automatic HTTPS and CDN
3. Edge runtime for global performance
4. Built-in image optimization
5. Environment variable management
6. Preview deployments for PRs

## Critical Implementation Notes

### Image Generation Flow
```
1. User visits site on specific date
2. Server calculates daily index from date
3. Server fetches corresponding quote from array
4. Server fetches random Unsplash landscape (cached 24h)
5. Satori renders quote as SVG overlay
6. Sharp converts SVG + background to PNG
7. Cache result for 24 hours
8. Return image to client
```

### Deterministic Daily Content
```typescript
// Ensure everyone sees same quote per day
function getDailyIndex(date: Date): number {
  const startDate = new Date('2025-01-01')
  const diffTime = Math.abs(date - startDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays % quotes.length
}
```

### Unsplash API Best Practices
- Cache images for 24 hours minimum
- Use `?orientation=landscape` parameter
- Implement attribution as required by Unsplash guidelines
- Use `regular` size (1080px) for balance of quality/performance
- Store API key in environment variable (server-only)

### Social Sharing Implementation
```typescript
// Modern approach - Web Share API with fallback
if (navigator.share) {
  navigator.share({
    title: 'Daily Demotivation',
    text: quoteText,
    url: window.location.href
  })
} else {
  // Fallback: trigger download
  downloadImage()
}
```

### Font Loading for Satori
```typescript
// Load fonts once at module level, not per request
const fontRegular = fs.readFileSync('./fonts/Inter-Regular.ttf')
const fontBold = fs.readFileSync('./fonts/Inter-Bold.ttf')

// Pass to Satori
await satori(jsx, {
  fonts: [
    { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
    { name: 'Inter', data: fontBold, weight: 700, style: 'normal' }
  ]
})
```

## Performance Considerations

| Concern | Solution | Expected Metric |
|---------|----------|-----------------|
| Image generation time | Cache generated images for 24h, use Edge Runtime | <2s first generation, <100ms cached |
| Unsplash API rate limits | Cache fetched images, use 50 requests/hour wisely | ~2 API calls per day (new image + fallback) |
| Bundle size | Use dynamic imports for Sharp, tree-shaking | <200KB initial JS |
| Core Web Vitals | Server-side generation, optimized images, CDN | LCP <2.5s, CLS <0.1 |

## Sources

- Next.js Official Documentation (https://nextjs.org/docs) — Version verification, App Router patterns — HIGH confidence
- Vercel Next.js Framework Page (https://vercel.com/docs/frameworks/nextjs) — Deployment patterns, image generation — HIGH confidence
- Satori GitHub Repository (https://github.com/vercel/satori) — Latest version 0.19.1, API capabilities — HIGH confidence
- Unsplash API Documentation (https://unsplash.com/developers) — API patterns, rate limits, attribution — HIGH confidence
- npm registry — Version numbers for all packages (2026-02-02) — HIGH confidence
- Web Share API (MDN) — Native sharing capabilities — HIGH confidence

---
*Stack research for: Daily Demotivations*
*Researched: 2026-02-02*
