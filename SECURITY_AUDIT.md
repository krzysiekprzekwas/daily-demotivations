# 🔒 Security Audit Report - Daily Demotivations

**Date:** February 3, 2025  
**Project:** Daily Demotivations CMS  
**Auditor:** AI Security Review  
**Status:** ⚠️ MOSTLY SECURE with CRITICAL DATABASE ISSUE

---

## 🎯 Executive Summary

### ✅ What's Secure
- ✅ Admin panel protected by authentication
- ✅ Database never exposed to client-side code
- ✅ Session encryption properly configured
- ✅ Secrets properly gitignored
- ✅ HTTPS enforced in production
- ✅ CSRF protection enabled
- ✅ All admin actions require authentication

### 🔴 CRITICAL Issues Found
1. **Database credentials have OWNER privileges** (highest risk)
2. **Weak default admin password** ("TEMP_PASSWORD_CHANGE_THIS")

### 🟡 Medium Issues Found
1. Password comparison is vulnerable to timing attacks
2. No rate limiting on login attempts
3. Session doesn't use sliding expiration

### 🟢 Low Issues Found
1. Unsplash API key exposed (public by design, acceptable)
2. No Content Security Policy headers

---

## 📊 Detailed Findings

### 🔴 CRITICAL #1: Database User Privileges Too High

**Risk Level:** CRITICAL  
**Impact:** If database credentials leak, attacker has full database control  

**Current State:**
```
Username: neondb_owner
Role: OWNER (full administrative privileges)
```

**What This Means:**
- Can DROP entire database
- Can ALTER schema
- Can create/delete users
- Can read/write ALL data
- No privilege isolation

**Recommended Fix:**
Create a restricted database user with ONLY necessary permissions:

```sql
-- Connect to Neon database as neondb_owner (via Neon console SQL editor)

-- 1. Create restricted application user
CREATE USER daily_demotivations_app WITH PASSWORD 'GENERATE_STRONG_PASSWORD_HERE';

-- 2. Grant connection to database
GRANT CONNECT ON DATABASE neondb TO daily_demotivations_app;

-- 3. Grant schema usage
GRANT USAGE ON SCHEMA public TO daily_demotivations_app;

-- 4. Grant table permissions (only what's needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO daily_demotivations_app;

-- 5. Grant sequence usage (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daily_demotivations_app;

-- 6. Make these grants automatic for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO daily_demotivations_app;
  
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO daily_demotivations_app;

-- 7. Verify permissions
\dp quotes
\dp images
\dp pairings
```

**Update .env.local and Vercel:**
```bash
# OLD (UNSAFE)
DATABASE_URL=postgresql://neondb_owner:***@...

# NEW (SAFE)
DATABASE_URL=postgresql://daily_demotivations_app:NEW_PASSWORD@...

# Keep DIRECT_DATABASE_URL for migrations (uses owner for schema changes)
DIRECT_DATABASE_URL=postgresql://neondb_owner:***@...
```

**Migration Strategy:**
- Keep `neondb_owner` for `DIRECT_DATABASE_URL` (migrations need schema changes)
- Use restricted user for `DATABASE_URL` (runtime app queries)
- Prisma will use DIRECT_URL for migrations, DATABASE_URL for queries

---

### 🔴 CRITICAL #2: Weak Default Admin Password

**Risk Level:** CRITICAL  
**Impact:** Easy to guess, not secure for production  

**Current State:**
```
ADMIN_PASSWORD=TEMP_PASSWORD_CHANGE_THIS
```

**Recommended Fix:**
```bash
# Generate strong password (20+ characters)
openssl rand -base64 32

# Update .env.local
ADMIN_PASSWORD=your_generated_strong_password_here

# NEVER commit this to git
# Add to Vercel environment variables for production
```

**Requirements:**
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Use password manager to store

---

### 🟡 MEDIUM #1: Timing Attack Vulnerability

**Risk Level:** MEDIUM  
**Impact:** Attacker could determine valid password length through timing analysis  

**Current Code (Vulnerable):**
```typescript
// app/admin/login/actions.ts
if (password !== adminPassword) {
  return { error: 'Invalid password' };
}
```

**Issue:**
Simple string comparison (`!==`) exits early when characters don't match.
Attacker can measure response time to guess password character-by-character.

**Recommended Fix:**
```typescript
import { timingSafeEqual } from 'crypto';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    return { error: 'Server configuration error' };
  }
  
  // Constant-time comparison to prevent timing attacks
  const passwordBuffer = Buffer.from(password);
  const adminPasswordBuffer = Buffer.from(adminPassword);
  
  // Ensure same length before comparison
  if (passwordBuffer.length !== adminPasswordBuffer.length) {
    return { error: 'Invalid password' };
  }
  
  const isValid = timingSafeEqual(passwordBuffer, adminPasswordBuffer);
  
  if (!isValid) {
    return { error: 'Invalid password' };
  }
  
  // ... rest of login logic
}
```

---

### 🟡 MEDIUM #2: No Rate Limiting on Login

**Risk Level:** MEDIUM  
**Impact:** Brute force attacks possible  

**Current State:**
No rate limiting on `/admin/login` - attacker can try unlimited passwords.

**Recommended Fix:**

**Option A: Vercel Rate Limiting (Easiest)**
Use Vercel's built-in rate limiting (requires Pro plan):
https://vercel.com/docs/security/vercel-firewall/rate-limiting

**Option B: Upstash Redis (Free tier available)**
```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  prefix: 'ratelimit:login',
});

// Usage in login action:
export async function loginAction(formData: FormData) {
  const ip = headers().get('x-forwarded-for') || 'unknown';
  const { success } = await loginRateLimit.limit(ip);
  
  if (!success) {
    return { error: 'Too many login attempts. Please try again in 15 minutes.' };
  }
  
  // ... rest of login logic
}
```

**Option C: Simple In-Memory Rate Limit (No dependencies)**
Good for single-server deployments:

```typescript
// src/lib/rate-limit-simple.ts
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true; // Allow
  }
  
  if (record.count >= 5) {
    return false; // Block
  }
  
  record.count++;
  return true; // Allow
}
```

---

### 🟡 MEDIUM #3: Session Doesn't Use Sliding Expiration

**Risk Level:** LOW-MEDIUM  
**Impact:** User gets logged out even if actively using the app  

**Current State:**
Session expires exactly 24 hours after login, regardless of activity.

**Recommended Fix:**
Update session on each admin page request:

```typescript
// src/lib/session.ts
export async function refreshSession() {
  const session = await getSession();
  
  if (session.isLoggedIn) {
    // Update login time to "slide" the expiration
    session.loginTime = Date.now();
    await session.save();
  }
  
  return session;
}

// Use in middleware.ts:
export async function middleware(request: NextRequest) {
  // ... existing code ...
  
  if (isLoggedIn && !isExpired) {
    // Refresh session on each request (sliding expiration)
    await session.save(); // This updates the cookie maxAge
    return response;
  }
  
  // ... existing code ...
}
```

---

### 🟢 LOW #1: Unsplash API Key Exposed in .env.local

**Risk Level:** LOW (Acceptable)  
**Impact:** Public API key, designed to be exposed  

**Current State:**
```
UNSPLASH_ACCESS_KEY=w4bQCgiDZjq2GX7F4WvEikP9JBdcAzoGNT6lSlgx-qk
```

**Analysis:**
✅ This is ACCEPTABLE because:
- Unsplash Access Keys are designed to be public
- They're rate-limited per key, not per app
- Worst case: Someone uses your quota (5000 requests/hour)
- No sensitive data exposed

**Recommendation:**
Keep as-is, but monitor usage in Unsplash dashboard:
https://unsplash.com/oauth/applications

If abuse occurs, rotate the key.

---

### 🟢 LOW #2: No Content Security Policy

**Risk Level:** LOW  
**Impact:** XSS attacks slightly easier  

**Recommended Fix:**
Add security headers in `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

---

## ✅ What's Already Secure

### 1. Admin Panel Authentication ✅

**Protection Layers:**
1. **Middleware** (`middleware.ts`):
   - Blocks all `/admin/*` routes
   - Redirects to login if not authenticated
   - Checks session expiry (24 hours)

2. **Server Action Guards**:
   - Every mutation requires `await requireAuth()`
   - Prevents direct API calls
   - No client-side bypass possible

3. **Session Security**:
   - `httpOnly: true` - JavaScript can't access cookie
   - `secure: true` in production - HTTPS only
   - `sameSite: 'lax'` - CSRF protection
   - Encrypted with SESSION_SECRET

**Verified Safe:**
```typescript
// All these check authentication:
app/admin/dashboard/page.tsx:  await requireAuth(); ✅
app/admin/quotes/page.tsx:     await requireAuth(); ✅
app/admin/images/page.tsx:     await requireAuth(); ✅
app/admin/pairings/page.tsx:   await requireAuth(); ✅

// All Server Actions check auth:
createQuote():    await requireAuth(); ✅
updateQuote():    await requireAuth(); ✅
deleteQuote():    await requireAuth(); ✅
createImage():    await requireAuth(); ✅
createPairing():  await requireAuth(); ✅
autoSchedule():   await requireAuth(); ✅
```

### 2. Database Never Exposed to Client ✅

**Verification:**
- ✅ No Prisma imports in client components
- ✅ No Prisma imports in `app/page.tsx` (public page)
- ✅ No Prisma imports in `src/components/*` (client components)
- ✅ All database queries in Server Components or Server Actions
- ✅ Public API routes don't use Prisma directly

**Architecture:**
```
Client Browser
    ↓
Server Component (app/page.tsx)
    ↓
Query Function (src/lib/quotes-db.ts)
    ↓
Prisma Client (src/lib/prisma.ts)
    ↓
Neon PostgreSQL

✅ No direct path from client to database
```

### 3. Environment Variables Protected ✅

**Verified:**
```bash
# .gitignore contains:
.env*.local ✅
.env ✅

# Secrets only used server-side:
DATABASE_URL        - ✅ Server only (Prisma)
SESSION_SECRET      - ✅ Server only (iron-session)
ADMIN_PASSWORD      - ✅ Server only (login action)
UNSPLASH_ACCESS_KEY - ✅ Server only (API calls)

# Public variables properly prefixed:
NEXT_PUBLIC_BASE_URL - ✅ Safe to expose (just URL)
```

### 4. No SQL Injection Risk ✅

**Why:**
Prisma uses parameterized queries automatically:

```typescript
// This is SAFE (Prisma escapes input):
await prisma.quote.create({
  data: {
    text: userInput, // ✅ Automatically escaped
  }
});

// Prisma NEVER uses raw SQL without explicit .raw()
// We don't use prisma.$queryRaw() anywhere ✅
```

### 5. HTTPS Enforced in Production ✅

```typescript
// src/lib/session.ts
cookieOptions: {
  secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
}
```

### 6. CSRF Protection Enabled ✅

```typescript
// src/lib/session.ts
cookieOptions: {
  sameSite: 'lax', // ✅ Prevents CSRF attacks
}
```

---

## 📋 Security Checklist for Production

### Before Deploying:

- [ ] **CRITICAL:** Create restricted database user
- [ ] **CRITICAL:** Change ADMIN_PASSWORD to strong password (20+ chars)
- [ ] **HIGH:** Implement timing-safe password comparison
- [ ] **HIGH:** Add rate limiting to login endpoint
- [ ] **MEDIUM:** Enable sliding session expiration
- [ ] **LOW:** Add security headers (CSP, X-Frame-Options)
- [ ] Verify all env vars set in Vercel dashboard
- [ ] Test login with new credentials
- [ ] Test database connection with restricted user
- [ ] Enable Vercel deployment protection (if available)
- [ ] Set up monitoring/alerts for failed login attempts

### Post-Deployment:

- [ ] Monitor Unsplash API usage
- [ ] Monitor database connection pool usage
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Regular security audits (quarterly)
- [ ] Keep dependencies updated (`npm audit`)

---

## 🎯 Priority Action Items

### Do IMMEDIATELY (Before Production):

1. **Create restricted database user** (30 minutes)
   - Prevents database compromise if credentials leak
   - Follow SQL commands in CRITICAL #1 section

2. **Change admin password** (5 minutes)
   - Generate: `openssl rand -base64 32`
   - Update .env.local and Vercel

### Do SOON (Within 1 week):

3. **Add timing-safe password comparison** (15 minutes)
   - Prevents timing attacks
   - Use crypto.timingSafeEqual

4. **Implement rate limiting** (30-60 minutes)
   - Choose Option A (Vercel), B (Upstash), or C (Simple)
   - Prevents brute force attacks

### Do LATER (Nice to have):

5. **Add sliding session expiration** (20 minutes)
6. **Add security headers** (15 minutes)
7. **Set up monitoring** (varies)

---

## 📊 Final Score

**Overall Security Rating:** 7/10

**Breakdown:**
- Authentication: 8/10 ✅
- Authorization: 9/10 ✅
- Database Security: 4/10 🔴 (CRITICAL issue)
- Session Management: 7/10 🟡
- Input Validation: 9/10 ✅
- Secrets Management: 8/10 🟡
- Network Security: 8/10 ✅

**After Fixes:** Would be 9/10 ✅

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/deployment/deployment-guides/security)
- [Neon Security](https://neon.tech/docs/introduction/security)
- [iron-session Security](https://github.com/vvo/iron-session#security)

---

**Generated:** February 3, 2025  
**Next Review:** After implementing fixes
