# Phase 01-03: User Setup Required

**Generated:** 2026-02-02
**Phase:** 01-core-foundation--content-display
**Plan:** 03
**Status:** Incomplete

This plan introduced external services requiring manual configuration before the integration can function.

## Overview

The Unsplash API integration provides romantic landscape background images for the daily demotivations. While the code includes fallback images for graceful degradation, production use requires Unsplash API access.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `UNSPLASH_ACCESS_KEY` | Unsplash Developers → Create Application → Copy Access Key | `.env.local` |

### How to obtain UNSPLASH_ACCESS_KEY

1. Visit [Unsplash Developers](https://unsplash.com/developers)
2. Sign up or log in to your Unsplash account
3. Create a new application:
   - Go to [Your Applications](https://unsplash.com/oauth/applications)
   - Click "New Application"
   - Accept the terms of service
   - Fill in application details:
     - **Application name:** Daily Demotivations
     - **Description:** Daily demotivating quotes on romantic landscapes
4. Copy your Access Key from the application dashboard
5. Add to `.env.local`:
   ```
   UNSPLASH_ACCESS_KEY=your_access_key_here
   ```

## Account Setup

- [ ] **Create Unsplash Developer Account**
  - Location: https://unsplash.com/join
  - Create a free developer account if you don't have one

## Dashboard Configuration

- [ ] **Create New Application**
  - Location: https://unsplash.com/oauth/applications → New Application
  - Name: "Daily Demotivations"
  - Description: "Daily demotivating quotes on romantic landscapes"
  - Accept Terms of Service

- [ ] **Apply for Production API Access (5000 req/hour)**
  - Location: Application settings → Request Production Access
  - **IMPORTANT:** Demo tier provides only 50 requests/hour, which is insufficient for real traffic
  - Production approval takes 1-3 days
  - Apply immediately to avoid delays in production deployment

## API Rate Limits

| Tier | Requests/Hour | Status |
|------|---------------|--------|
| Demo | 50 | Default for new applications |
| Production | 5,000 | Requires application approval |

**Note:** The implementation includes automatic fallback to local images when rate limited, but production tier is recommended for live deployment.

## Verification

After completing the setup, verify the integration works:

```bash
# 1. Ensure environment variable is set
cat .env.local | grep UNSPLASH_ACCESS_KEY

# 2. Start dev server
npm run dev

# 3. Check console for Unsplash API calls (should not see fallback warnings)
# Look for successful photo fetches in the Next.js dev console
```

## Fallback Mode

The integration includes 5 high-quality CC0-licensed fallback images. The site will work without Unsplash API access, but will show the same static images repeatedly.

**Fallback behavior:**
- No API key set → Uses fallback images immediately
- API rate limited → Falls back to static images
- Network error → Falls back to static images

## Next Steps

1. Complete all checklist items above
2. Verify the integration works using the verification steps
3. Apply for production API access immediately (approval takes 1-3 days)
4. Mark this file as "Complete" when all setup is finished

---

**Once all items are complete:** Update status above to "Complete"
