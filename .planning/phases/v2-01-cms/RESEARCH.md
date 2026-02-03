# Phase 1: Content Management System - Research Document

**Version:** v2.0  
**Date:** 2025-02-03  
**Status:** Research Complete  

---

## Executive Summary

### High-Level Approach

This CMS implementation will use a **database-first architecture** with **graceful fallbacks** to the existing hardcoded quotes system. The approach prioritizes:

1. **Zero-downtime deployment** - Database failure won't break the site
2. **Simple authentication** - Single admin password via environment variable
3. **Server-first architecture** - Leverage Next.js 15+ Server Actions and Server Components
4. **Vercel Postgres + Prisma** - Type-safe database access with excellent DX
5. **Progressive enhancement** - Start with basic CRUD, iterate on UX later

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | Vercel Postgres (via Prisma) | Native Vercel integration, free tier, Prisma type safety |
| **ORM** | Prisma | Best Next.js integration, type-safe, great migrations |
| **Auth** | Simple cookie-based session | No NextAuth.js overhead, single admin use case |
| **Admin UI** | Server Actions + Server Components | Modern Next.js 15+ pattern, no API routes needed |
| **Forms** | Native forms + Server Actions | Simpler than React Hook Form for admin UX |
| **Session** | iron-session or jose JWT | Encrypted cookies, stateless auth |
| **5-Day Validation** | Database query on pairing create/edit | Query last 5 days, check quote_id collision |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Public Site                            │
│  (/) - getTodaysQuote() with database fallback              │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  • getQuoteForDate(date) -> DB first, fallback to QUOTES[]  │
│  • getImageForDate(date) -> DB pairing or Unsplash random   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Vercel Postgres + Prisma                    │
│  Tables: quotes, images, pairings                           │
└─────────────────────────────────────────────────────────────┘
                            ▲
┌─────────────────────────────────────────────────────────────┐
│                      Admin CMS (/admin/*)                    │
│  • Middleware auth check (cookie session)                   │
│  • Server Components for display                            │
│  • Server Actions for mutations                             │
│  • Protected by simple password login                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Database Design

### 1.1 Technology Stack

**Vercel Postgres** (PostgreSQL 15+)
- **Why**: Native Vercel integration, auto-scaling, free tier (60 hours compute/month)
- **Setup**: `@vercel/postgres` package + Prisma
- **Connection**: Pooled connections via `DATABASE_URL` environment variable
- **Limits**: Free tier sufficient for 1000s of quotes/images

**Prisma ORM** (v6+)
- **Why**: Best-in-class Next.js integration, type-safe queries, excellent migrations
- **Workflow**: Schema → Migrate → Generate types → Query
- **Benefits**: Zero runtime overhead, full TypeScript intellisense

### 1.2 Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
}

// Quotes table - stores all demotivational quotes
model Quote {
  id        String   @id @default(cuid())
  text      String   @db.Text
  author    String?  @db.VarChar(255)
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relations
  pairings  Pairing[]
  
  // Indexes for performance
  @@index([active])
  @@index([createdAt(sort: Desc)])
  @@map("quotes")
}

// Images table - stores landscape image URLs with attribution
model Image {
  id               String   @id @default(cuid())
  url              String   @db.Text // Full Unsplash URL
  photographerName String   @map("photographer_name") @db.VarChar(255)
  photographerUrl  String?  @map("photographer_url") @db.Text
  source           String   @default("unsplash") @db.VarChar(50) // 'unsplash', 'pexels', 'custom'
  active           Boolean  @default(true)
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  // Relations
  pairings         Pairing[]
  
  // Indexes
  @@index([active])
  @@index([source])
  @@map("images")
}

// Pairings table - assigns quote + image to specific date
model Pairing {
  id        String   @id @default(cuid())
  quoteId   String   @map("quote_id")
  imageId   String   @map("image_id")
  date      DateTime @db.Date // UTC date only (no time component)
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relations
  quote     Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  image     Image    @relation(fields: [imageId], references: [id], onDelete: Cascade)
  
  // Constraints
  @@unique([date]) // One pairing per date
  @@index([quoteId]) // Fast lookup for 5-day validation
  @@index([imageId])
  @@index([date(sort: Desc)]) // Most recent pairings first
  @@map("pairings")
}
```

### 1.3 Schema Design Decisions

#### Primary Keys: `cuid()` vs `uuid()`
- **Choice**: `cuid()` (Collision-resistant Universal ID)
- **Why**: More compact than UUID, sortable by creation time, better for URLs
- **Alternative**: Could use `uuid()` if needed for replication

#### Active Flag vs Soft Delete
- **Choice**: `active: Boolean` flag
- **Why**: 
  - Simple to query: `WHERE active = true`
  - Preserves data for analytics/history
  - Can reactivate content if needed
- **Implementation**: Admin UI shows inactive items grayed out, option to reactivate

#### Cascading Deletes
- **Quote/Image deleted** → Pairings cascade delete (`onDelete: Cascade`)
- **Rationale**: Orphaned pairings are useless, better to clean up automatically
- **Admin UX**: Show warning "This quote is paired with 3 dates, deleting will unpair them"

#### Date Index Strategy
- **`pairings.date`**: Unique index + DESC sort index
  - Unique ensures one pairing per date
  - DESC sort optimizes "upcoming pairings" list
- **`quotes.active`**: Index for fast filtering
- **`quotes.createdAt`**: DESC index for admin "recent quotes" view

#### Why `@db.Date` for pairings.date?
- **Stores date only** (no time component): `2025-02-03`
- **Prevents timezone issues**: Always work in UTC dates
- **Query pattern**: `WHERE date = '2025-02-03'::date`

### 1.4 Vercel Postgres Setup

#### Step 1: Provision Database

```bash
# Via Vercel Dashboard (recommended)
1. Go to project → Storage → Create Database → Postgres
2. Copy DATABASE_URL and DIRECT_DATABASE_URL to .env.local

# Or via CLI
vercel storage create postgres daily-demotivations-db
```

#### Step 2: Environment Variables

```bash
# .env.local (local development)
DATABASE_URL="postgres://default:***@***-pooler.aws-us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"
DIRECT_DATABASE_URL="postgres://default:***@***-direct.aws-us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"

# Vercel Dashboard (production)
# Both URLs automatically added when database created
# Exposed to Edge Functions and Serverless Functions
```

**Why two URLs?**
- `DATABASE_URL`: Pooled connection (use in app code)
- `DIRECT_DATABASE_URL`: Direct connection (use for migrations only)

#### Step 3: Install Dependencies

```bash
npm install @vercel/postgres @prisma/client
npm install -D prisma
```

#### Step 4: Initialize Prisma

```bash
npx prisma init
# Creates prisma/schema.prisma and updates .env
```

#### Step 5: Create Migration

```bash
# Create and apply migration
npx prisma migrate dev --name init

# Generate Prisma Client types
npx prisma generate
```

### 1.5 Prisma Best Practices for Next.js 15+

#### Singleton Prisma Client Pattern

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Why?**
- Prevents "too many connections" in dev (hot reloads)
- Single client instance reused across requests
- Development logging for debugging

#### Query Optimization Patterns

```typescript
// ✅ Good: Select only needed fields
const quotes = await prisma.quote.findMany({
  where: { active: true },
  select: {
    id: true,
    text: true,
    author: true,
  },
});

// ❌ Bad: Fetching all fields when not needed
const quotes = await prisma.quote.findMany({ where: { active: true } });
```

#### Error Handling Pattern

```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.quote.create({ data: { text: 'New quote' } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      return { error: 'Quote already exists' };
    }
  }
  throw error; // Unknown error
}
```

---

## 2. Authentication Strategy

### 2.1 Requirements Analysis

- **Single admin user** - No need for user management, roles, or permissions
- **Environment variable password** - `ADMIN_PASSWORD=supersecret123`
- **Protected routes** - `/admin/*` requires authentication
- **Session persistence** - Stay logged in across page loads
- **Security baseline** - CSRF protection, secure cookies, rate limiting

### 2.2 Implementation Approach

**Choice: iron-session** (cookie-based encrypted sessions)

#### Why iron-session?
- ✅ **Simple**: No database needed for sessions
- ✅ **Secure**: Encrypted cookies via `seal` algorithm
- ✅ **Stateless**: Works perfectly with Vercel serverless
- ✅ **TypeScript-first**: Full type safety for session data
- ✅ **Middleware-friendly**: Easy to check auth in Next.js middleware

#### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **NextAuth.js** | Full-featured, OAuth support | Overkill for single admin, requires database | ❌ Too complex |
| **Clerk** | Great UX, handles everything | Paid service, external dependency | ❌ Unnecessary SaaS |
| **jose JWT** | Standard JWT, lightweight | Need to manage refresh tokens | ⚠️ More complex than needed |
| **iron-session** | Perfect for simple auth, encrypted cookies | Manual implementation | ✅ **Best fit** |

### 2.3 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User visits /admin                        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Middleware (middleware.ts)                      │
│  1. Check if cookie 'admin-session' exists                  │
│  2. Decrypt session with iron-session                       │
│  3. Validate session.isLoggedIn === true                    │
│  4. If invalid → redirect to /admin/login                   │
│  5. If valid → allow request to proceed                     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  /admin/* pages render                       │
│  Server Components can safely assume authenticated          │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Implementation Code

#### Step 1: Install iron-session

```bash
npm install iron-session
```

#### Step 2: Session Configuration

```typescript
// src/lib/session.ts
import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  isLoggedIn: boolean;
  loginTime?: number; // Timestamp for session expiry
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!, // 32+ char secret
  cookieName: 'admin-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true, // Prevent JavaScript access
    sameSite: 'lax', // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// Helper to check if logged in
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  
  // Check if logged in and session not expired (7 days)
  if (!session.isLoggedIn || !session.loginTime) {
    return false;
  }
  
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const isExpired = Date.now() - session.loginTime > sevenDaysInMs;
  
  return !isExpired;
}
```

#### Step 3: Login Server Action

```typescript
// app/admin/login/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;
  
  // Simple comparison (no hashing needed - single admin)
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: 'Invalid password' };
  }
  
  // Create session
  const session = await getSession();
  session.isLoggedIn = true;
  session.loginTime = Date.now();
  await session.save();
  
  redirect('/admin');
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect('/admin/login');
}
```

#### Step 4: Login Page

```typescript
// app/admin/login/page.tsx
import { loginAction } from './actions';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        
        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### Step 5: Middleware for Route Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function middleware(request: NextRequest) {
  // Only protect /admin/* routes (except /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin') && 
      request.nextUrl.pathname !== '/admin/login') {
    
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    
    // Check if authenticated
    if (!session.isLoggedIn || !session.loginTime) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if session expired (7 days)
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.loginTime > sevenDaysInMs) {
      session.destroy();
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
```

### 2.5 Security Considerations

#### Rate Limiting (Prevent Brute Force)

**Option 1: Vercel Edge Rate Limiting** (Recommended)
```typescript
// Use @vercel/edge-rate-limit (if available on free tier)
import { ratelimit } from '@/lib/rate-limit';

export async function loginAction(formData: FormData) {
  const identifier = 'admin-login'; // Could use IP if available
  
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    return { error: 'Too many login attempts. Try again in 1 hour.' };
  }
  
  // ... rest of login logic
}
```

**Option 2: Vercel KV Store** (Simple counter)
```typescript
import { kv } from '@vercel/kv';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 60; // 1 hour in seconds

export async function loginAction(formData: FormData) {
  const attempts = await kv.incr('login-attempts');
  await kv.expire('login-attempts', LOCKOUT_DURATION);
  
  if (attempts > MAX_ATTEMPTS) {
    return { error: 'Too many attempts. Locked for 1 hour.' };
  }
  
  const password = formData.get('password') as string;
  
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: `Invalid password (${MAX_ATTEMPTS - attempts} attempts left)` };
  }
  
  // Success - reset counter
  await kv.del('login-attempts');
  
  // ... create session
}
```

#### CSRF Protection
- ✅ **Built-in**: Server Actions include automatic CSRF tokens
- ✅ **SameSite=lax**: Cookie not sent on cross-site requests
- ✅ **httpOnly**: Cookie not accessible via JavaScript

#### Password Hashing?
- **Decision**: NOT needed for this use case
- **Why**: Single admin, password in environment variable (not in database)
- **Alternative**: If storing in DB, use `bcrypt` or `argon2`

---

## 3. Admin UI Architecture

### 3.1 Next.js 15+ Patterns

**Principle: Server-first architecture**
- Use Server Components for display (quotes list, pairings calendar)
- Use Server Actions for mutations (create, edit, delete)
- Minimize client-side JavaScript (progressively enhance)

### 3.2 Route Structure

```
app/
├── admin/
│   ├── layout.tsx              # Admin shell with nav, logout button
│   ├── page.tsx                # Dashboard - upcoming pairings
│   ├── login/
│   │   ├── page.tsx            # Login form
│   │   └── actions.ts          # loginAction, logoutAction
│   ├── quotes/
│   │   ├── page.tsx            # Quotes list (Server Component)
│   │   ├── new/
│   │   │   ├── page.tsx        # New quote form
│   │   │   └── actions.ts      # createQuoteAction
│   │   └── [id]/
│   │       ├── page.tsx        # Edit quote form
│   │       └── actions.ts      # updateQuoteAction, deleteQuoteAction
│   ├── images/
│   │   ├── page.tsx            # Images list
│   │   ├── new/
│   │   │   ├── page.tsx        # New image form (URL input)
│   │   │   └── actions.ts      # createImageAction
│   │   └── [id]/
│   │       ├── page.tsx        # Edit image form
│   │       └── actions.ts      # updateImageAction, deleteImageAction
│   └── pairings/
│       ├── page.tsx            # Calendar view / pairings list
│       ├── new/
│       │   ├── page.tsx        # New pairing form (date picker, quote dropdown, image dropdown)
│       │   └── actions.ts      # createPairingAction (includes 5-day validation)
│       └── [id]/
│           ├── page.tsx        # Edit pairing form
│           └── actions.ts      # updatePairingAction, deletePairingAction
```

### 3.3 Server Components vs Client Components

#### Server Components (Default)
Use for:
- ✅ Data fetching from database
- ✅ Displaying lists (quotes, images, pairings)
- ✅ Forms that submit to Server Actions
- ✅ Static content (headers, navbars)

```typescript
// app/admin/quotes/page.tsx (Server Component)
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  
  return (
    <div>
      <h1>Quotes</h1>
      <Link href="/admin/quotes/new">Add New Quote</Link>
      
      <table>
        <thead>
          <tr>
            <th>Quote</th>
            <th>Author</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id}>
              <td>{quote.text}</td>
              <td>{quote.author || 'Anonymous'}</td>
              <td>{quote.createdAt.toLocaleDateString()}</td>
              <td>
                <Link href={`/admin/quotes/${quote.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### Client Components ('use client')
Use for:
- ✅ Interactive widgets (date pickers, modals, toasts)
- ✅ Form state management (showing errors before submit)
- ✅ Real-time validation (5-day warning)

```typescript
// app/admin/pairings/new/DatePicker.tsx (Client Component)
'use client';

import { useState } from 'react';

export function DatePicker({ name }: { name: string }) {
  const [selectedDate, setSelectedDate] = useState('');
  
  return (
    <input
      type="date"
      name={name}
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="..."
    />
  );
}
```

### 3.4 Form Handling with Server Actions

**Preferred Pattern: Native forms + Server Actions**

#### Why not React Hook Form?
- ❌ Overkill for admin forms (rough UX acceptable)
- ❌ Adds client-side complexity
- ✅ Server Actions simpler, less JavaScript

#### Basic CRUD Pattern

```typescript
// app/admin/quotes/new/page.tsx
import { createQuoteAction } from './actions';

export default function NewQuotePage() {
  return (
    <div>
      <h1>Add New Quote</h1>
      
      <form action={createQuoteAction} className="space-y-4">
        <div>
          <label htmlFor="text">Quote Text *</label>
          <textarea
            id="text"
            name="text"
            required
            rows={4}
            className="w-full border rounded p-2"
            placeholder="Your daily motivation: It probably won't work anyway."
          />
        </div>
        
        <div>
          <label htmlFor="author">Author (optional)</label>
          <input
            type="text"
            id="author"
            name="author"
            className="w-full border rounded p-2"
            placeholder="Anonymous"
          />
        </div>
        
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Create Quote
          </button>
          <a href="/admin/quotes" className="bg-gray-200 px-4 py-2 rounded">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

// app/admin/quotes/new/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createQuoteAction(formData: FormData) {
  const text = formData.get('text') as string;
  const author = formData.get('author') as string | null;
  
  // Validation
  if (!text || text.trim().length === 0) {
    return { error: 'Quote text is required' };
  }
  
  // Check for duplicate (simple text match)
  const existing = await prisma.quote.findFirst({
    where: { text: text.trim() },
  });
  
  if (existing) {
    return { error: 'This quote already exists' };
  }
  
  // Create quote
  await prisma.quote.create({
    data: {
      text: text.trim(),
      author: author?.trim() || null,
      active: true,
    },
  });
  
  // Revalidate quotes list page
  revalidatePath('/admin/quotes');
  
  // Redirect to list
  redirect('/admin/quotes');
}
```

### 3.5 Displaying Validation Errors

**Pattern: useFormState hook** (Next.js 15+)

```typescript
// app/admin/quotes/new/page.tsx
'use client'; // Need client component for useFormState

import { useFormState } from 'react-dom';
import { createQuoteAction } from './actions';

export default function NewQuotePage() {
  const [state, formAction] = useFormState(createQuoteAction, null);
  
  return (
    <form action={formAction}>
      {state?.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}
      
      {/* Form fields */}
    </form>
  );
}
```

### 3.6 Table/List Views with Pagination

**Simple Pagination Pattern**

```typescript
// app/admin/quotes/page.tsx
import { prisma } from '@/lib/prisma';

interface Props {
  searchParams: { page?: string };
}

export default async function QuotesPage({ searchParams }: Props) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  
  const [quotes, totalCount] = await Promise.all([
    prisma.quote.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.quote.count({ where: { active: true } }),
  ]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return (
    <div>
      <h1>Quotes ({totalCount} total)</h1>
      
      {/* Table */}
      <table>...</table>
      
      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        {page > 1 && (
          <a href={`?page=${page - 1}`} className="px-4 py-2 bg-gray-200 rounded">
            Previous
          </a>
        )}
        
        <span className="px-4 py-2">
          Page {page} of {totalPages}
        </span>
        
        {page < totalPages && (
          <a href={`?page=${page + 1}`} className="px-4 py-2 bg-gray-200 rounded">
            Next
          </a>
        )}
      </div>
    </div>
  );
}
```

### 3.7 Admin Layout Shell

```typescript
// app/admin/layout.tsx
import { isAuthenticated } from '@/lib/session';
import { redirect } from 'next/navigation';
import { logoutAction } from './login/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Daily Demotivations Admin</h1>
          
          <nav className="flex gap-4 items-center">
            <a href="/admin" className="hover:underline">Dashboard</a>
            <a href="/admin/quotes" className="hover:underline">Quotes</a>
            <a href="/admin/images" className="hover:underline">Images</a>
            <a href="/admin/pairings" className="hover:underline">Pairings</a>
            
            <form action={logoutAction}>
              <button type="submit" className="text-red-600 hover:underline">
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

## 4. Data Layer Patterns

### 4.1 Graceful Fallback Architecture

**Goal**: Site works even if database is down

#### Pattern: Try-catch with fallback

```typescript
// src/lib/quotes-service.ts
import { prisma } from './prisma';
import { QUOTES } from './quotes'; // Hardcoded fallback
import { format } from 'date-fns';

/**
 * Gets quote for specific date
 * Tries database first, falls back to hardcoded array
 */
export async function getQuoteForDate(date: Date): Promise<{
  text: string;
  author: string | null;
  source: 'database' | 'fallback';
}> {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  try {
    // Try to get pairing from database
    const pairing = await prisma.pairing.findUnique({
      where: { date: new Date(dateStr) },
      include: {
        quote: {
          where: { active: true },
        },
      },
    });
    
    if (pairing?.quote) {
      return {
        text: pairing.quote.text,
        author: pairing.quote.author,
        source: 'database',
      };
    }
    
    // No pairing for this date - try random active quote
    const randomQuote = await prisma.quote.findFirst({
      where: { active: true },
      skip: Math.floor(Math.random() * 10), // Pseudo-random
    });
    
    if (randomQuote) {
      return {
        text: randomQuote.text,
        author: randomQuote.author,
        source: 'database',
      };
    }
    
    // No quotes in database - fall back
    throw new Error('No quotes in database');
    
  } catch (error) {
    console.error('Database error, using fallback quotes:', error);
    
    // Use existing deterministic hash algorithm
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash = hash & hash;
    }
    
    const index = Math.abs(hash) % QUOTES.length;
    return {
      text: QUOTES[index],
      author: null,
      source: 'fallback',
    };
  }
}

/**
 * Today's quote - wrapper around getQuoteForDate
 */
export async function getTodaysQuote() {
  return getQuoteForDate(new Date());
}
```

#### Database Timeout Configuration

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Set reasonable timeout (5 seconds)
  // If DB doesn't respond, fail fast and use fallback
});

// Monkey-patch to add timeout to all queries
const originalQuery = prisma.$queryRaw.bind(prisma);
prisma.$queryRaw = async (...args: any[]) => {
  return Promise.race([
    originalQuery(...args),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    ),
  ]);
};
```

### 4.2 Image Pairing with Fallback

```typescript
// src/lib/images-service.ts
import { prisma } from './prisma';
import { getRandomLandscape } from './unsplash';
import { format } from 'date-fns';
import type { LandscapePhoto } from '@/types';

/**
 * Gets image for specific date
 * Tries paired image first, falls back to Unsplash random
 */
export async function getImageForDate(date: Date): Promise<LandscapePhoto & { source: 'database' | 'unsplash' }> {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  try {
    // Try to get pairing from database
    const pairing = await prisma.pairing.findUnique({
      where: { date: new Date(dateStr) },
      include: {
        image: {
          where: { active: true },
        },
      },
    });
    
    if (pairing?.image) {
      // Validate image URL is accessible (optional - may slow down page load)
      const isValid = await validateImageUrl(pairing.image.url);
      
      if (isValid) {
        return {
          url: pairing.image.url,
          photographer: pairing.image.photographerName,
          photographerUrl: pairing.image.photographerUrl || '',
          alt: 'Romantic landscape background',
          downloadUrl: '', // Not needed for custom images
          source: 'database',
        };
      }
    }
  } catch (error) {
    console.error('Database error fetching image, using Unsplash fallback:', error);
  }
  
  // Fall back to Unsplash random
  const unsplashImage = await getRandomLandscape();
  return {
    ...unsplashImage,
    source: 'unsplash',
  };
}

/**
 * Validates image URL is accessible (optional)
 * Returns true if URL responds with 200, false otherwise
 */
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### 4.3 Caching Strategy

**Principle: Leverage Next.js built-in caching**

#### Page-level caching (ISR)
```typescript
// app/page.tsx
export const revalidate = 86400; // 24 hours

export default async function HomePage() {
  const quote = await getTodaysQuote(); // Cached via ISR
  const image = await getImageForDate(new Date()); // Cached via ISR
  // ...
}
```

#### Database query caching (Next.js 15+ fetch cache)
```typescript
// Prisma queries are automatically cached by Next.js in production
// No need for additional caching layer

// To force revalidation after mutation:
import { revalidatePath } from 'next/cache';

export async function createQuoteAction(formData: FormData) {
  await prisma.quote.create({ /* ... */ });
  
  revalidatePath('/admin/quotes'); // Revalidate list page
  revalidatePath('/'); // Revalidate homepage if needed
}
```

#### Manual caching (if needed)
```typescript
import { unstable_cache } from 'next/cache';

export const getCachedQuotes = unstable_cache(
  async () => {
    return prisma.quote.findMany({ where: { active: true } });
  },
  ['active-quotes'],
  { revalidate: 3600, tags: ['quotes'] }
);

// Invalidate cache
import { revalidateTag } from 'next/cache';
revalidateTag('quotes');
```

### 4.4 Quote Selection Logic Migration

**Before (hardcoded):**
```typescript
export function getTodaysQuote(): string {
  const today = format(new Date(), 'yyyy-MM-dd');
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % QUOTES.length;
  return QUOTES[index];
}
```

**After (database-first):**
```typescript
export async function getTodaysQuote() {
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  
  try {
    // 1. Try to get pairing for today
    const pairing = await prisma.pairing.findUnique({
      where: { date: new Date(dateStr) },
      include: { quote: true },
    });
    
    if (pairing?.quote?.active) {
      return {
        text: pairing.quote.text,
        author: pairing.quote.author,
      };
    }
    
    // 2. No pairing - fall back to deterministic selection from database
    const allQuotes = await prisma.quote.findMany({
      where: { active: true },
      select: { id: true, text: true, author: true },
    });
    
    if (allQuotes.length > 0) {
      // Use same hash algorithm for consistency
      let hash = 0;
      for (let i = 0; i < dateStr.length; i++) {
        hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
        hash = hash & hash;
      }
      const index = Math.abs(hash) % allQuotes.length;
      return allQuotes[index];
    }
    
    // 3. No database quotes - fall back to hardcoded
    throw new Error('No quotes in database');
    
  } catch (error) {
    console.error('Database error:', error);
    
    // Fallback to hardcoded quotes with same algorithm
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % QUOTES.length;
    return {
      text: QUOTES[index],
      author: null,
    };
  }
}
```

---

## 5. 5-Day Repetition Validation

**Critical Feature**: Prevent same quote appearing within 5-day window

### 5.1 Algorithm

```typescript
/**
 * Validates that quote hasn't been used in last 5 days
 * Returns true if valid, false if quote was recently used
 */
export async function validate5DayRule(
  quoteId: string,
  targetDate: Date,
  excludePairingId?: string // For edit mode - exclude current pairing
): Promise<{
  valid: boolean;
  conflictDate?: Date;
}> {
  // Calculate date range: target date ± 5 days
  const fiveDaysAgo = new Date(targetDate);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  
  const fiveDaysAhead = new Date(targetDate);
  fiveDaysAhead.setDate(fiveDaysAhead.getDate() + 5);
  
  // Query pairings in this range with same quote
  const conflicts = await prisma.pairing.findMany({
    where: {
      quoteId,
      date: {
        gte: fiveDaysAgo,
        lte: fiveDaysAhead,
      },
      // Exclude current pairing if editing
      ...(excludePairingId && { id: { not: excludePairingId } }),
    },
    orderBy: { date: 'asc' },
  });
  
  // Filter out the target date itself (only check other dates)
  const relevantConflicts = conflicts.filter(
    (p) => format(p.date, 'yyyy-MM-dd') !== format(targetDate, 'yyyy-MM-dd')
  );
  
  if (relevantConflicts.length > 0) {
    return {
      valid: false,
      conflictDate: relevantConflicts[0].date,
    };
  }
  
  return { valid: true };
}
```

### 5.2 Integration with Pairing Creation

```typescript
// app/admin/pairings/new/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { validate5DayRule } from '@/lib/validation';
import { redirect } from 'next/navigation';

export async function createPairingAction(formData: FormData) {
  const quoteId = formData.get('quoteId') as string;
  const imageId = formData.get('imageId') as string;
  const dateStr = formData.get('date') as string;
  
  // Validation
  if (!quoteId || !imageId || !dateStr) {
    return { error: 'All fields are required' };
  }
  
  const targetDate = new Date(dateStr);
  
  // Check if date already has a pairing
  const existing = await prisma.pairing.findUnique({
    where: { date: targetDate },
  });
  
  if (existing) {
    return { error: 'This date already has a pairing. Edit the existing pairing instead.' };
  }
  
  // 5-DAY VALIDATION (critical feature!)
  const validation = await validate5DayRule(quoteId, targetDate);
  
  if (!validation.valid) {
    const conflictDateStr = format(validation.conflictDate!, 'MMM d, yyyy');
    return {
      error: `This quote was used on ${conflictDateStr}. Please choose a different quote or date (5-day separation required).`,
    };
  }
  
  // Create pairing
  await prisma.pairing.create({
    data: {
      quoteId,
      imageId,
      date: targetDate,
    },
  });
  
  revalidatePath('/admin/pairings');
  redirect('/admin/pairings');
}
```

### 5.3 Real-time Validation (Optional Enhancement)

**Client-side warning before submit:**

```typescript
// app/admin/pairings/new/QuoteSelector.tsx
'use client';

import { useState, useEffect } from 'react';

export function QuoteSelector({ quotes, selectedDate }: Props) {
  const [selectedQuote, setSelectedQuote] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  
  useEffect(() => {
    if (selectedQuote && selectedDate) {
      // Check 5-day rule via API
      fetch('/api/validate-pairing', {
        method: 'POST',
        body: JSON.stringify({ quoteId: selectedQuote, date: selectedDate }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.valid) {
            setWarning(`⚠️ This quote was used on ${data.conflictDate}. 5-day separation recommended.`);
          } else {
            setWarning(null);
          }
        });
    }
  }, [selectedQuote, selectedDate]);
  
  return (
    <div>
      <select
        name="quoteId"
        value={selectedQuote}
        onChange={(e) => setSelectedQuote(e.target.value)}
        className="..."
      >
        <option value="">Select a quote</option>
        {quotes.map((q) => (
          <option key={q.id} value={q.id}>{q.text.substring(0, 50)}...</option>
        ))}
      </select>
      
      {warning && (
        <div className="mt-2 text-yellow-600 text-sm">
          {warning}
        </div>
      )}
    </div>
  );
}
```

### 5.4 Performance Optimization

**Index Strategy:**
- `pairings.date` - DESC index for range queries
- `pairings.quoteId` - Index for filtering by quote

**Query Performance:**
```sql
-- Efficient query plan with indexes:
EXPLAIN ANALYZE
SELECT * FROM pairings
WHERE quote_id = 'clxxx'
  AND date >= '2025-01-29'
  AND date <= '2025-02-08'
ORDER BY date ASC;

-- Expected: Index Scan on pairings_quote_id_idx
-- Time: < 5ms even with 1000s of pairings
```

---

## 6. Migration Strategy

### 6.1 Zero-Downtime Migration Plan

**Goal**: Deploy CMS without breaking production

#### Phase 1: Database Setup (No code changes)
1. Provision Vercel Postgres database
2. Add environment variables to Vercel project
3. Run migrations from local machine
4. Seed initial 30 quotes

```bash
# Step 1: Create database via Vercel Dashboard
# Storage → Create Database → Postgres

# Step 2: Pull environment variables locally
vercel env pull .env.local

# Step 3: Run migrations
npx prisma migrate deploy

# Step 4: Seed quotes
npx prisma db seed
```

**Seed script:**
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { QUOTES } from '../src/lib/quotes';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with 30 hardcoded quotes...');
  
  for (const text of QUOTES) {
    await prisma.quote.create({
      data: {
        text,
        author: null,
        active: true,
      },
    });
  }
  
  console.log('✅ Seeded 30 quotes');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**package.json:**
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

#### Phase 2: Add Data Layer (Backward compatible)
1. Create `src/lib/quotes-service.ts` with fallback logic
2. Update `app/page.tsx` to use new service
3. Deploy to Vercel
4. **Result**: Site works exactly as before (falls back to hardcoded quotes if DB query fails)

```typescript
// app/page.tsx (updated)
import { getTodaysQuote } from '@/lib/quotes-service'; // New service
// Old: import { getTodaysQuote } from '@/lib/quotes';

export default async function HomePage() {
  const quote = await getTodaysQuote(); // Now tries DB first
  // ... rest of page
}
```

#### Phase 3: Deploy Admin CMS (Separate routes)
1. Build `/admin/*` routes (protected by middleware)
2. Deploy to Vercel
3. **Result**: Public site unchanged, admin CMS available at `/admin`

#### Phase 4: Start Using Database (Gradual)
1. Admin creates image records in database
2. Admin creates pairings for future dates
3. As dates pass, site automatically uses database pairings
4. **Result**: Seamless transition, no disruption

### 6.2 Feature Flag (Optional)

**Environment variable to enable/disable CMS:**

```typescript
// src/lib/features.ts
export const FEATURES = {
  CMS_ENABLED: process.env.ENABLE_CMS === 'true',
};

// app/page.tsx
import { FEATURES } from '@/lib/features';
import { getTodaysQuote as getHardcodedQuote } from '@/lib/quotes';
import { getTodaysQuote as getDatabaseQuote } from '@/lib/quotes-service';

export default async function HomePage() {
  const quote = FEATURES.CMS_ENABLED
    ? await getDatabaseQuote()
    : await getHardcodedQuote();
  // ...
}
```

### 6.3 Testing Approach

#### Local Development
```bash
# Use local Postgres (optional)
docker run -d \
  --name daily-demotivations-db \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  postgres:15

# Update .env.local
DATABASE_URL="postgresql://postgres:dev@localhost:5432/daily_demotivations"

# Run migrations
npx prisma migrate dev
```

#### Vercel Preview Deployments
- Each preview deployment gets its own database (if configured)
- Or use shared staging database

#### Production Testing
- Deploy to production (CMS routes are protected, public site unchanged)
- Test admin CMS on production URL
- Public site continues using hardcoded quotes until pairings created

### 6.4 Rollback Plan

**If database migration fails:**

1. **Revert code deployment**
   ```bash
   vercel rollback
   ```

2. **Database rollback** (if needed)
   ```bash
   # Prisma migrations are tracked in _prisma_migrations table
   # To rollback, deploy previous version of schema and re-migrate
   git checkout <previous-commit>
   npx prisma migrate deploy
   ```

3. **Feature flag emergency stop**
   ```bash
   # Disable CMS via environment variable
   vercel env add ENABLE_CMS false
   ```

**If CMS breaks but public site works:**
- No rollback needed!
- Fix admin UI bugs in next deployment
- Public site unaffected (using fallback quotes)

---

## 7. Risk Analysis

### 7.1 Database Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Database downtime** | Low | High | Graceful fallback to hardcoded quotes |
| **Connection pool exhaustion** | Low | Medium | Use Prisma singleton pattern, connection pooling |
| **Slow queries** | Low | Medium | Add indexes on `date`, `quoteId`, `active` |
| **Data corruption** | Very Low | High | Regular backups (Vercel auto-backups), migration testing |
| **Free tier limits exceeded** | Low | Low | Monitor usage, Vercel auto-scales to paid tier |

### 7.2 Authentication Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Brute force attack** | Medium | Medium | Rate limiting (5 attempts/hour lockout) |
| **Session hijacking** | Low | Medium | Secure cookies (httpOnly, sameSite), HTTPS only |
| **Password exposed** | Low | High | Store in Vercel env vars (encrypted at rest) |
| **CSRF attack** | Low | Low | Server Actions have built-in CSRF protection |
| **Admin locked out** | Low | Low | Document password reset process (update env var) |

### 7.3 Data Integrity Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Duplicate quotes** | Medium | Low | Check before insert, unique constraint on text (optional) |
| **5-day rule violated** | Low | Medium | Server-side validation enforced, transaction isolation |
| **Broken image URLs** | Medium | Low | Validate URLs on save (optional), fallback to Unsplash |
| **Quote deleted with pairings** | Low | Low | Cascade delete pairings, warn admin before delete |
| **Timezone issues** | Low | Medium | Always use UTC dates (no time component) |

### 7.4 Performance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Slow page loads** | Low | Medium | Database queries cached via Next.js ISR (24h) |
| **Admin UI slow** | Medium | Low | Pagination (20 items/page), indexes on common queries |
| **Image validation slow** | Low | Low | Optional feature, can disable or make async |
| **Database timeout** | Low | Medium | 5-second timeout, fast fallback to hardcoded quotes |

### 7.5 Deployment Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Migration fails** | Low | High | Test locally first, use Prisma migrate deploy (safe) |
| **Public site breaks** | Very Low | Critical | Backward-compatible data layer, fallback logic |
| **Admin locked out** | Low | Low | Can always update ADMIN_PASSWORD via Vercel dashboard |
| **Database not available** | Low | Medium | Site continues working with fallbacks |

---

## 8. Open Questions

### 8.1 Technical Decisions Needed

1. **Image URL validation**
   - ❓ Should we validate image URLs with HTTP HEAD request on save?
   - ❓ Performance cost: ~200ms per validation
   - 💡 **Recommendation**: Optional background validation, don't block save

2. **Duplicate quote detection**
   - ❓ Exact text match? Fuzzy matching (Levenshtein distance)?
   - ❓ Should "Dream big" and "Dream big." be considered duplicates?
   - 💡 **Recommendation**: Exact text match (trim + case-insensitive), can enhance later

3. **Pagination page size**
   - ❓ How many quotes/images per page? 20? 50? 100?
   - 💡 **Recommendation**: Start with 20, make configurable if needed

4. **Session duration**
   - ❓ How long should admin stay logged in? 7 days? 30 days? 1 year?
   - 💡 **Recommendation**: 7 days (balances convenience and security)

5. **Rate limiting strategy**
   - ❓ Use Vercel KV or third-party service (Upstash)?
   - ❓ Free tier limits: Vercel KV (30 requests/day free tier)
   - 💡 **Recommendation**: Start without, add if abuse detected

### 8.2 UX Decisions Needed

1. **Pairing calendar view**
   - ❓ Simple list (date, quote, image) or calendar UI?
   - 💡 **Recommendation**: Simple list first (user said rough UX acceptable)

2. **Bulk pairing operations**
   - ❓ Should admin be able to assign multiple dates at once?
   - ❓ Use case: "Assign random pairings for next 30 days"
   - 💡 **Recommendation**: Phase 2 feature, not MVP

3. **Quote preview on public site**
   - ❓ Should admin see what today's quote will be before publishing?
   - 💡 **Recommendation**: Add "Preview" link in admin dashboard

4. **Image preview in admin**
   - ❓ Show thumbnail of image URL in admin list?
   - 💡 **Recommendation**: Yes, helps admin verify correct image

5. **Inactive content visibility**
   - ❓ Should inactive quotes/images be shown in admin (grayed out)?
   - 💡 **Recommendation**: Show with "Inactive" badge, option to reactivate

### 8.3 Data Management Questions

1. **Unassigned date behavior**
   - ❓ If no pairing exists for date, show random quote or specific fallback?
   - 💡 **Recommendation**: Random active quote from database (deterministic by date)

2. **Image source tracking**
   - ❓ Should we track where each image came from (Unsplash, Pexels, custom)?
   - 💡 **Recommendation**: Yes, `source` field in schema (for attribution)

3. **Quote authorship**
   - ❓ Is author field important? Most quotes are original/anonymous
   - 💡 **Recommendation**: Optional field, show if provided

4. **Pairing history**
   - ❓ Should we track when pairings were created/modified?
   - 💡 **Recommendation**: Yes, `createdAt` field already in schema

---

## 9. Implementation Checklist

### Phase 1A: Database Setup (Week 1)
- [ ] Provision Vercel Postgres database
- [ ] Install Prisma and @vercel/postgres
- [ ] Create Prisma schema with quotes, images, pairings tables
- [ ] Run initial migration
- [ ] Create seed script with 30 existing quotes
- [ ] Test database connection locally

### Phase 1B: Data Layer (Week 1)
- [ ] Create `src/lib/prisma.ts` (singleton client)
- [ ] Create `src/lib/quotes-service.ts` with fallback logic
- [ ] Create `src/lib/images-service.ts` with fallback logic
- [ ] Create `src/lib/validation.ts` (5-day rule)
- [ ] Update `app/page.tsx` to use new services
- [ ] Test fallback behavior (disconnect database, verify site works)

### Phase 1C: Authentication (Week 2)
- [ ] Install iron-session
- [ ] Create `src/lib/session.ts` (session config, helpers)
- [ ] Create `app/admin/login/page.tsx` (login form)
- [ ] Create `app/admin/login/actions.ts` (login/logout actions)
- [ ] Create `middleware.ts` (protect /admin/* routes)
- [ ] Add SESSION_SECRET and ADMIN_PASSWORD to environment variables
- [ ] Test login/logout flow

### Phase 1D: Admin UI - Quotes (Week 2)
- [ ] Create `app/admin/layout.tsx` (admin shell with nav)
- [ ] Create `app/admin/page.tsx` (dashboard - upcoming pairings)
- [ ] Create `app/admin/quotes/page.tsx` (quotes list with pagination)
- [ ] Create `app/admin/quotes/new/page.tsx` (new quote form)
- [ ] Create `app/admin/quotes/new/actions.ts` (create action)
- [ ] Create `app/admin/quotes/[id]/page.tsx` (edit quote form)
- [ ] Create `app/admin/quotes/[id]/actions.ts` (update/delete actions)
- [ ] Test CRUD operations

### Phase 1E: Admin UI - Images (Week 3)
- [ ] Create `app/admin/images/page.tsx` (images list)
- [ ] Create `app/admin/images/new/page.tsx` (new image form - URL input)
- [ ] Create `app/admin/images/new/actions.ts` (create action)
- [ ] Create `app/admin/images/[id]/page.tsx` (edit image form)
- [ ] Create `app/admin/images/[id]/actions.ts` (update/delete actions)
- [ ] Add Unsplash URL placeholder hint
- [ ] Add image preview (thumbnail)
- [ ] Test CRUD operations

### Phase 1F: Admin UI - Pairings (Week 3)
- [ ] Create `app/admin/pairings/page.tsx` (pairings list)
- [ ] Create `app/admin/pairings/new/page.tsx` (new pairing form)
- [ ] Create `app/admin/pairings/new/actions.ts` (create action with 5-day validation)
- [ ] Create `app/admin/pairings/[id]/page.tsx` (edit pairing form)
- [ ] Create `app/admin/pairings/[id]/actions.ts` (update/delete actions)
- [ ] Add date picker (native <input type="date">)
- [ ] Add quote dropdown (select from active quotes)
- [ ] Add image dropdown (select from active images)
- [ ] Test 5-day validation (should show error if violated)

### Phase 1G: Polish & Testing (Week 4)
- [ ] Add rate limiting to login (optional)
- [ ] Add error boundaries for graceful error handling
- [ ] Add loading states for forms (pending UI)
- [ ] Test all CRUD operations end-to-end
- [ ] Test graceful fallbacks (disconnect database, verify site works)
- [ ] Test 5-day validation edge cases
- [ ] Test session expiry (7 days)
- [ ] Performance testing (check query times)
- [ ] Security audit (CSRF, XSS, SQL injection)

### Phase 1H: Deployment (Week 4)
- [ ] Deploy database migration to Vercel
- [ ] Deploy code to Vercel
- [ ] Verify environment variables set correctly
- [ ] Test public site (should work normally)
- [ ] Test admin login on production
- [ ] Monitor logs for errors
- [ ] Create first pairing in production
- [ ] Verify pairing shows on public site next day

---

## 10. Technology Stack Summary

### Core Dependencies
```json
{
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "@vercel/postgres": "^0.10.0",
    "iron-session": "^8.0.0",
    "date-fns": "^4.1.0", // Already installed
    "next": "^16.1.6", // Already installed
    "react": "^19.2.4", // Already installed
    "react-dom": "^19.2.4" // Already installed
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "tsx": "^4.0.0" // For running seed script
  }
}
```

### Environment Variables

```bash
# .env.local (development)
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..." # For migrations
SESSION_SECRET="complex-secret-at-least-32-chars"
ADMIN_PASSWORD="your-secure-password"
UNSPLASH_ACCESS_KEY="..." # Already configured
ENABLE_CMS="true" # Optional feature flag

# Vercel Production (auto-configured)
DATABASE_URL # Added by Vercel Postgres
DIRECT_DATABASE_URL # Added by Vercel Postgres
SESSION_SECRET # Add manually (generate with openssl rand -base64 32)
ADMIN_PASSWORD # Add manually
```

---

## 11. Next Steps

1. **Review this research document** with team/stakeholders
2. **Answer open questions** (section 8)
3. **Approve architecture** and key decisions
4. **Begin Phase 1A** (database setup)
5. **Iterate based on feedback**

---

## Appendix A: Useful Commands

```bash
# Prisma commands
npx prisma init                  # Initialize Prisma
npx prisma migrate dev           # Create and apply migration (dev)
npx prisma migrate deploy        # Apply migrations (production)
npx prisma generate              # Generate Prisma Client types
npx prisma studio                # Open database GUI
npx prisma db seed               # Run seed script
npx prisma db push               # Push schema to DB without migration (dev only)

# Vercel commands
vercel                           # Deploy to preview
vercel --prod                    # Deploy to production
vercel env pull .env.local       # Pull environment variables
vercel env add SESSION_SECRET    # Add environment variable
vercel logs                      # View deployment logs
vercel rollback                  # Rollback to previous deployment

# Database commands (local)
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:15
psql $DATABASE_URL               # Connect to database
```

---

## Appendix B: Example Database Queries

```typescript
// Get today's pairing
const pairing = await prisma.pairing.findUnique({
  where: { date: new Date('2025-02-03') },
  include: { quote: true, image: true },
});

// Get active quotes
const quotes = await prisma.quote.findMany({
  where: { active: true },
  orderBy: { createdAt: 'desc' },
});

// Check 5-day rule
const conflicts = await prisma.pairing.findMany({
  where: {
    quoteId: 'quote-id',
    date: { gte: new Date('2025-01-29'), lte: new Date('2025-02-08') },
  },
});

// Get upcoming pairings (dashboard)
const upcoming = await prisma.pairing.findMany({
  where: { date: { gte: new Date() } },
  include: { quote: true, image: true },
  orderBy: { date: 'asc' },
  take: 10,
});

// Create pairing
await prisma.pairing.create({
  data: {
    quoteId: 'quote-id',
    imageId: 'image-id',
    date: new Date('2025-02-10'),
  },
});
```

---

**End of Research Document**

This research document provides a comprehensive foundation for implementing the CMS. The approach prioritizes simplicity, reliability, and graceful degradation while leveraging modern Next.js 15+ patterns and Vercel's excellent database integration.

Key takeaways:
1. **Database-first with fallbacks** - Site never breaks
2. **Simple authentication** - iron-session, single password
3. **Server Components + Server Actions** - Modern Next.js pattern
4. **5-day validation enforced** - Critical business rule
5. **Zero-downtime migration** - Backward compatible deployment

Ready to proceed with implementation! 🚀
