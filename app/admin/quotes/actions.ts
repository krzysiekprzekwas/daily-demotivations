'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

/**
 * Server Actions for Quote CRUD operations
 * All actions require authentication via requireAuth()
 */

export type ActionResult = 
  | { success: true; message?: string }
  | { success: false; error: string };

/**
 * Create a new quote
 * Includes duplicate detection (exact text match)
 */
export async function createQuote(formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth(true);

    const text = formData.get('text') as string;
    const author = formData.get('author') as string || null;

    // Validation
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Quote text is required' };
    }

    if (text.length > 500) {
      return { success: false, error: 'Quote text must be 500 characters or less' };
    }

    // Duplicate detection (exact text match, case-insensitive)
    const existing = await prisma.quote.findFirst({
      where: {
        text: {
          equals: text.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'A quote with this exact text already exists',
      };
    }

    // Create quote
    await prisma.quote.create({
      data: {
        text: text.trim(),
        author: author?.trim() || null,
        active: true,
      },
    });

    revalidatePath('/admin/quotes');
    revalidatePath('/admin/dashboard');

    return { success: true, message: 'Quote created successfully' };
  } catch (error) {
    console.error('Error creating quote:', error);
    return { success: false, error: 'Failed to create quote' };
  }
}

/**
 * Update an existing quote
 */
export async function updateQuote(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAuth(true);

    const text = formData.get('text') as string;
    const author = formData.get('author') as string || null;

    // Validation
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Quote text is required' };
    }

    if (text.length > 500) {
      return { success: false, error: 'Quote text must be 500 characters or less' };
    }

    // Check if quote exists
    const existing = await prisma.quote.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: 'Quote not found' };
    }

    // Duplicate detection (excluding current quote)
    const duplicate = await prisma.quote.findFirst({
      where: {
        id: { not: id },
        text: {
          equals: text.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: 'A quote with this exact text already exists',
      };
    }

    // Update quote
    await prisma.quote.update({
      where: { id },
      data: {
        text: text.trim(),
        author: author?.trim() || null,
      },
    });

    revalidatePath('/admin/quotes');
    revalidatePath('/admin/dashboard');

    return { success: true, message: 'Quote updated successfully' };
  } catch (error) {
    console.error('Error updating quote:', error);
    return { success: false, error: 'Failed to update quote' };
  }
}

/**
 * Delete a quote
 * Shows cascade warning if quote is used in pairings
 */
export async function deleteQuote(id: string): Promise<ActionResult> {
  try {
    await requireAuth(true);

    // Check if quote exists and count pairings
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pairings: true },
        },
      },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Cascade warning if used in pairings
    if (quote._count.pairings > 0) {
      return {
        success: false,
        error: `Cannot delete: This quote is used in ${quote._count.pairings} pairing(s). Delete the pairings first.`,
      };
    }

    // Delete quote
    await prisma.quote.delete({
      where: { id },
    });

    revalidatePath('/admin/quotes');
    revalidatePath('/admin/dashboard');

    return { success: true, message: 'Quote deleted successfully' };
  } catch (error) {
    console.error('Error deleting quote:', error);
    return { success: false, error: 'Failed to delete quote' };
  }
}

/**
 * Toggle quote active status
 */
export async function toggleQuoteActive(id: string): Promise<ActionResult> {
  try {
    await requireAuth(true);

    const quote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    await prisma.quote.update({
      where: { id },
      data: {
        active: !quote.active,
      },
    });

    revalidatePath('/admin/quotes');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      message: quote.active ? 'Quote deactivated' : 'Quote activated',
    };
  } catch (error) {
    console.error('Error toggling quote active:', error);
    return { success: false, error: 'Failed to toggle quote status' };
  }
}
