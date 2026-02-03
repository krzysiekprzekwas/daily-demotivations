# 🚀 Production Deployment Checklist

**Date Created:** January 2025  
**Project:** Daily Demotivations v3  
**Last Commit:** `42edb44` - Security implementation guide  
**Target Platform:** Vercel

---

## 📋 Pre-Deployment Tasks

### 1. Database Setup (15-20 minutes) ⏳

#### Step 1.1: Generate Restricted User Password
```bash
openssl rand -base64 32
```
**Save this password securely!** You'll need it in multiple places.

#### Step 1.2: Create Restricted Database User
1. Navigate to: https://console.neon.tech/
2. Select your project
3. Go to SQL Editor
4. Copy and paste the SQL from `scripts/create-restricted-db-user.sql`
5. Replace `GENERATED_PASSWORD` with the password from Step 1.1
6. Execute the SQL script

**SQL to run:**
```sql
-- Create restricted user for runtime operations
CREATE USER daily_demotivations_app WITH PASSWORD 'YOUR_GENERATED_PASSWORD';

-- Grant connection and schema access
GRANT CONNECT ON DATABASE neondb TO daily_demotivations_app;
GRANT USAGE ON SCHEMA public TO daily_demotivations_app;

-- Grant table permissions (no DROP or ALTER)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO daily_demotivations_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daily_demotivations_app;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO daily_demotivations_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO daily_demotivations_app;
```

#### Step 1.3: Verify User Creation
```sql
-- Should return one row
SELECT usename FROM pg_user WHERE usename = 'daily_demotivations_app';

-- Should show granted permissions
\du daily_demotivations_app
```

- [ ] Password generated and saved
- [ ] SQL script executed successfully
- [ ] User creation verified

---

### 2. Local Environment Configuration

#### Step 2.1: Update `.env.local`
```bash
# Runtime queries (restricted user)
DATABASE_URL=postgresql://daily_demotivations_app:NEW_PASSWORD@ep-misty-night-agly03gw-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Migrations only (owner user - unchanged)
DIRECT_DATABASE_URL=postgresql://neondb_owner:npg_WAecz25uaUSv@ep-misty-night-agly03gw.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Admin authentication (strong password - already set)
ADMIN_PASSWORD=1kmF1YtJlIR1LtGM0gaFvcCkRupzHn7Df2PVgn5mJ+Q=

# Session encryption (already set)
SESSION_SECRET=yiCFPoHzF0RQQd0BcSDbR1eDBiCaxI6lxLP31ha9Pgo=

# Unsplash API (already set)
UNSPLASH_ACCESS_KEY=w4bQCgiDZjq2GX7F4WvEikP9JBdcAzoGNT6lSlgx-qk

# Feature flags
USE_DATABASE=true

# Base URL (local testing)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**⚠️ Important:** Replace `NEW_PASSWORD` in DATABASE_URL with the password from Step 1.1

- [ ] `.env.local` updated with restricted DATABASE_URL
- [ ] DIRECT_DATABASE_URL still uses owner user
- [ ] All other variables present

---

### 3. Local Testing with Restricted User

#### Step 3.1: Start Development Server
```bash
npm run dev
```

#### Step 3.2: Test Admin Panel Access
1. Navigate to: http://localhost:3000/admin/login
2. Login with password: `1kmF1YtJlIR1LtGM0gaFvcCkRupzHn7Df2PVgn5mJ+Q=`
3. Should redirect to admin dashboard

#### Step 3.3: Test CRUD Operations
**Quotes:**
- [ ] Create a new quote
- [ ] Edit existing quote
- [ ] Delete a quote
- [ ] View quotes list

**Images:**
- [ ] Create new image (paste Unsplash URL)
- [ ] Edit existing image
- [ ] Delete an image
- [ ] View images list

**Pairings:**
- [ ] Create pairing with "Random from Unsplash"
- [ ] Create pairing with "Use existing image"
- [ ] Edit existing pairing
- [ ] Delete a pairing
- [ ] Visual preview displays correctly

#### Step 3.4: Test Special Features
**Auto-Schedule:**
- [ ] Click "🪄 Auto-Schedule" button
- [ ] Fill in 7 days
- [ ] Submit and verify statistics
- [ ] Check pairings list shows new entries
- [ ] Verify no duplicate dates

**Multi-line Quotes:**
- [ ] Create quote with line breaks (press Enter in textarea)
- [ ] Verify preview shows line breaks
- [ ] Check homepage displays line breaks
- [ ] Verify pairings preview shows line breaks

**Rate Limiting:**
- [ ] Try 3 wrong passwords - should show error
- [ ] Try 6 wrong passwords - should block for 15 minutes
- [ ] Wait 1 minute - should still be blocked
- [ ] Restart server - should reset (in-memory)

**Session Management:**
- [ ] Login to admin panel
- [ ] Wait 30 seconds, perform action (create quote)
- [ ] Verify session extends (no logout)
- [ ] Close browser, wait 5 minutes, return
- [ ] Verify still logged in (sliding expiration)

#### Step 3.5: Test Homepage
- [ ] Navigate to http://localhost:3000
- [ ] Quote displays with background image
- [ ] Download button works
- [ ] Share button works (if supported by browser)
- [ ] OG image generates: http://localhost:3000/api/og

#### Step 3.6: Verify Database Connection
Check terminal logs for:
```
[quotes-db] USE_DATABASE=true - using database
```
**NOT:**
```
[quotes-db] USE_DATABASE=false - using hardcoded quotes
```

- [ ] All tests passed
- [ ] No console errors
- [ ] Restricted user has sufficient permissions

---

### 4. Build Verification

```bash
npm run build
```

**Expected output:**
- ✅ Compiled successfully
- ✅ No TypeScript errors
- ✅ All routes generated
- ❌ No build failures

- [ ] Build passes without errors
- [ ] No TypeScript errors
- [ ] No missing dependencies

---

## 🌐 Vercel Deployment

### 5. Environment Variables Configuration

Navigate to: https://vercel.com/your-project/settings/environment-variables

**Add/Update the following variables:**

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://daily_demotivations_app:PASSWORD@...` | Production, Preview |
| `DIRECT_DATABASE_URL` | `postgresql://neondb_owner:npg_WAecz25uaUSv@...` | Production, Preview |
| `ADMIN_PASSWORD` | `1kmF1YtJlIR1LtGM0gaFvcCkRupzHn7Df2PVgn5mJ+Q=` | Production, Preview |
| `SESSION_SECRET` | `yiCFPoHzF0RQQd0BcSDbR1eDBiCaxI6lxLP31ha9Pgo=` | Production, Preview |
| `UNSPLASH_ACCESS_KEY` | `w4bQCgiDZjq2GX7F4WvEikP9JBdcAzoGNT6lSlgx-qk` | Production, Preview |
| `USE_DATABASE` | `true` | Production, Preview |
| `NEXT_PUBLIC_BASE_URL` | `https://your-domain.vercel.app` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://preview-domain.vercel.app` | Preview |

**⚠️ Critical:**
- `DATABASE_URL` must use **restricted user** (`daily_demotivations_app`)
- `DIRECT_DATABASE_URL` must use **owner user** (`neondb_owner`)
- Use **pooler endpoint** for DATABASE_URL (has `-pooler` in hostname)
- Use **direct endpoint** for DIRECT_DATABASE_URL (no `-pooler`)

**Checklist:**
- [ ] All 7 environment variables added to Vercel
- [ ] DATABASE_URL uses restricted user
- [ ] DIRECT_DATABASE_URL uses owner user
- [ ] NEXT_PUBLIC_BASE_URL set to production domain
- [ ] Variables applied to both Production and Preview environments

---

### 6. Deploy to Production

#### Option A: Deploy from CLI
```bash
# Deploy to production
vercel --prod

# After deployment completes, note the URL
```

#### Option B: Deploy from Git
1. Push to GitHub: `git push origin v3`
2. Go to Vercel dashboard
3. Select deployment
4. Click "Promote to Production"

**Deployment checklist:**
- [ ] Deployment initiated
- [ ] Build completed successfully
- [ ] No deployment errors
- [ ] Production URL accessible

---

## ✅ Post-Deployment Verification

### 7. Production Testing

#### Step 7.1: Test Homepage
**URL:** `https://your-domain.vercel.app`

- [ ] Page loads successfully
- [ ] Quote displays (check if database has pairings)
- [ ] Background image loads
- [ ] Download button works
- [ ] Share button works
- [ ] No console errors

#### Step 7.2: Test OG Image
**URL:** `https://your-domain.vercel.app/api/og`

- [ ] OG image generates (should show PNG image)
- [ ] Quote text visible
- [ ] Image renders correctly

#### Step 7.3: Test Admin Login
**URL:** `https://your-domain.vercel.app/admin/login`

- [ ] Login page loads
- [ ] Enter password: `1kmF1YtJlIR1LtGM0gaFvcCkRupzHn7Df2PVgn5mJ+Q=`
- [ ] Redirects to dashboard
- [ ] Dashboard shows stats

#### Step 7.4: Test Admin CRUD (Production)
**Quotes:**
- [ ] Create test quote: "Test quote - please delete"
- [ ] Edit the test quote
- [ ] Delete the test quote

**Images:**
- [ ] Create test image (use Unsplash URL)
- [ ] Delete the test image

**Pairings:**
- [ ] Create test pairing for tomorrow's date
- [ ] Verify preview shows correctly
- [ ] Delete the test pairing

#### Step 7.5: Test Rate Limiting (Production)
- [ ] Log out
- [ ] Try 6 wrong passwords
- [ ] Verify blocked message appears
- [ ] Wait 15 minutes or redeploy to reset

#### Step 7.6: Monitor Vercel Logs
Navigate to: https://vercel.com/your-project/logs

**Check for errors:**
- [ ] No database connection errors
- [ ] No Prisma query errors
- [ ] No authentication errors
- [ ] No Unsplash API errors

---

### 8. Initial Content Setup

#### Step 8.1: Add Quotes
Create 30-50 demotivating quotes via admin panel.

**Example quotes:**
- "Your comfort zone is a beautiful place, but nothing ever grows there."
- "Every day you don't pursue your dreams, someone else is out there living theirs."
- "The clock is ticking. Are you?"
- "You're not stuck in traffic. You are traffic."
- "Monday again. Repeat until retirement."

- [ ] At least 30 quotes added
- [ ] Quotes are demotivating (ironic)
- [ ] Some multi-line quotes included

#### Step 8.2: Auto-Schedule Pairings
1. Go to: `https://your-domain.vercel.app/admin/pairings`
2. Click "🪄 Auto-Schedule"
3. Fill in: **30 days**
4. Submit
5. Verify success message shows statistics

- [ ] 30 pairings created
- [ ] Start date is today
- [ ] End date is 30 days from now
- [ ] No duplicate dates
- [ ] Preview cards show unique images

#### Step 8.3: Verify Homepage Content
1. Navigate to homepage
2. Should show today's pairing (if created)
3. Quote text readable
4. Background image looks good

- [ ] Homepage shows database content
- [ ] Not showing fallback hardcoded quotes

---

## 🔒 Security Verification

### 9. Security Audit

#### Step 9.1: Test Database User Permissions
In Neon SQL Editor, run as `daily_demotivations_app`:

```sql
-- Should succeed
SELECT * FROM "Quote" LIMIT 1;
INSERT INTO "Quote" (text, author, "createdAt", "updatedAt") 
  VALUES ('Test', 'Test', NOW(), NOW());
DELETE FROM "Quote" WHERE text = 'Test';

-- Should FAIL with permission denied
DROP TABLE "Quote";
ALTER TABLE "Quote" ADD COLUMN test TEXT;
TRUNCATE TABLE "Quote";
```

- [ ] SELECT works
- [ ] INSERT works
- [ ] UPDATE works
- [ ] DELETE works
- [ ] DROP fails (permission denied)
- [ ] ALTER fails (permission denied)
- [ ] TRUNCATE fails (permission denied)

#### Step 9.2: Verify Credentials Security
- [ ] `.env.local` not committed to Git (check `.gitignore`)
- [ ] Admin password is 32-byte base64 (not simple text)
- [ ] Session secret is 32-byte base64
- [ ] Database passwords are strong
- [ ] All credentials saved in password manager

#### Step 9.3: Test Security Features
- [ ] Rate limiting active (tested in Step 7.5)
- [ ] Timing-safe password comparison implemented
- [ ] Session expires after 24h inactivity
- [ ] Session extends on activity (sliding expiration)
- [ ] Admin routes protected (try accessing without login)

---

## 📊 Monitoring & Maintenance

### 10. Post-Launch Monitoring

#### First 24 Hours:
- [ ] Check Vercel logs every 2-4 hours
- [ ] Monitor error rate in Vercel Analytics
- [ ] Verify OG images generate correctly
- [ ] Check database query performance in Neon
- [ ] Test on mobile devices

#### First Week:
- [ ] Review Vercel Analytics for traffic patterns
- [ ] Check for any 500 errors
- [ ] Verify daily pairings display correctly
- [ ] Monitor Unsplash API rate limits (50 requests/hour free tier)
- [ ] Ensure session management working smoothly

#### Ongoing:
- [ ] Schedule pairings 1 week in advance (manual or auto-schedule)
- [ ] Add new quotes regularly
- [ ] Monitor database size (Neon free tier: 512 MB)
- [ ] Check Vercel build minutes (free tier: 100/month)

---

## 🐛 Troubleshooting Guide

### Issue: Homepage Shows Hardcoded Quotes
**Symptoms:** Homepage displays fallback quotes instead of database content

**Solutions:**
1. Check `USE_DATABASE=true` in Vercel environment variables
2. Verify at least one pairing exists for today's date
3. Check Vercel logs for database connection errors
4. Verify `DATABASE_URL` is correct in Vercel

### Issue: Admin Login Fails
**Symptoms:** "Invalid password" error with correct password

**Solutions:**
1. Verify `ADMIN_PASSWORD` set in Vercel environment variables
2. Check for whitespace in password (copy/paste carefully)
3. Ensure `SESSION_SECRET` is set
4. Check Vercel logs for session errors

### Issue: Rate Limit Blocks Legitimate User
**Symptoms:** Blocked after wrong password attempts

**Solutions:**
1. Wait 15 minutes for automatic reset
2. Redeploy to Vercel (resets in-memory rate limiter)
3. For permanent solution: implement Redis-based rate limiting

### Issue: Database Permission Errors
**Symptoms:** Errors like "permission denied for table" in Vercel logs

**Solutions:**
1. Verify restricted user created correctly
2. Check `DATABASE_URL` uses `daily_demotivations_app` user
3. Re-run permission grants from Step 1.2
4. Temporarily use owner user to diagnose (not recommended long-term)

### Issue: Unsplash Images Not Loading
**Symptoms:** Blank backgrounds or image errors

**Solutions:**
1. Verify `UNSPLASH_ACCESS_KEY` set in Vercel
2. Check Unsplash rate limits (50/hour free tier)
3. Verify Unsplash URLs are valid in database
4. Check Vercel logs for Unsplash API errors

### Issue: OG Image Generation Fails
**Symptoms:** Broken social share previews

**Solutions:**
1. Check `/api/og` endpoint directly in browser
2. Verify quote text doesn't have special characters
3. Check Vercel logs for OG generation errors
4. Ensure fonts are loading correctly

### Issue: Session Expires Too Quickly
**Symptoms:** Logged out unexpectedly during admin work

**Solutions:**
1. Verify sliding session implemented (should extend on activity)
2. Check `SESSION_SECRET` set in Vercel
3. Verify iron-session configuration in `src/lib/session.ts`
4. Check browser console for session errors

---

## 📞 Support Resources

**Documentation:**
- Project README: `README.md`
- Security Audit: `SECURITY_AUDIT.md`
- Implementation Guide: `SECURITY_IMPLEMENTATION.md`

**External Resources:**
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Unsplash API: https://unsplash.com/documentation

**Database Access:**
- Neon Console: https://console.neon.tech/
- Prisma Studio: `npm run db:studio` (local only)

**Monitoring:**
- Vercel Logs: https://vercel.com/your-project/logs
- Vercel Analytics: https://vercel.com/your-project/analytics
- Neon Metrics: Neon Console → Metrics tab

---

## ✅ Final Checklist

**Before marking deployment complete:**

- [ ] Database restricted user created and tested
- [ ] All environment variables set in Vercel
- [ ] Production deployment successful
- [ ] Homepage loads with database content
- [ ] Admin panel fully functional
- [ ] At least 30 quotes added
- [ ] 30 days of pairings scheduled
- [ ] Security features verified
- [ ] No critical errors in logs
- [ ] Social sharing works (OG images)
- [ ] Mobile testing completed
- [ ] All credentials saved in password manager
- [ ] Monitoring plan in place

**Deployment Date:** ______________  
**Production URL:** ______________  
**Deployed By:** ______________

---

## 🎉 Post-Deployment

**Congratulations!** Daily Demotivations v3 is now live in production.

**Next steps:**
1. Share the URL with friends/users
2. Monitor logs for first 24 hours
3. Schedule weekly pairing reviews
4. Consider future enhancements from README

**Remember:**
- Use `DIRECT_DATABASE_URL` for migrations only
- Regular backups in Neon console
- Monitor Unsplash rate limits
- Keep admin password secure

---

**Last Updated:** January 2025  
**Version:** 3.0  
**Status:** Ready for Production ✅
