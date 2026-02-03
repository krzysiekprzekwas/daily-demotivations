# Open Graph Image Testing Guide

## Implementation Complete ✅

The OG image enhancements (SHARE-03) have been fully implemented with the following features:

### Features Implemented

1. **Complete OG Meta Tags** (layout.tsx & page.tsx)
   - ✅ og:title
   - ✅ og:description  
   - ✅ og:url
   - ✅ og:image
   - ✅ og:image:width (1200px)
   - ✅ og:image:height (630px)
   - ✅ og:image:alt
   - ✅ og:image:type (image/png)
   - ✅ og:type (website)
   - ✅ og:locale (en_US)
   - ✅ og:site_name

2. **Twitter Card Meta Tags** (layout.tsx & page.tsx)
   - ✅ twitter:card (summary_large_image)
   - ✅ twitter:title
   - ✅ twitter:description
   - ✅ twitter:image
   - ✅ twitter:site

3. **Date Parameter Support** (/api/og route)
   - ✅ Accepts ?date=YYYY-MM-DD for future permalink functionality
   - ✅ Falls back to today's date if no parameter provided
   - ✅ Validates date format before use

4. **Aggressive Cache Headers** (/api/og route)
   - ✅ Immutable cache for date-based URLs (1 year)
   - ✅ 24-hour cache for current day with stale-while-revalidate
   - ✅ Proper Content-Type headers

5. **Environment Configuration**
   - ✅ NEXT_PUBLIC_BASE_URL for absolute URLs in production

## Testing Locally

### 1. Test OG Image Generation

```bash
# Current day (24h cache)
curl -I http://localhost:3000/api/og

# Expected headers:
# cache-control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200
# content-type: image/png

# With date parameter (immutable cache)
curl -I http://localhost:3000/api/og?date=2024-12-25

# Expected headers:
# cache-control: public, max-age=31536000, immutable
# content-type: image/png
```

### 2. View Generated Images

Visit in browser:
- Current day: http://localhost:3000/api/og
- Specific date: http://localhost:3000/api/og?date=2024-12-25

### 3. Verify Meta Tags

Run in browser console on http://localhost:3000:

```javascript
Array.from(document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]'))
  .map(tag => ({
    property: tag.getAttribute('property') || tag.getAttribute('name'),
    content: tag.getAttribute('content')
  }))
```

Expected output includes all required tags with correct values.

## Testing with Platform Debuggers

### Facebook Sharing Debugger
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your production URL
3. Click "Scrape Again" to refresh cache
4. Verify all OG tags are detected and image displays correctly

### LinkedIn Post Inspector
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter your production URL
3. Verify preview image and metadata

### Twitter Card Validator
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your production URL  
3. Verify card type is "summary_large_image"
4. Verify image loads correctly

### Open Graph Check (Universal)
1. Visit: https://www.opengraph.xyz/
2. Enter your production URL
3. View complete OG metadata analysis

## Production Deployment Checklist

- [ ] Set `NEXT_PUBLIC_BASE_URL` environment variable to production domain
- [ ] Update `twitter:site` in layout.tsx if Twitter handle changes
- [ ] Test with all platform debuggers after deployment
- [ ] Verify CDN is caching OG images appropriately
- [ ] Monitor OG image generation performance

## Troubleshooting

### Image not updating on social media
- Social platforms cache OG images aggressively
- Use platform debuggers to force refresh
- Ensure cache headers are correct
- Date-based URLs bypass cache issues (immutable)

### Image not displaying
- Check NEXT_PUBLIC_BASE_URL is set correctly
- Verify image URL is absolute (not relative)
- Check Content-Type header is image/png
- Ensure image generation doesn't throw errors

### Wrong quote showing
- OG images cache separately from page content
- Date parameter not implemented for quote selection yet
- Will be enhanced in future permalink feature
