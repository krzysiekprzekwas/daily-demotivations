# Execution Plan 03: Admin CRUD - Quotes & Images

**Phase:** V2 Phase 1 - Content Management System  
**Plan:** 03 of 05  
**Status:** Ready for Execution  
**Date:** 2025-02-03

---

## 1. Goal

Build admin interface for managing quotes and images with full CRUD operations (Create, Read, Update, Delete). Implement Server Actions for data mutations, add exact duplicate detection for quotes, and provide Unsplash URL hints for image input.

---

## 2. Requirements Covered

- **CMS-01:** Admin CRUD for quotes
- **CMS-02:** Admin CRUD for images (URL input)
- **CMS-08:** Image URL hints for Unsplash
- **DATA-01:** Duplicate quote prevention (exact match)

---

## 3. Dependencies

**Prerequisites:**
- ✅ Plan 01 completed (database schema, Prisma client)
- ✅ Plan 02 completed (authentication, protected routes)
- ✅ Admin can access `/admin/*` routes

**External Dependencies:**
- Prisma Client for database operations
- Next.js Server Actions
- React `useFormState` hook for error display

---

## 4. Estimated Time

- **Quotes List:** 1 hour (table view, pagination)
- **Quotes Create/Edit:** 1.5 hours (forms, validation, duplicate detection)
- **Quotes Delete:** 30 minutes (delete action, cascade warnings)
- **Images List:** 1 hour (table view with thumbnails)
- **Images Create/Edit:** 1.5 hours (forms, URL validation, Unsplash hints)
- **Images Delete:** 30 minutes (delete action, cascade warnings)
- **Testing:** 1.5 hours (all CRUD operations, edge cases)
- **Total:** 7.5 hours

---

## 5. Deliverables

### 5.1 Quotes Management
- [ ] `app/admin/quotes/page.tsx` - Quotes list with pagination
- [ ] `app/admin/quotes/new/page.tsx` - New quote form
- [ ] `app/admin/quotes/new/actions.ts` - Create quote Server Action
- [ ] `app/admin/quotes/[id]/page.tsx` - Edit quote form
- [ ] `app/admin/quotes/[id]/actions.ts` - Update/delete quote Server Actions

### 5.2 Images Management
- [ ] `app/admin/images/page.tsx` - Images list with thumbnails
- [ ] `app/admin/images/new/page.tsx` - New image form with URL hints
- [ ] `app/admin/images/new/actions.ts` - Create image Server Action
- [ ] `app/admin/images/[id]/page.tsx` - Edit image form
- [ ] `app/admin/images/[id]/actions.ts` - Update/delete image Server Actions

### 5.3 Validation Logic
- [ ] `src/lib/validation.ts` - Duplicate detection utilities
- [ ] Exact text match for quotes (case-insensitive, trimmed)
- [ ] URL format validation for images (optional)

### 5.4 UI Components
- [ ] Pagination component (reusable)
- [ ] Delete confirmation pattern
- [ ] Success/error toast notifications (simple)

---

## 6. Technical Approach

### 6.1 Quotes List Page

**File: `app/admin/quotes/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DeleteQuoteButton } from './DeleteQuoteButton';

interface Props {
  searchParams: { page?: string };
}

export default async function QuotesPage({ searchParams }: Props) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  
  // Fetch quotes with pagination
  const [quotes, totalCount] = await Promise.all([
    prisma.quote.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        _count: {
          select: { pairings: true },
        },
      },
    }),
    prisma.quote.count({ where: { active: true } }),
  ]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Quotes ({totalCount} total)
        </h1>
        <Link
          href="/admin/quotes/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Add New Quote
        </Link>
      </div>
      
      {/* Quotes table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quote
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pairings
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No quotes found. Add your first quote!
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {quote.text}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {quote.author || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {quote._count.pairings} date(s)
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <DeleteQuoteButton
                      quoteId={quote.id}
                      pairingsCount={quote._count.pairings}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}`}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

### 6.2 Create Quote Form

**File: `app/admin/quotes/new/page.tsx`**

```typescript
'use client';

import { useFormState } from 'react-dom';
import { createQuoteAction } from './actions';
import Link from 'next/link';

export default function NewQuotePage() {
  const [state, formAction] = useFormState(createQuoteAction, null);
  
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Quote</h1>
      
      <form action={formAction} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Error message */}
        {state?.error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {state.error}
          </div>
        )}
        
        {/* Success message */}
        {state?.success && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            Quote created successfully!
          </div>
        )}
        
        {/* Quote text */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Quote Text *
          </label>
          <textarea
            id="text"
            name="text"
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your daily motivation: It probably won't work anyway."
            defaultValue={state?.values?.text}
          />
          <p className="mt-1 text-sm text-gray-500">
            The demotivational quote text. Be creative!
          </p>
        </div>
        
        {/* Author */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
            Author (optional)
          </label>
          <input
            type="text"
            id="author"
            name="author"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Anonymous"
            defaultValue={state?.values?.author}
          />
          <p className="mt-1 text-sm text-gray-500">
            Leave blank for "Anonymous"
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Quote
          </button>
          <Link
            href="/admin/quotes"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

**File: `app/admin/quotes/new/actions.ts`**

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type ActionState = {
  error?: string;
  success?: boolean;
  values?: { text: string; author: string };
};

/**
 * Create new quote
 * Validates input and checks for exact duplicates
 */
export async function createQuoteAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const text = formData.get('text') as string;
  const author = formData.get('author') as string | null;
  
  // Validation: Required text
  if (!text || text.trim().length === 0) {
    return {
      error: 'Quote text is required',
      values: { text, author: author || '' },
    };
  }
  
  // Validation: Maximum length (reasonable limit)
  if (text.trim().length > 500) {
    return {
      error: 'Quote text is too long (max 500 characters)',
      values: { text, author: author || '' },
    };
  }
  
  // Check for exact duplicate (case-insensitive, trimmed)
  const normalizedText = text.trim().toLowerCase();
  const existing = await prisma.quote.findFirst({
    where: {
      text: {
        equals: text.trim(),
        mode: 'insensitive', // Case-insensitive search
      },
    },
  });
  
  if (existing) {
    return {
      error: 'This quote already exists in the database',
      values: { text, author: author || '' },
    };
  }
  
  // Create quote
  try {
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
  } catch (error) {
    console.error('Failed to create quote:', error);
    return {
      error: 'Failed to create quote. Please try again.',
      values: { text, author: author || '' },
    };
  }
}
```

### 6.3 Edit Quote Form

**File: `app/admin/quotes/[id]/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditQuoteForm } from './EditQuoteForm';

interface Props {
  params: { id: string };
}

export default async function EditQuotePage({ params }: Props) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { pairings: true },
      },
    },
  });
  
  if (!quote) {
    notFound();
  }
  
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Quote</h1>
      
      {quote._count.pairings > 0 && (
        <p className="text-sm text-yellow-600 mb-6">
          ⚠️ This quote is paired with {quote._count.pairings} date(s). 
          Editing will update all pairings.
        </p>
      )}
      
      <EditQuoteForm quote={quote} />
    </div>
  );
}
```

**File: `app/admin/quotes/[id]/EditQuoteForm.tsx`**

```typescript
'use client';

import { useFormState } from 'react-dom';
import { updateQuoteAction, deleteQuoteAction } from './actions';
import Link from 'next/link';
import { useState } from 'react';
import type { Quote } from '@prisma/client';

export function EditQuoteForm({ quote }: { quote: Quote & { _count: { pairings: number } } }) {
  const [state, formAction] = useFormState(updateQuoteAction, null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Edit form */}
      <form action={formAction} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <input type="hidden" name="id" value={quote.id} />
        
        {/* Error/Success messages */}
        {state?.error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            Quote updated successfully!
          </div>
        )}
        
        {/* Quote text */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Quote Text *
          </label>
          <textarea
            id="text"
            name="text"
            required
            rows={4}
            defaultValue={quote.text}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Author */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
            Author (optional)
          </label>
          <input
            type="text"
            id="author"
            name="author"
            defaultValue={quote.author || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Update Quote
          </button>
          <Link
            href="/admin/quotes"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
      
      {/* Delete section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-700 mb-4">
          Deleting this quote is permanent and cannot be undone.
          {quote._count.pairings > 0 && (
            <> It will also unpair {quote._count.pairings} date(s).</>
          )}
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Delete Quote
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-red-900">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <form action={deleteQuoteAction}>
                <input type="hidden" name="id" value={quote.id} />
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Yes, Delete Permanently
                </button>
              </form>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**File: `app/admin/quotes/[id]/actions.ts`**

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type ActionState = {
  error?: string;
  success?: boolean;
};

/**
 * Update existing quote
 */
export async function updateQuoteAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  const text = formData.get('text') as string;
  const author = formData.get('author') as string | null;
  
  // Validation
  if (!text || text.trim().length === 0) {
    return { error: 'Quote text is required' };
  }
  
  if (text.trim().length > 500) {
    return { error: 'Quote text is too long (max 500 characters)' };
  }
  
  // Check for duplicate (excluding current quote)
  const existing = await prisma.quote.findFirst({
    where: {
      text: {
        equals: text.trim(),
        mode: 'insensitive',
      },
      id: { not: id },
    },
  });
  
  if (existing) {
    return { error: 'This quote already exists in the database' };
  }
  
  // Update quote
  try {
    await prisma.quote.update({
      where: { id },
      data: {
        text: text.trim(),
        author: author?.trim() || null,
      },
    });
    
    revalidatePath('/admin/quotes');
    revalidatePath(`/admin/quotes/${id}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update quote:', error);
    return { error: 'Failed to update quote. Please try again.' };
  }
}

/**
 * Delete quote (cascades to pairings)
 */
export async function deleteQuoteAction(formData: FormData) {
  const id = formData.get('id') as string;
  
  try {
    await prisma.quote.delete({
      where: { id },
    });
    
    revalidatePath('/admin/quotes');
    redirect('/admin/quotes');
  } catch (error) {
    console.error('Failed to delete quote:', error);
    throw new Error('Failed to delete quote');
  }
}
```

### 6.4 Images Management (Similar Pattern)

**File: `app/admin/images/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  searchParams: { page?: string };
}

export default async function ImagesPage({ searchParams }: Props) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  
  const [images, totalCount] = await Promise.all([
    prisma.image.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        _count: {
          select: { pairings: true },
        },
      },
    }),
    prisma.image.count({ where: { active: true } }),
  ]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Images ({totalCount} total)
        </h1>
        <Link
          href="/admin/images/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Image
        </Link>
      </div>
      
      {/* Images grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Thumbnail */}
            <div className="relative h-48 bg-gray-200">
              <img
                src={image.url}
                alt={`Photo by ${image.photographerName}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Info */}
            <div className="p-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Photo by:</span> {image.photographerName}
              </p>
              <p className="text-sm text-gray-500">
                {image._count.pairings} pairing(s)
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/admin/images/${image.id}`}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  Edit
                </Link>
                {/* Delete button similar to quotes */}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination (same as quotes) */}
    </div>
  );
}
```

**File: `app/admin/images/new/page.tsx`**

```typescript
'use client';

import { useFormState } from 'react-dom';
import { createImageAction } from './actions';
import Link from 'next/link';

export default function NewImagePage() {
  const [state, formAction] = useFormState(createImageAction, null);
  
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Image</h1>
      
      {/* Unsplash hints */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="font-semibold text-blue-900 mb-2">💡 Unsplash Tips</h2>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Search for landscape photos: <a href="https://unsplash.com/s/photos/landscape" target="_blank" rel="noopener" className="underline">unsplash.com/s/photos/landscape</a></li>
          <li>Copy the full image URL (right-click → Copy Image Address)</li>
          <li>Include photographer name and profile URL for attribution</li>
          <li>Recommend landscape photos (16:9 or wider) for best display</li>
        </ul>
      </div>
      
      <form action={formAction} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {state?.error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {state.error}
          </div>
        )}
        
        {/* Image URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Image URL *
          </label>
          <input
            type="url"
            id="url"
            name="url"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://images.unsplash.com/photo-..."
            defaultValue={state?.values?.url}
          />
          <p className="mt-1 text-sm text-gray-500">
            Full URL to landscape image (Unsplash recommended)
          </p>
        </div>
        
        {/* Photographer name */}
        <div>
          <label htmlFor="photographerName" className="block text-sm font-medium text-gray-700 mb-2">
            Photographer Name *
          </label>
          <input
            type="text"
            id="photographerName"
            name="photographerName"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jane Doe"
            defaultValue={state?.values?.photographerName}
          />
        </div>
        
        {/* Photographer URL */}
        <div>
          <label htmlFor="photographerUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Photographer URL (optional)
          </label>
          <input
            type="url"
            id="photographerUrl"
            name="photographerUrl"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://unsplash.com/@photographer"
            defaultValue={state?.values?.photographerUrl}
          />
        </div>
        
        {/* Source */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
            Source
          </label>
          <select
            id="source"
            name="source"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={state?.values?.source || 'unsplash'}
          >
            <option value="unsplash">Unsplash</option>
            <option value="pexels">Pexels</option>
            <option value="custom">Custom/Other</option>
          </select>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Add Image
          </button>
          <Link
            href="/admin/images"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

**File: `app/admin/images/new/actions.ts`**

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type ActionState = {
  error?: string;
  values?: {
    url: string;
    photographerName: string;
    photographerUrl: string;
    source: string;
  };
};

/**
 * Create new image
 * Note: URL validation skipped per decision (trust admin input)
 */
export async function createImageAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const url = formData.get('url') as string;
  const photographerName = formData.get('photographerName') as string;
  const photographerUrl = formData.get('photographerUrl') as string | null;
  const source = formData.get('source') as string;
  
  // Validation
  if (!url || url.trim().length === 0) {
    return {
      error: 'Image URL is required',
      values: { url, photographerName, photographerUrl: photographerUrl || '', source },
    };
  }
  
  if (!photographerName || photographerName.trim().length === 0) {
    return {
      error: 'Photographer name is required',
      values: { url, photographerName, photographerUrl: photographerUrl || '', source },
    };
  }
  
  // Basic URL format check (optional, but helpful)
  try {
    new URL(url);
  } catch {
    return {
      error: 'Invalid URL format',
      values: { url, photographerName, photographerUrl: photographerUrl || '', source },
    };
  }
  
  // Create image
  try {
    await prisma.image.create({
      data: {
        url: url.trim(),
        photographerName: photographerName.trim(),
        photographerUrl: photographerUrl?.trim() || null,
        source: source || 'unsplash',
        active: true,
      },
    });
    
    revalidatePath('/admin/images');
    redirect('/admin/images');
  } catch (error) {
    console.error('Failed to create image:', error);
    return {
      error: 'Failed to create image. Please try again.',
      values: { url, photographerName, photographerUrl: photographerUrl || '', source },
    };
  }
}
```

---

## 7. Testing Checklist

### 7.1 Quotes CRUD
- [ ] Navigate to `/admin/quotes` → shows list of quotes
- [ ] Click "Add New Quote" → renders form
- [ ] Submit empty form → shows "Quote text is required"
- [ ] Submit valid quote → creates and redirects to list
- [ ] Create duplicate quote → shows "Quote already exists"
- [ ] Edit quote → updates successfully
- [ ] Edit to duplicate text → blocks with error
- [ ] Delete quote with no pairings → deletes successfully
- [ ] Delete quote with pairings → shows warning, cascades delete
- [ ] Pagination works (if > 20 quotes)

### 7.2 Images CRUD
- [ ] Navigate to `/admin/images` → shows grid of images
- [ ] Click "Add New Image" → renders form with Unsplash hints
- [ ] Submit invalid URL → shows "Invalid URL format"
- [ ] Submit without photographer → shows error
- [ ] Submit valid image → creates and redirects
- [ ] Image thumbnail displays correctly
- [ ] Edit image → updates successfully
- [ ] Delete image → deletes successfully (cascade warning if paired)

### 7.3 Duplicate Detection
- [ ] Create quote "Test quote" → success
- [ ] Create quote "test quote" (lowercase) → blocked (case-insensitive)
- [ ] Create quote " Test quote " (with spaces) → blocked (trimmed)
- [ ] Create quote "Test quote 2" → success (different text)

### 7.4 Validation
- [ ] Quote > 500 chars → error
- [ ] Quote with only spaces → error
- [ ] Image URL with spaces → trimmed automatically
- [ ] Missing required fields → inline errors

### 7.5 UI/UX
- [ ] Form errors persist after submission
- [ ] Form values retained on error (not cleared)
- [ ] Success message shows after create/update
- [ ] Loading state on submit button
- [ ] Cancel button returns to list
- [ ] Pairing count shows in list

### 7.6 Performance
- [ ] Quotes list loads < 100ms (20 items)
- [ ] Create quote < 200ms
- [ ] Pagination fast (no full table scan)
- [ ] Image thumbnails load progressively

---

## 8. Risks

### 8.1 Duplicate Detection False Positives

**Risk:** Case-insensitive match blocks legitimate variations  
**Likelihood:** Low  
**Impact:** Low (admin can manually adjust)  

**Example:**
- "Dream big" vs "Dream Big" → Blocked (correct)
- "Dream big." vs "Dream big!" → Blocked (edge case)

**Mitigation:**
- Use exact text match only (per decision)
- No fuzzy matching (simple algorithm)
- Admin can edit punctuation if needed

### 8.2 Image URLs Break Over Time

**Risk:** External image URLs become invalid (404)  
**Likelihood:** Medium  
**Impact:** Low (fallback to Unsplash)  

**Mitigation:**
- Unsplash URLs are stable (don't expire)
- Frontend has fallback to random Unsplash (Plan 05)
- No URL validation on save (per decision - trust admin)

### 8.3 Large Text Input Performance

**Risk:** Quote with 10,000 characters causes DB issues  
**Likelihood:** Low (admin controlled)  
**Impact:** Low (validation blocks it)  

**Mitigation:**
- 500 character limit enforced
- Database uses `@db.Text` (supports unlimited)
- Frontend textarea not unlimited

### 8.4 Cascade Delete Accidents

**Risk:** Admin deletes quote, loses all pairings  
**Likelihood:** Medium  
**Impact:** Medium (data loss)  

**Mitigation:**
- Show warning: "X pairings will be unpaired"
- Require confirmation click
- Soft delete option (active flag) can restore
- Future: Add "Are you REALLY sure?" for quotes with many pairings

### 8.5 Pagination Performance Degradation

**Risk:** With 1000s of quotes, pagination slows down  
**Likelihood:** Low (personal site, not high volume)  
**Impact:** Low  

**Mitigation:**
- Index on `createdAt DESC` (already in schema)
- Use `skip/take` (efficient with indexes)
- Consider cursor-based pagination if needed

---

## 9. Rollback

### 9.1 Code Rollback

**If CRUD UI breaks:**

```bash
# Remove admin CRUD routes
rm -rf app/admin/quotes
rm -rf app/admin/images

# Keep database and auth (they're independent)
git checkout HEAD~1 -- app/admin/
vercel --prod
```

### 9.2 Database Rollback

**If bad data created:**

```sql
-- Reset all quotes to initial seed
DELETE FROM pairings; -- Remove pairings first (foreign key)
DELETE FROM quotes WHERE created_at > '2025-02-03';
DELETE FROM images;

-- Re-seed from backup
-- Run seed script again: npm run db:seed
```

### 9.3 Partial Rollback

**Keep quotes, remove images:**
```bash
rm -rf app/admin/images
# Quotes still work independently
```

**Keep images, remove quotes:**
```bash
rm -rf app/admin/quotes
# Images still work independently
```

---

## 10. Success Criteria

✅ Plan is complete when:

1. **Quotes Management**
   - CRUD operations work (Create, Read, Update, Delete)
   - List shows pagination for 20+ quotes
   - Exact duplicate detection prevents duplicates
   - Cascade delete warning shows pairing count

2. **Images Management**
   - CRUD operations work for images
   - Grid view displays thumbnails
   - Unsplash hints visible on create form
   - Attribution fields required

3. **Validation**
   - Required fields enforced
   - Character limits enforced (500 chars)
   - URL format validation (basic)
   - Case-insensitive duplicate check works

4. **User Experience**
   - Error messages clear and helpful
   - Form values retained on error
   - Success messages after mutations
   - Cancel buttons work

5. **Performance**
   - List pages load < 100ms
   - Mutations complete < 200ms
   - Pagination efficient
   - No N+1 queries

---

## 11. Next Steps

After completing this plan:

→ **Plan 04: Pairing System & 5-Day Validation**
- Build pairing creation UI (date picker, quote/image dropdowns)
- Implement 5-day repetition validation
- Create dashboard with upcoming pairings
- Add cascade delete warnings for pairings

Quotes and images are now manageable, ready to be paired with dates.

---

## 12. Code Quality Checklist

Before marking complete:

- [ ] All Server Actions have proper error handling
- [ ] TypeScript types for all form states
- [ ] Prisma queries use `select` to limit fields
- [ ] `revalidatePath` called after mutations
- [ ] No hardcoded IDs in code
- [ ] Console.error logs for debugging
- [ ] Loading states on submit buttons
- [ ] Accessible form labels

---

**Estimated Completion:** 7.5 hours  
**Blockers:** Requires Plan 01 (database) and Plan 02 (auth)  
**Dependencies for Next Plan:** Quotes and images must exist before pairing them
