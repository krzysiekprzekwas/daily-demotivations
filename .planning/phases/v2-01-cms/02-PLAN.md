# Execution Plan 02: Authentication & Session Management

**Phase:** V2 Phase 1 - Content Management System  
**Plan:** 02 of 05  
**Status:** Ready for Execution  
**Date:** 2025-02-03

---

## 1. Goal

Implement secure cookie-based authentication using iron-session with a 24-hour session duration. Create login page, middleware for route protection, and session management utilities. Enable single admin access to CMS without requiring complex user management.

---

## 2. Requirements Covered

- **AUTH-01:** Password-based admin authentication
- **AUTH-02:** Protected `/admin/*` routes
- **CMS-05:** Simple password auth (environment variable)

---

## 3. Dependencies

**Prerequisites:**
- ✅ Plan 01 completed (database setup, environment variables)
- ✅ `ADMIN_PASSWORD` set in environment variables
- ✅ `SESSION_SECRET` generated (32+ characters)

**External Dependencies:**
- `iron-session` package (cookie encryption)
- Next.js 15+ middleware support

---

## 4. Estimated Time

- **Setup:** 15 minutes (install dependencies)
- **Session Config:** 30 minutes (create session helpers, types)
- **Login Page:** 45 minutes (UI + Server Action)
- **Middleware:** 45 minutes (route protection logic)
- **Logout:** 15 minutes (logout action)
- **Testing:** 45 minutes (auth flows, edge cases)
- **Total:** 3 hours

---

## 5. Deliverables

### 5.1 Authentication Infrastructure
- [ ] `src/lib/session.ts` - Session configuration and helpers
- [ ] `middleware.ts` - Route protection middleware
- [ ] Session types defined

### 5.2 Login Flow
- [ ] `app/admin/login/page.tsx` - Login page UI
- [ ] `app/admin/login/actions.ts` - Login/logout Server Actions
- [ ] Error handling for invalid passwords

### 5.3 Session Management
- [ ] `getSession()` - Get current session
- [ ] `isAuthenticated()` - Check if user logged in
- [ ] `requireAuth()` - Enforce authentication (throw if not logged in)
- [ ] 24-hour session TTL enforcement

### 5.4 Security Features
- [ ] Secure cookies (httpOnly, sameSite, secure in production)
- [ ] CSRF protection (built-in via Server Actions)
- [ ] Session expiry validation
- [ ] Redirect to login for unauthenticated requests

---

## 6. Technical Approach

### 6.1 Install Dependencies

```bash
npm install iron-session
```

**Why iron-session?**
- ✅ Simple cookie-based sessions (no database needed)
- ✅ Encrypted cookies via `seal` algorithm
- ✅ TypeScript-first with full type safety
- ✅ Works perfectly with Vercel serverless
- ✅ No external dependencies (NextAuth.js overkill)

### 6.2 Session Configuration

**File: `src/lib/session.ts`**

```typescript
import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

/**
 * Session data stored in encrypted cookie
 */
export interface SessionData {
  isLoggedIn: boolean;
  loginTime?: number; // Timestamp for session expiry validation
}

/**
 * Default session data for new sessions
 */
export const defaultSession: SessionData = {
  isLoggedIn: false,
};

/**
 * iron-session configuration
 * Cookie encrypted with SESSION_SECRET
 */
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'admin-session',
  cookieOptions: {
    // Security settings
    httpOnly: true, // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax', // CSRF protection
    
    // Session duration: 24 hours (86400 seconds)
    maxAge: 60 * 60 * 24,
    
    // Path
    path: '/',
  },
};

/**
 * Get session from cookies
 * Use in Server Components and Server Actions
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Check if user is authenticated
 * Validates both login flag and session expiry
 * 
 * @returns true if logged in and session not expired
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  
  // Check login flag
  if (!session.isLoggedIn || !session.loginTime) {
    return false;
  }
  
  // Check if session expired (24 hours = 86400000 ms)
  const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
  const isExpired = Date.now() - session.loginTime > SESSION_DURATION_MS;
  
  if (isExpired) {
    // Destroy expired session
    session.destroy();
    return false;
  }
  
  return true;
}

/**
 * Require authentication - throw error if not logged in
 * Use in Server Components that need auth
 * 
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<void> {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    throw new Error('Unauthorized - authentication required');
  }
}

/**
 * Get session data with authentication check
 * Returns null if not authenticated
 */
export async function getAuthenticatedSession(): Promise<SessionData | null> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return null;
  
  const session = await getSession();
  return session;
}
```

**Key Design Decisions:**

1. **24-Hour Session Duration**
   - Per user decision: has password manager, can re-login easily
   - Balances convenience and security
   - Configured via `maxAge` in cookie options

2. **Session Expiry Validation**
   - Store `loginTime` timestamp in session
   - Check on each request if 24 hours elapsed
   - Auto-destroy expired sessions

3. **Secure Cookie Settings**
   - `httpOnly: true` - Prevents XSS attacks
   - `secure: true` - HTTPS only in production
   - `sameSite: 'lax'` - CSRF protection
   - `path: '/'` - Cookie available for all `/admin/*` routes

### 6.3 Login Page

**File: `app/admin/login/page.tsx`**

```typescript
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/session';
import { LoginForm } from './LoginForm';

/**
 * Login page
 * Redirects to /admin if already logged in
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string };
}) {
  // Check if already logged in
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    // Redirect to intended destination or dashboard
    const from = searchParams.from || '/admin';
    redirect(from);
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          Admin Login
        </h1>
        <p className="text-gray-600 mb-6">
          Daily Demotivations CMS
        </p>
        
        {searchParams.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}
        
        <LoginForm from={searchParams.from} />
      </div>
    </div>
  );
}
```

**File: `app/admin/login/LoginForm.tsx`**

```typescript
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from './actions';

/**
 * Login form with client-side error display
 * Uses Server Action for authentication
 */
export function LoginForm({ from }: { from?: string }) {
  const [state, formAction] = useFormState(loginAction, null);
  
  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden field for redirect destination */}
      {from && <input type="hidden" name="from" value={from} />}
      
      {/* Error message */}
      {state?.error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {state.error}
        </div>
      )}
      
      {/* Password field */}
      <div>
        <label 
          htmlFor="password" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter admin password"
        />
      </div>
      
      {/* Submit button */}
      <SubmitButton />
    </form>
  );
}

/**
 * Submit button with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Logging in...' : 'Log In'}
    </button>
  );
}
```

### 6.4 Login Server Action

**File: `app/admin/login/actions.ts`**

```typescript
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Login action - validates password and creates session
 * 
 * @param prevState - Previous form state (for useFormState)
 * @param formData - Form data containing password
 * @returns Error state or redirects on success
 */
export async function loginAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const password = formData.get('password') as string;
  const from = formData.get('from') as string | null;
  
  // Validation
  if (!password || password.trim().length === 0) {
    return { error: 'Password is required' };
  }
  
  // Check password against environment variable
  if (password !== process.env.ADMIN_PASSWORD) {
    // Generic error message (don't reveal if password exists)
    return { error: 'Invalid password' };
  }
  
  // Create session
  const session = await getSession();
  session.isLoggedIn = true;
  session.loginTime = Date.now();
  await session.save();
  
  // Redirect to intended destination or dashboard
  const destination = from || '/admin';
  redirect(destination);
}

/**
 * Logout action - destroys session
 */
export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect('/admin/login');
}
```

**Security Notes:**
- Password stored in `ADMIN_PASSWORD` environment variable
- No password hashing needed (not stored in database)
- Generic error message prevents user enumeration
- No rate limiting initially (can add in future if abuse detected)

### 6.5 Route Protection Middleware

**File: `middleware.ts`**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

/**
 * Middleware to protect /admin/* routes
 * Redirects to login if not authenticated
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow login page (prevent redirect loop)
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }
  
  // Protect all /admin/* routes
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions
    );
    
    // Check if authenticated
    if (!session.isLoggedIn || !session.loginTime) {
      // Redirect to login with "from" parameter
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if session expired (24 hours)
    const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - session.loginTime > SESSION_DURATION_MS;
    
    if (isExpired) {
      // Destroy session and redirect
      session.destroy();
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      loginUrl.searchParams.set('error', 'Session expired. Please log in again.');
      return NextResponse.redirect(loginUrl);
    }
    
    // Authenticated and session valid
    return response;
  }
  
  // Allow all other routes
  return NextResponse.next();
}

/**
 * Configure which routes middleware runs on
 */
export const config = {
  matcher: '/admin/:path*',
};
```

**How Middleware Works:**

1. Runs on **every** request to `/admin/*` routes
2. Reads encrypted session cookie
3. Validates authentication status
4. Checks session expiry (24 hours)
5. Redirects to login if invalid
6. Preserves intended destination in `?from=` parameter

### 6.6 Logout in Layout

**File: `app/admin/layout.tsx`**

```typescript
import { isAuthenticated } from '@/lib/session';
import { redirect } from 'next/navigation';
import { logoutAction } from './login/actions';

/**
 * Admin layout wrapper
 * Adds navigation and logout button
 * Ensures authentication before rendering children
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check authentication (middleware should catch this)
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with navigation */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Daily Demotivations Admin
          </h1>
          
          <nav className="flex gap-4 items-center">
            <a 
              href="/admin" 
              className="text-gray-700 hover:text-gray-900 hover:underline"
            >
              Dashboard
            </a>
            <a 
              href="/admin/quotes" 
              className="text-gray-700 hover:text-gray-900 hover:underline"
            >
              Quotes
            </a>
            <a 
              href="/admin/images" 
              className="text-gray-700 hover:text-gray-900 hover:underline"
            >
              Images
            </a>
            <a 
              href="/admin/pairings" 
              className="text-gray-700 hover:text-gray-900 hover:underline"
            >
              Pairings
            </a>
            
            {/* Logout form */}
            <form action={logoutAction} className="inline">
              <button 
                type="submit"
                className="text-red-600 hover:text-red-800 hover:underline font-medium"
              >
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

---

## 7. Testing Checklist

### 7.1 Login Flow
- [ ] Navigate to `/admin` → redirects to `/admin/login`
- [ ] Empty password → shows "Password is required"
- [ ] Wrong password → shows "Invalid password"
- [ ] Correct password → redirects to `/admin`
- [ ] Login with `?from=/admin/quotes` → redirects to `/admin/quotes`

### 7.2 Session Persistence
- [ ] Login → close browser → reopen → still logged in
- [ ] Session cookie visible in DevTools (encrypted value)
- [ ] Cookie attributes correct:
  - `httpOnly: true`
  - `secure: true` (production only)
  - `sameSite: Lax`
  - `maxAge: 86400` (24 hours)

### 7.3 Session Expiry
- [ ] Login → wait 24 hours (or mock time) → auto-logout
- [ ] Expired session → redirects to login with "Session expired" message
- [ ] Manual session timestamp modification → blocks access

### 7.4 Route Protection
- [ ] Unauthenticated user visits `/admin` → redirected
- [ ] Unauthenticated user visits `/admin/quotes` → redirected
- [ ] Authenticated user visits `/admin/*` → allowed
- [ ] Logout → all `/admin/*` routes blocked

### 7.5 Logout
- [ ] Click "Logout" → redirects to `/admin/login`
- [ ] Session cookie deleted
- [ ] Visit `/admin` → redirected to login again

### 7.6 Edge Cases
- [ ] Direct visit to `/admin/login` when logged in → redirects to `/admin`
- [ ] Cookie tampering → session invalid, redirected
- [ ] Missing `SESSION_SECRET` → error (fail fast)
- [ ] Missing `ADMIN_PASSWORD` → error (fail fast)

### 7.7 Security
- [ ] Cookie not accessible via `document.cookie` (httpOnly)
- [ ] Cookie only sent over HTTPS in production (secure)
- [ ] CSRF token present in Server Actions (automatic)
- [ ] Password not logged anywhere

---

## 8. Risks

### 8.1 Brute Force Attacks

**Risk:** Attacker tries many passwords  
**Likelihood:** Medium  
**Impact:** Medium (admin access compromised)  

**Mitigation:**
- Use strong password (12+ characters, user has password manager)
- Add rate limiting in future if abuse detected
- Monitor login attempts via server logs
- **Phase 1 Decision:** Skip rate limiting (YAGNI principle)

**Future Enhancement:**
```typescript
// Add simple rate limiting with Vercel KV
import { kv } from '@vercel/kv';

const MAX_ATTEMPTS = 5;
const lockoutKey = 'login-attempts';

const attempts = await kv.incr(lockoutKey);
if (attempts > MAX_ATTEMPTS) {
  return { error: 'Too many attempts. Try again in 1 hour.' };
}
```

### 8.2 Session Hijacking

**Risk:** Attacker steals session cookie  
**Likelihood:** Low  
**Impact:** High (admin access)  

**Mitigation:**
- `httpOnly` prevents XSS-based theft
- `sameSite: lax` prevents CSRF
- `secure: true` in production (HTTPS only)
- 24-hour expiry limits exposure window

### 8.3 Middleware Performance

**Risk:** Middleware adds latency to admin requests  
**Likelihood:** Low  
**Impact:** Low (admin UX slightly slower)  

**Mitigation:**
- Middleware runs on Edge Runtime (fast)
- Session decryption is quick (~5ms)
- Only affects `/admin/*` routes (not public site)

### 8.4 Lost Password

**Risk:** Admin forgets password and gets locked out  
**Likelihood:** Low  
**Impact:** Medium (need to update env var)  

**Mitigation:**
- Password stored in password manager (per user decision)
- Easy recovery: Update `ADMIN_PASSWORD` in Vercel Dashboard
- Document recovery process

**Recovery Steps:**
```bash
# Via Vercel Dashboard
1. Go to Project → Settings → Environment Variables
2. Edit ADMIN_PASSWORD
3. Redeploy (or wait for next deployment)

# Via Vercel CLI
vercel env add ADMIN_PASSWORD
```

### 8.5 Session Secret Exposure

**Risk:** `SESSION_SECRET` leaked (e.g., committed to git)  
**Likelihood:** Low  
**Impact:** High (all sessions compromised)  

**Mitigation:**
- Store in `.env.local` (gitignored)
- Store in Vercel env vars (encrypted at rest)
- Add `.env.local` to `.gitignore` (already done)
- Regenerate if leaked: `openssl rand -base64 32`

---

## 9. Rollback

### 9.1 Code Rollback

**If authentication breaks:**

```bash
# Remove auth files
rm -rf app/admin/login
rm src/lib/session.ts
rm middleware.ts

# Revert package.json
git checkout package.json package-lock.json
npm install

# Deploy without auth
vercel --prod
```

### 9.2 Disable Authentication Temporarily

**Emergency bypass (use with caution):**

```typescript
// middleware.ts - Comment out protection
export async function middleware(request: NextRequest) {
  // TODO: Re-enable auth after fixing
  return NextResponse.next();
}
```

**Alternative:** Remove middleware entirely:
```bash
# Rename to disable
mv middleware.ts middleware.ts.disabled
```

### 9.3 Session Issues

**If sessions corrupted:**

```bash
# Clear all sessions by changing SESSION_SECRET
vercel env add SESSION_SECRET $(openssl rand -base64 32)
vercel --prod

# All users logged out (need to re-login)
```

---

## 10. Success Criteria

✅ Plan is complete when:

1. **Login Works**
   - Login page renders at `/admin/login`
   - Correct password grants access
   - Wrong password shows error
   - Redirects to intended destination after login

2. **Routes Protected**
   - All `/admin/*` routes require authentication
   - Unauthenticated users redirected to login
   - Login page accessible without auth
   - Public routes (`/`) unaffected

3. **Session Management**
   - Sessions persist across page loads
   - Sessions expire after 24 hours
   - Logout destroys session
   - Secure cookie settings enabled

4. **Security Baseline**
   - `httpOnly` cookies (no JavaScript access)
   - `sameSite: lax` (CSRF protection)
   - `secure: true` in production (HTTPS only)
   - Server Actions have CSRF tokens

5. **Developer Experience**
   - Session helpers importable: `getSession()`, `isAuthenticated()`
   - TypeScript types for `SessionData`
   - Error messages clear and helpful
   - No breaking changes to public site

---

## 11. Next Steps

After completing this plan:

→ **Plan 03: Admin CRUD - Quotes & Images**
- Build admin UI for managing quotes
- Build admin UI for managing images
- Implement Server Actions for CRUD operations
- Add duplicate detection for quotes

Authentication is now functional, allowing safe access to admin CMS routes.

---

## 12. Environment Variables Checklist

Ensure these are set before deployment:

```bash
# Required for this plan
SESSION_SECRET="<32+ character string>"
ADMIN_PASSWORD="<strong password 12+ chars>"

# From Plan 01 (database)
DATABASE_URL="<vercel postgres URL>"
DIRECT_DATABASE_URL="<vercel postgres direct URL>"

# Existing (Unsplash)
UNSPLASH_ACCESS_KEY="<your key>"
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
# Example output: X8h2Kp9mN4vQ7rT1yZ3bC5dF6gH8jL0k
```

**Add to Vercel:**
```bash
vercel env add SESSION_SECRET
vercel env add ADMIN_PASSWORD
```

---

**Estimated Completion:** 3 hours  
**Blockers:** Requires Plan 01 environment variables  
**Dependencies for Next Plan:** Admin routes now accessible with authentication
