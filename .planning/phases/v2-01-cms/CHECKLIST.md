# Phase 1: CMS - Execution Checklist

**Phase:** V2 Phase 1 - Content Management System  
**Status:** Not Started  
**Start Date:** ___________  
**Target Completion:** ___________  

Use this checklist to track progress through all 5 execution plans.

---

## Pre-Execution

### Documentation Review
- [ ] Read INDEX.md (navigation guide)
- [ ] Read 00-SUMMARY.md (big picture)
- [ ] Skim RESEARCH.md (understand architecture)
- [ ] Review DECISIONS.md (understand choices)

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] Vercel account created
- [ ] Access to Vercel Dashboard
- [ ] Git repository ready
- [ ] Code editor configured

---

## Plan 01: Database Setup & Schema
**Estimated Time:** 2.5 hours  
**Started:** ___________  
**Completed:** ___________

### Infrastructure
- [ ] Vercel Postgres database provisioned
- [ ] DATABASE_URL added to .env.local
- [ ] DIRECT_DATABASE_URL added to .env.local
- [ ] Environment variables added to Vercel production

### Dependencies
- [ ] `@vercel/postgres` installed
- [ ] `@prisma/client` installed
- [ ] `prisma` dev dependency installed
- [ ] `tsx` dev dependency installed

### Schema & Migrations
- [ ] `prisma/schema.prisma` created
- [ ] Schema validates: `npx prisma validate`
- [ ] Initial migration created: `npx prisma migrate dev --name init`
- [ ] Prisma Client generated: `npx prisma generate`

### Prisma Client
- [ ] `src/lib/prisma.ts` created (singleton pattern)
- [ ] `testConnection()` helper works
- [ ] TypeScript types available for models

### Seeding
- [ ] `prisma/seed.ts` created
- [ ] `package.json` updated with seed script
- [ ] Seed script executed: `npm run db:seed`
- [ ] 30 quotes in database (verified in Prisma Studio)

### Testing
- [ ] Database connection verified (local)
- [ ] Database connection verified (Vercel)
- [ ] Indexes created (checked with `\d quotes`)
- [ ] Foreign keys working (pairings table)
- [ ] Simple query works: `prisma.quote.findMany()`

### Documentation
- [ ] `.env.example` created
- [ ] README updated (if needed)
- [ ] Migration files committed to git

**Plan 01 Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Plan 02: Authentication & Session Management
**Estimated Time:** 3 hours  
**Started:** ___________  
**Completed:** ___________

### Dependencies
- [ ] `iron-session` installed
- [ ] `SESSION_SECRET` generated (32+ chars)
- [ ] `ADMIN_PASSWORD` chosen (12+ chars)
- [ ] Environment variables added (local + Vercel)

### Session Configuration
- [ ] `src/lib/session.ts` created
- [ ] `SessionData` interface defined
- [ ] `sessionOptions` configured (24h TTL)
- [ ] `getSession()` helper created
- [ ] `isAuthenticated()` helper created

### Login Page
- [ ] `app/admin/login/page.tsx` created
- [ ] `app/admin/login/LoginForm.tsx` created (client component)
- [ ] `app/admin/login/actions.ts` created
- [ ] `loginAction()` Server Action works
- [ ] `logoutAction()` Server Action works

### Middleware
- [ ] `middleware.ts` created at root
- [ ] Routes `/admin/*` protected (except `/admin/login`)
- [ ] Session validation logic working
- [ ] 24-hour expiry enforced
- [ ] Redirects to login with `?from=` parameter

### Admin Layout
- [ ] `app/admin/layout.tsx` created
- [ ] Navigation menu (Dashboard, Quotes, Images, Pairings)
- [ ] Logout button works
- [ ] Auth check in layout

### Testing
- [ ] Login with wrong password → error shown
- [ ] Login with correct password → redirects to `/admin`
- [ ] Session persists across page loads
- [ ] Session expires after 24 hours
- [ ] Logout destroys session
- [ ] Unauthenticated user redirected from `/admin/*`
- [ ] Cookie security settings correct (httpOnly, sameSite, secure)

**Plan 02 Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Plan 03: Admin CRUD - Quotes & Images
**Estimated Time:** 7.5 hours  
**Started:** ___________  
**Completed:** ___________

### Quotes Management
- [ ] `app/admin/quotes/page.tsx` - List view with pagination
- [ ] `app/admin/quotes/new/page.tsx` - Create form
- [ ] `app/admin/quotes/new/actions.ts` - Create action
- [ ] `app/admin/quotes/[id]/page.tsx` - Edit form
- [ ] `app/admin/quotes/[id]/EditQuoteForm.tsx` - Client component
- [ ] `app/admin/quotes/[id]/actions.ts` - Update/delete actions

### Images Management
- [ ] `app/admin/images/page.tsx` - Grid view
- [ ] `app/admin/images/new/page.tsx` - Create form with Unsplash hints
- [ ] `app/admin/images/new/actions.ts` - Create action
- [ ] `app/admin/images/[id]/page.tsx` - Edit form
- [ ] `app/admin/images/[id]/actions.ts` - Update/delete actions

### Validation
- [ ] `src/lib/validation.ts` created (if needed for helpers)
- [ ] Duplicate quote detection (case-insensitive)
- [ ] Required field validation
- [ ] Character limit validation (500 chars)
- [ ] URL format validation (basic)

### Testing - Quotes
- [ ] Navigate to `/admin/quotes` → list displays
- [ ] Create new quote → success
- [ ] Create duplicate quote → blocked with error
- [ ] Edit quote → updates successfully
- [ ] Edit to duplicate text → blocked
- [ ] Delete quote → success
- [ ] Pagination works (if > 20 quotes)
- [ ] Cascade delete warning shows pairing count

### Testing - Images
- [ ] Navigate to `/admin/images` → grid displays
- [ ] Create new image → success
- [ ] Image thumbnail displays correctly
- [ ] Edit image → updates successfully
- [ ] Delete image → success
- [ ] Unsplash hints visible on create form

### Testing - Validation
- [ ] Quote > 500 chars → error
- [ ] Empty required fields → error
- [ ] Form values retained on error
- [ ] Success messages display

**Plan 03 Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Plan 04: Pairing System & 5-Day Validation
**Estimated Time:** 9 hours  
**Started:** ___________  
**Completed:** ___________

### 5-Day Validation Logic
- [ ] `src/lib/validation.ts` updated with `validate5DayRule()`
- [ ] `isDateAvailable()` helper created
- [ ] Date range query (±5 days) working
- [ ] Conflict detection logic correct

### Dashboard
- [ ] `app/admin/page.tsx` created
- [ ] Stats cards (quotes, images, pairings count)
- [ ] Upcoming pairings list (next 7 days)
- [ ] Quick action links

### Pairings List
- [ ] `app/admin/pairings/page.tsx` created
- [ ] Filter tabs (upcoming, past, all)
- [ ] List view with quote + image + date
- [ ] Pagination (if needed)

### Create Pairing
- [ ] `app/admin/pairings/new/page.tsx` - Server Component wrapper
- [ ] `app/admin/pairings/new/PairingForm.tsx` - Client Component form
- [ ] `app/admin/pairings/new/actions.ts` - Create action
- [ ] Date picker (native input[type="date"])
- [ ] Quote dropdown populated
- [ ] Image dropdown populated with preview

### Edit/Delete Pairing
- [ ] `app/admin/pairings/[id]/page.tsx` created
- [ ] `app/admin/pairings/[id]/actions.ts` - Update/delete actions
- [ ] Edit form with validation
- [ ] Delete confirmation

### Testing - 5-Day Rule
- [ ] Create pairing Feb 1 with Quote A
- [ ] Try Feb 3 with Quote A → blocked (2 days apart)
- [ ] Try Feb 7 with Quote A → allowed (6 days apart)
- [ ] Error message shows conflict date
- [ ] Edit pairing → revalidates rule

### Testing - Pairings
- [ ] Create pairing → success
- [ ] Create duplicate date → blocked
- [ ] Edit pairing date → success
- [ ] Edit pairing quote → success
- [ ] Delete pairing → success
- [ ] Dashboard shows upcoming pairings
- [ ] Filter tabs work (upcoming/past/all)

### Testing - Edge Cases
- [ ] Pairing on Jan 1 → validates against Dec 27 prev year
- [ ] Pairing on Feb 29 (leap year) → works
- [ ] Month boundary calculations correct
- [ ] Timezone handling correct (UTC dates)

**Plan 04 Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Plan 05: Frontend Integration & Deployment
**Estimated Time:** 8 hours  
**Started:** ___________  
**Completed:** ___________

### Data Service Layer
- [ ] `src/lib/quotes-service.ts` created
- [ ] `getTodaysQuote()` implemented (database-first)
- [ ] `getQuoteForDate()` implemented
- [ ] Graceful fallback to QUOTES array
- [ ] 5-second timeout implemented

- [ ] `src/lib/images-service.ts` created
- [ ] `getTodaysImage()` implemented
- [ ] `getImageForDate()` implemented
- [ ] Fallback to Unsplash random
- [ ] 5-second timeout implemented

### Frontend Integration
- [ ] `app/page.tsx` updated to use `quotes-service`
- [ ] `app/page.tsx` updated to use `images-service`
- [ ] Download tracking only for Unsplash images
- [ ] ISR configuration maintained (24h revalidate)
- [ ] Metadata generation updated

### OG Image Route
- [ ] `app/api/og/route.tsx` updated for async quote
- [ ] OG image generation works with database quotes

### Feature Flag
- [ ] `USE_DATABASE` environment variable support
- [ ] Flag toggles between database and hardcoded
- [ ] Emergency disable works

### Health Check
- [ ] `app/api/health/route.ts` created
- [ ] Database connectivity test
- [ ] Quote/image/pairing counts
- [ ] Error handling for database down
- [ ] Endpoint returns JSON status

### Testing - Database Mode
- [ ] Create pairing for today → homepage shows paired content
- [ ] No pairing for date → shows deterministic database quote
- [ ] Database empty (test) → falls back to QUOTES array
- [ ] Image pairing works
- [ ] No image pairing → Unsplash fallback

### Testing - Fallback Mode
- [ ] `USE_DATABASE=false` → uses hardcoded quotes
- [ ] Database timeout → fast fallback
- [ ] Database connection error → graceful fallback
- [ ] Site responsive during database issues
- [ ] Error logging captures failures

### Testing - Performance
- [ ] Homepage load < 500ms (database mode)
- [ ] Homepage load < 200ms (fallback mode)
- [ ] Database timeout failover < 5s
- [ ] ISR caching works
- [ ] No N+1 queries

### Testing - End-to-End
- [ ] Create quote → Create image → Create pairing
- [ ] Homepage displays paired content (after cache expire)
- [ ] Edit pairing → homepage updates (after cache)
- [ ] Delete pairing → reverts to deterministic
- [ ] Admin workflow smooth start to finish

### Deployment
- [ ] Production deployment successful
- [ ] Health check responds: `/api/health`
- [ ] Admin login works
- [ ] Homepage displays correctly
- [ ] Vercel Analytics enabled
- [ ] Error monitoring enabled

### Documentation
- [ ] README.md updated with CMS instructions
- [ ] `.planning/ADMIN_GUIDE.md` created
- [ ] Environment variables documented
- [ ] Rollback procedures documented
- [ ] Known limitations documented

**Plan 05 Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Post-Completion

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] Prisma queries optimized
- [ ] Console errors removed (except intentional logging)
- [ ] Code reviewed and cleaned

### Testing
- [ ] All testing checklists complete
- [ ] Edge cases handled
- [ ] Fallback scenarios verified
- [ ] Performance acceptable

### Documentation
- [ ] README updated
- [ ] Admin guide complete
- [ ] Environment variables reference
- [ ] Rollback procedures documented

### Deployment Verification
- [ ] Production site loads
- [ ] Admin CMS accessible
- [ ] Database queries working
- [ ] Fallbacks tested (toggle USE_DATABASE)
- [ ] Monitoring enabled

### Final Steps
- [ ] Git commit with message: "feat: Complete Phase 1 - CMS"
- [ ] Git tag: `v2.0.0-cms`
- [ ] Create production backup (database)
- [ ] Document any deviations from plans
- [ ] Update project board: Phase 1 → Done

---

## Phase 1 Completion Criteria

✅ **Phase 1 is complete when ALL of these are true:**

### Functional
- [ ] All 18 requirements implemented
- [ ] Admin can manage quotes via CMS
- [ ] Admin can manage images via CMS
- [ ] Admin can create pairings via CMS
- [ ] 5-day rule enforced
- [ ] Homepage displays database content
- [ ] Graceful fallbacks working

### Technical
- [ ] Database queries optimized
- [ ] Authentication secure
- [ ] Session management working
- [ ] Zero breaking changes to public site
- [ ] ISR caching functional

### Performance
- [ ] Homepage < 500ms (database)
- [ ] Homepage < 200ms (fallback)
- [ ] Admin operations < 200ms
- [ ] Database timeouts handled

### Security
- [ ] Admin routes protected
- [ ] Passwords stored securely
- [ ] Session cookies encrypted
- [ ] CSRF protection enabled

### Documentation
- [ ] All plans executed
- [ ] README updated
- [ ] Admin guide written
- [ ] Rollback documented

### Deployment
- [ ] Production deployed
- [ ] Health check working
- [ ] Monitoring enabled
- [ ] No critical errors

---

## Time Tracking

| Plan | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| Plan 01 | 2.5h | _____ | |
| Plan 02 | 3h | _____ | |
| Plan 03 | 7.5h | _____ | |
| Plan 04 | 9h | _____ | |
| Plan 05 | 8h | _____ | |
| **Total** | **30h** | **_____** | |

---

## Notes & Deviations

Use this section to document:
- Any changes from the plans
- Unexpected issues encountered
- Solutions to problems
- Improvements made

```
Date: _____________
Note:




```

---

## Emergency Contacts

**If you get stuck:**
1. Review relevant plan section
2. Check RESEARCH.md for details
3. Review DECISIONS.md for rationale
4. Check external documentation links

**Rollback Options:**
1. Feature flag: `USE_DATABASE=false` (fastest)
2. Git revert: `git revert HEAD`
3. Previous deployment: `vercel rollback`

---

**Phase 1 Ready for Execution** ✅  
**Start Date:** ___________  
**Target Completion:** ___________  

Let's build this! 🚀
