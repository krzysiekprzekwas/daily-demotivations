# Execution Plan 04: Pairing System & 5-Day Validation

**Phase:** V2 Phase 1 - Content Management System  
**Plan:** 04 of 05  
**Status:** Ready for Execution  
**Date:** 2025-02-03

---

## 1. Goal

Implement the pairing system that assigns quote + image combinations to specific dates. Build the admin dashboard showing upcoming pairings. Enforce 5-day repetition validation to prevent the same quote appearing within a 5-day window. Add cascade delete warnings when removing quotes/images that have pairings.

---

## 2. Requirements Covered

- **CMS-03:** Quote-to-image pairing for specific dates
- **CMS-06:** Admin dashboard with upcoming pairings
- **CMS-07:** 5-day rolling window validation

---

## 3. Dependencies

**Prerequisites:**
- ✅ Plan 01 completed (database with pairings table)
- ✅ Plan 02 completed (authentication)
- ✅ Plan 03 completed (quotes and images exist in database)

**Database Requirements:**
- At least 1 quote exists
- At least 1 image exists (or allow pairing with Unsplash fallback)

---

## 4. Estimated Time

- **Dashboard:** 1.5 hours (upcoming pairings list, calendar preview)
- **Pairing List:** 1 hour (all pairings with filters)
- **Create Pairing:** 2 hours (form with dropdowns, date picker, validation)
- **5-Day Validation:** 1.5 hours (algorithm, error messages)
- **Edit/Delete Pairing:** 1 hour (update existing, delete)
- **Testing:** 2 hours (edge cases, date logic, validation)
- **Total:** 9 hours

---

## 5. Deliverables

### 5.1 Dashboard
- [ ] `app/admin/page.tsx` - Dashboard with upcoming pairings (7 days ahead)
- [ ] Stats: Total quotes, images, pairings
- [ ] Quick links to create pairing

### 5.2 Pairing Management
- [ ] `app/admin/pairings/page.tsx` - All pairings list (past + future)
- [ ] `app/admin/pairings/new/page.tsx` - Create pairing form
- [ ] `app/admin/pairings/new/actions.ts` - Create pairing Server Action
- [ ] `app/admin/pairings/[id]/page.tsx` - Edit pairing form
- [ ] `app/admin/pairings/[id]/actions.ts` - Update/delete pairing actions

### 5.3 5-Day Validation
- [ ] `src/lib/validation.ts` - 5-day rule validation function
- [ ] Query pairings in ±5 day range
- [ ] Real-time validation feedback (optional client-side preview)

### 5.4 UI Components
- [ ] Date picker component (native `<input type="date">`)
- [ ] Quote dropdown (searchable select)
- [ ] Image dropdown (with thumbnail preview)
- [ ] Validation error messages

---

## 6. Technical Approach

### 6.1 Dashboard

**File: `app/admin/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { format, addDays } from 'date-fns';

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day
  
  const sevenDaysAhead = addDays(today, 7);
  
  // Fetch stats
  const [quotesCount, imagesCount, pairingsCount] = await Promise.all([
    prisma.quote.count({ where: { active: true } }),
    prisma.image.count({ where: { active: true } }),
    prisma.pairing.count(),
  ]);
  
  // Fetch upcoming pairings (next 7 days)
  const upcomingPairings = await prisma.pairing.findMany({
    where: {
      date: {
        gte: today,
        lte: sevenDaysAhead,
      },
    },
    include: {
      quote: {
        select: {
          id: true,
          text: true,
          author: true,
        },
      },
      image: {
        select: {
          id: true,
          url: true,
          photographerName: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Daily Demotivations Content Management System
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Quotes</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{quotesCount}</div>
          <Link href="/admin/quotes" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Manage quotes →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Images</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{imagesCount}</div>
          <Link href="/admin/images" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Manage images →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Pairings</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{pairingsCount}</div>
          <Link href="/admin/pairings" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            View all →
          </Link>
        </div>
      </div>
      
      {/* Upcoming pairings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Upcoming Pairings (Next 7 Days)
          </h2>
          <Link
            href="/admin/pairings/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Create Pairing
          </Link>
        </div>
        
        <div className="divide-y divide-gray-200">
          {upcomingPairings.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No pairings scheduled for the next 7 days.
              <Link href="/admin/pairings/new" className="text-blue-600 hover:underline ml-1">
                Create one now
              </Link>
            </div>
          ) : (
            upcomingPairings.map((pairing) => (
              <div key={pairing.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Date */}
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {format(new Date(pairing.date), 'd')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(pairing.date), 'MMM yyyy')}
                    </div>
                  </div>
                  
                  {/* Image thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={pairing.image.url}
                      alt=""
                      className="w-24 h-16 object-cover rounded"
                    />
                  </div>
                  
                  {/* Quote preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {pairing.quote.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pairing.quote.author || 'Anonymous'}
                      {' • '}
                      Photo by {pairing.image.photographerName}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0">
                    <Link
                      href={`/admin/pairings/${pairing.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/quotes/new"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition text-center"
        >
          <div className="text-4xl mb-2">📝</div>
          <div className="font-medium text-gray-900">Add Quote</div>
        </Link>
        
        <Link
          href="/admin/images/new"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition text-center"
        >
          <div className="text-4xl mb-2">🖼️</div>
          <div className="font-medium text-gray-900">Add Image</div>
        </Link>
        
        <Link
          href="/admin/pairings/new"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition text-center"
        >
          <div className="text-4xl mb-2">🔗</div>
          <div className="font-medium text-gray-900">Create Pairing</div>
        </Link>
      </div>
    </div>
  );
}
```

### 6.2 5-Day Validation Logic

**File: `src/lib/validation.ts`**

```typescript
import { prisma } from './prisma';
import { format, addDays, subDays } from 'date-fns';

/**
 * Validates that a quote hasn't been used within ±5 days of target date
 * 
 * @param quoteId - ID of quote to check
 * @param targetDate - Date to assign pairing
 * @param excludePairingId - Exclude this pairing (for edit mode)
 * @returns Validation result with conflict date if invalid
 */
export async function validate5DayRule(
  quoteId: string,
  targetDate: Date,
  excludePairingId?: string
): Promise<{
  valid: boolean;
  conflictDate?: Date;
  daysSeparation?: number;
}> {
  // Calculate date range: target date ± 5 days
  const fiveDaysBefore = subDays(targetDate, 5);
  const fiveDaysAfter = addDays(targetDate, 5);
  
  // Query pairings in this range with same quote
  const conflicts = await prisma.pairing.findMany({
    where: {
      quoteId,
      date: {
        gte: fiveDaysBefore,
        lte: fiveDaysAfter,
      },
      // Exclude current pairing if editing
      ...(excludePairingId && { id: { not: excludePairingId } }),
    },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
    },
  });
  
  // Filter out the target date itself (only check OTHER dates)
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');
  const relevantConflicts = conflicts.filter((pairing) => {
    const pairingDateStr = format(new Date(pairing.date), 'yyyy-MM-dd');
    return pairingDateStr !== targetDateStr;
  });
  
  if (relevantConflicts.length > 0) {
    const conflictDate = new Date(relevantConflicts[0].date);
    
    // Calculate days separation
    const daysDiff = Math.abs(
      Math.floor((targetDate.getTime() - conflictDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    return {
      valid: false,
      conflictDate,
      daysSeparation: daysDiff,
    };
  }
  
  return { valid: true };
}

/**
 * Check if a date already has a pairing
 * 
 * @param date - Date to check
 * @param excludePairingId - Exclude this pairing (for edit mode)
 * @returns true if date is available, false if taken
 */
export async function isDateAvailable(
  date: Date,
  excludePairingId?: string
): Promise<boolean> {
  const existing = await prisma.pairing.findFirst({
    where: {
      date,
      ...(excludePairingId && { id: { not: excludePairingId } }),
    },
  });
  
  return !existing;
}
```

### 6.3 Create Pairing Form

**File: `app/admin/pairings/new/page.tsx`**

```typescript
'use client';

import { useFormState } from 'react-dom';
import { createPairingAction } from './actions';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Props {
  quotes: Array<{ id: string; text: string; author: string | null }>;
  images: Array<{ id: string; url: string; photographerName: string }>;
}

export default function NewPairingPage({ quotes, images }: Props) {
  const [state, formAction] = useFormState(createPairingAction, null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Pairing</h1>
      
      <form action={formAction} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Error message */}
        {state?.error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {state.error}
          </div>
        )}
        
        {/* Date picker */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={state?.values?.date}
          />
          <p className="mt-1 text-sm text-gray-500">
            Select the date for this quote-image pairing
          </p>
        </div>
        
        {/* Quote dropdown */}
        <div>
          <label htmlFor="quoteId" className="block text-sm font-medium text-gray-700 mb-2">
            Quote *
          </label>
          <select
            id="quoteId"
            name="quoteId"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={state?.values?.quoteId}
          >
            <option value="">Select a quote...</option>
            {quotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quote.text.substring(0, 80)}
                {quote.text.length > 80 ? '...' : ''}
                {quote.author ? ` — ${quote.author}` : ''}
              </option>
            ))}
          </select>
          {quotes.length === 0 && (
            <p className="mt-2 text-sm text-red-600">
              No quotes available. <Link href="/admin/quotes/new" className="underline">Create one first</Link>.
            </p>
          )}
        </div>
        
        {/* Image dropdown with preview */}
        <div>
          <label htmlFor="imageId" className="block text-sm font-medium text-gray-700 mb-2">
            Image *
          </label>
          <select
            id="imageId"
            name="imageId"
            required
            value={selectedImage}
            onChange={(e) => setSelectedImage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an image...</option>
            {images.map((image) => (
              <option key={image.id} value={image.id}>
                Photo by {image.photographerName}
              </option>
            ))}
          </select>
          
          {/* Image preview */}
          {selectedImage && (
            <div className="mt-3">
              {(() => {
                const image = images.find((img) => img.id === selectedImage);
                return image ? (
                  <img
                    src={image.url}
                    alt={`Photo by ${image.photographerName}`}
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : null;
              })()}
            </div>
          )}
          
          {images.length === 0 && (
            <p className="mt-2 text-sm text-red-600">
              No images available. <Link href="/admin/images/new" className="underline">Add one first</Link>.
            </p>
          )}
        </div>
        
        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={quotes.length === 0 || images.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Pairing
          </button>
          <Link
            href="/admin/pairings"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

// Fetch quotes and images on server
export async function generateStaticParams() {
  return [];
}

// Server component wrapper
import { prisma } from '@/lib/prisma';

export default async function NewPairingPageWrapper() {
  const [quotes, images] = await Promise.all([
    prisma.quote.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for dropdown performance
      select: {
        id: true,
        text: true,
        author: true,
      },
    }),
    prisma.image.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        url: true,
        photographerName: true,
      },
    }),
  ]);
  
  return <NewPairingPage quotes={quotes} images={images} />;
}
```

**Note:** The above needs refactoring - split into Server Component wrapper and Client Component form.

**File: `app/admin/pairings/new/PairingForm.tsx`** (Client Component)

```typescript
'use client';

import { useFormState } from 'react-dom';
import { createPairingAction } from './actions';
import Link from 'next/link';
import { useState } from 'react';

export function PairingForm({ quotes, images }: Props) {
  // Implementation from above, extracted as client component
  // ...
}
```

**File: `app/admin/pairings/new/page.tsx`** (Server Component)

```typescript
import { prisma } from '@/lib/prisma';
import { PairingForm } from './PairingForm';

export default async function NewPairingPage() {
  const [quotes, images] = await Promise.all([
    prisma.quote.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, text: true, author: true },
    }),
    prisma.image.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, url: true, photographerName: true },
    }),
  ]);
  
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Pairing</h1>
      <PairingForm quotes={quotes} images={images} />
    </div>
  );
}
```

### 6.4 Create Pairing Server Action

**File: `app/admin/pairings/new/actions.ts`**

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { validate5DayRule, isDateAvailable } from '@/lib/validation';
import { format } from 'date-fns';

type ActionState = {
  error?: string;
  values?: {
    date: string;
    quoteId: string;
    imageId: string;
  };
};

/**
 * Create new pairing with 5-day validation
 */
export async function createPairingAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const dateStr = formData.get('date') as string;
  const quoteId = formData.get('quoteId') as string;
  const imageId = formData.get('imageId') as string;
  
  // Validation: Required fields
  if (!dateStr || !quoteId || !imageId) {
    return {
      error: 'All fields are required',
      values: { date: dateStr, quoteId, imageId },
    };
  }
  
  // Parse date (YYYY-MM-DD format from input[type="date"])
  const targetDate = new Date(dateStr + 'T00:00:00.000Z'); // Force UTC
  
  // Validation: Date in past (warn but allow)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (targetDate < today) {
    // Optional warning, but allow (admin might be backfilling)
    console.warn(`Pairing created for past date: ${dateStr}`);
  }
  
  // Validation: Date already taken
  const available = await isDateAvailable(targetDate);
  if (!available) {
    return {
      error: `Date ${format(targetDate, 'MMM d, yyyy')} already has a pairing. Edit the existing pairing instead.`,
      values: { date: dateStr, quoteId, imageId },
    };
  }
  
  // Validation: 5-day rule (CRITICAL!)
  const validation = await validate5DayRule(quoteId, targetDate);
  
  if (!validation.valid) {
    const conflictDateFormatted = format(validation.conflictDate!, 'MMM d, yyyy');
    return {
      error: `This quote was used on ${conflictDateFormatted} (${validation.daysSeparation} days away). Please choose a different quote or date (5-day separation required).`,
      values: { date: dateStr, quoteId, imageId },
    };
  }
  
  // Create pairing
  try {
    await prisma.pairing.create({
      data: {
        quoteId,
        imageId,
        date: targetDate,
      },
    });
    
    revalidatePath('/admin/pairings');
    revalidatePath('/admin'); // Revalidate dashboard
    redirect('/admin/pairings');
  } catch (error) {
    console.error('Failed to create pairing:', error);
    return {
      error: 'Failed to create pairing. Please try again.',
      values: { date: dateStr, quoteId, imageId },
    };
  }
}
```

### 6.5 Pairings List

**File: `app/admin/pairings/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';

interface Props {
  searchParams: { filter?: 'upcoming' | 'past' | 'all' };
}

export default async function PairingsPage({ searchParams }: Props) {
  const filter = searchParams.filter || 'upcoming';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Build where clause based on filter
  const whereClause =
    filter === 'upcoming'
      ? { date: { gte: today } }
      : filter === 'past'
      ? { date: { lt: today } }
      : {}; // all
  
  const pairings = await prisma.pairing.findMany({
    where: whereClause,
    include: {
      quote: {
        select: { id: true, text: true, author: true },
      },
      image: {
        select: { id: true, url: true, photographerName: true },
      },
    },
    orderBy: { date: filter === 'past' ? 'desc' : 'asc' },
    take: 50, // Limit for performance
  });
  
  return (
    <div>
      {/* Header with filters */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pairings</h1>
          <div className="flex gap-2 mt-2">
            <Link
              href="/admin/pairings?filter=upcoming"
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upcoming
            </Link>
            <Link
              href="/admin/pairings?filter=past"
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Past
            </Link>
            <Link
              href="/admin/pairings?filter=all"
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </Link>
          </div>
        </div>
        
        <Link
          href="/admin/pairings/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Pairing
        </Link>
      </div>
      
      {/* Pairings list */}
      <div className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
        {pairings.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No pairings found for "{filter}" filter.
          </div>
        ) : (
          pairings.map((pairing) => (
            <div key={pairing.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                {/* Date */}
                <div className="flex-shrink-0 w-20 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {format(new Date(pairing.date), 'd')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(pairing.date), 'MMM yyyy')}
                  </div>
                </div>
                
                {/* Image thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={pairing.image.url}
                    alt=""
                    className="w-24 h-16 object-cover rounded"
                  />
                </div>
                
                {/* Quote */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {pairing.quote.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pairing.quote.author || 'Anonymous'}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2">
                  <Link
                    href={`/admin/pairings/${pairing.id}`}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### 6.6 Edit/Delete Pairing

**File: `app/admin/pairings/[id]/actions.ts`**

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { validate5DayRule, isDateAvailable } from '@/lib/validation';

/**
 * Update existing pairing
 */
export async function updatePairingAction(
  prevState: any,
  formData: FormData
) {
  const id = formData.get('id') as string;
  const dateStr = formData.get('date') as string;
  const quoteId = formData.get('quoteId') as string;
  const imageId = formData.get('imageId') as string;
  
  const targetDate = new Date(dateStr + 'T00:00:00.000Z');
  
  // Validate date available (excluding current pairing)
  const available = await isDateAvailable(targetDate, id);
  if (!available) {
    return { error: 'Date already taken by another pairing' };
  }
  
  // Validate 5-day rule (excluding current pairing)
  const validation = await validate5DayRule(quoteId, targetDate, id);
  if (!validation.valid) {
    return {
      error: `Quote used on ${format(validation.conflictDate!, 'MMM d, yyyy')} (${validation.daysSeparation} days away)`,
    };
  }
  
  // Update
  try {
    await prisma.pairing.update({
      where: { id },
      data: { quoteId, imageId, date: targetDate },
    });
    
    revalidatePath('/admin/pairings');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update pairing' };
  }
}

/**
 * Delete pairing
 */
export async function deletePairingAction(formData: FormData) {
  const id = formData.get('id') as string;
  
  try {
    await prisma.pairing.delete({ where: { id } });
    revalidatePath('/admin/pairings');
    revalidatePath('/admin');
    redirect('/admin/pairings');
  } catch (error) {
    throw new Error('Failed to delete pairing');
  }
}
```

---

## 7. Testing Checklist

### 7.1 Dashboard
- [ ] Dashboard shows stats (quotes, images, pairings count)
- [ ] Upcoming pairings (next 7 days) display correctly
- [ ] Empty state shows when no upcoming pairings
- [ ] Quick action links work

### 7.2 Create Pairing
- [ ] Form loads with quote/image dropdowns populated
- [ ] Date picker allows selecting future dates
- [ ] Image preview updates when selected
- [ ] Submit with valid data creates pairing
- [ ] Validation: Empty fields blocked
- [ ] Validation: Duplicate date blocked

### 7.3 5-Day Validation
- [ ] Create pairing for Feb 1 with Quote A
- [ ] Try Feb 3 with Quote A → blocked (2 days apart)
- [ ] Try Feb 7 with Quote A → allowed (6 days apart)
- [ ] Try Feb 1 again with Quote A → blocked (exact same date)
- [ ] Error message shows conflict date and days separation

### 7.4 Edge Cases
- [ ] Pairing on Jan 1 → validate against Dec 27 prev year
- [ ] Pairing on Feb 29 (leap year) → handles correctly
- [ ] Edit pairing date → revalidates 5-day rule
- [ ] Edit pairing quote → revalidates 5-day rule
- [ ] Delete pairing → allows creating new pairing for that date

### 7.5 List Views
- [ ] Upcoming filter shows future dates (ascending)
- [ ] Past filter shows past dates (descending)
- [ ] All filter shows all dates
- [ ] Empty states display correctly

### 7.6 Performance
- [ ] Dashboard loads < 200ms
- [ ] Create form loads < 100ms (100 quotes/images)
- [ ] 5-day validation query < 50ms
- [ ] List view with 50 pairings < 100ms

---

## 8. Risks

### 8.1 5-Day Rule Complexity

**Risk:** Date calculations have bugs (timezone, off-by-one)  
**Likelihood:** Medium  
**Impact:** Medium (wrong validation)  

**Mitigation:**
- Use `date-fns` for date math (battle-tested)
- Store dates as UTC `@db.Date` (no time component)
- Test edge cases (month boundaries, leap years)
- Manual verification in Prisma Studio

### 8.2 Dropdown Performance with Many Items

**Risk:** 1000+ quotes make dropdown unusable  
**Likelihood:** Low (personal site, curated content)  
**Impact:** Low (admin UX slower)  

**Mitigation:**
- Limit to 100 most recent items (`take: 100`)
- Add search/filter in future if needed
- Consider autocomplete component for 500+ items

### 8.3 Date Timezone Confusion

**Risk:** Admin in different timezone creates wrong date  
**Likelihood:** Medium  
**Impact:** Medium (wrong quote shown)  

**Mitigation:**
- Use UTC dates everywhere (`@db.Date`)
- `input[type="date"]` returns YYYY-MM-DD string
- Force UTC: `new Date(dateStr + 'T00:00:00.000Z')`
- Display dates in admin's local timezone (browser handles this)

### 8.4 Cascade Delete Side Effects

**Risk:** Delete quote/image breaks pairings silently  
**Likelihood:** Low (warnings in Plan 03)  
**Impact:** Low (admin aware)  

**Mitigation:**
- Warnings in quote/image delete (Plan 03)
- Cascade delete is intentional (clean up orphans)
- Can always re-create pairing if needed

---

## 9. Rollback

### 9.1 Code Rollback

**If pairing system breaks:**

```bash
# Remove pairing routes
rm -rf app/admin/pairings
rm src/lib/validation.ts

# Update dashboard to remove pairings section
git checkout HEAD~1 -- app/admin/page.tsx

# Deploy
vercel --prod
```

### 9.2 Database Rollback

**If bad pairings created:**

```sql
-- Delete all pairings
DELETE FROM pairings;

-- Or delete specific date range
DELETE FROM pairings WHERE date >= '2025-02-01' AND date <= '2025-02-28';
```

### 9.3 Disable 5-Day Validation Temporarily

**Emergency bypass (use with caution):**

```typescript
// src/lib/validation.ts
export async function validate5DayRule(...) {
  // TODO: Re-enable validation after testing
  return { valid: true };
}
```

---

## 10. Success Criteria

✅ Plan is complete when:

1. **Dashboard Works**
   - Shows stats (quotes, images, pairings)
   - Lists upcoming pairings (next 7 days)
   - Quick links functional

2. **Pairing CRUD**
   - Create pairing with quote + image + date
   - Edit existing pairing
   - Delete pairing
   - List all pairings (past/upcoming/all filters)

3. **5-Day Validation**
   - Enforced on create
   - Enforced on edit
   - Shows clear error messages with conflict date
   - Calculates days separation correctly

4. **Date Management**
   - One pairing per date (unique constraint)
   - Duplicate date blocked with clear error
   - UTC dates stored correctly
   - No timezone bugs

5. **User Experience**
   - Form dropdowns populated
   - Image preview on select
   - Error messages helpful
   - Success redirects to list

---

## 11. Next Steps

After completing this plan:

→ **Plan 05: Frontend Integration & Deployment**
- Update `getTodaysQuote()` to use database
- Implement graceful fallback to hardcoded quotes
- Add feature flag for gradual rollout
- Deploy to production with monitoring

Pairing system is now complete, ready to drive the frontend display.

---

## 12. Testing Script

Manual testing workflow:

```bash
# 1. Create test data
# - Add 3 quotes (Plan 03)
# - Add 2 images (Plan 03)

# 2. Create pairings
# - Feb 10: Quote 1 + Image 1 → Success
# - Feb 12: Quote 1 + Image 2 → Blocked (2 days apart)
# - Feb 16: Quote 1 + Image 2 → Success (6 days apart)
# - Feb 10: Quote 2 + Image 1 → Blocked (duplicate date)

# 3. Edit pairing
# - Change Feb 10 to Feb 11 → Success
# - Change Feb 11 to Feb 16 → Blocked (Quote 1 already on Feb 16)

# 4. Delete pairing
# - Delete Feb 16 → Success
# - Verify Feb 11 can now move to Feb 16

# 5. Check dashboard
# - Verify stats correct
# - Verify upcoming pairings show

# 6. Check list filters
# - Upcoming: Shows future dates
# - Past: Shows past dates (if any)
# - All: Shows all dates
```

---

**Estimated Completion:** 9 hours  
**Blockers:** Requires Plans 01, 02, 03 (database, auth, quotes/images)  
**Dependencies for Next Plan:** Pairings must exist before frontend integration
