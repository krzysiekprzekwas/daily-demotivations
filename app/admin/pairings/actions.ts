'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

/**
 * Server Actions for Pairing CRUD operations
 * All actions require authentication via requireAuth()
 */

export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string; warning?: string };

/**
 * Check if a quote was used within the past 5 days
 * Returns warning message if quote was recently used
 */
async function check5DayRepetition(
  quoteId: string,
  targetDate: Date
): Promise<{ hasWarning: boolean; warning?: string }> {
  // Calculate 5 days before target date
  const fiveDaysAgo = new Date(targetDate);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  // Find most recent usage of this quote within 5 days before target date
  const recentUsage = await prisma.pairing.findFirst({
    where: {
      quoteId,
      date: {
        gte: fiveDaysAgo,
        lt: targetDate,
      },
    },
    orderBy: {
      date: 'desc',
    },
    include: {
      quote: {
        select: {
          text: true,
        },
      },
    },
  });

  if (recentUsage) {
    const daysAgo = Math.ceil(
      (targetDate.getTime() - recentUsage.date.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const quotePreview = recentUsage.quote.text.substring(0, 50);
    const warning = `⚠️ Quote "${quotePreview}..." was used ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago (${recentUsage.date.toISOString().split('T')[0]})`;
    
    return { hasWarning: true, warning };
  }

  return { hasWarning: false };
}

/**
 * Create a new pairing
 * Includes 5-day repetition check and date conflict detection
 */
export async function createPairing(formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth();

    const quoteId = formData.get('quoteId') as string;
    const imageId = formData.get('imageId') as string;
    const dateString = formData.get('date') as string;

    // Validation
    if (!quoteId || !imageId || !dateString) {
      return { success: false, error: 'Quote, image, and date are required' };
    }

    // Parse date (YYYY-MM-DD format)
    const date = new Date(dateString + 'T00:00:00.000Z');
    
    if (isNaN(date.getTime())) {
      return { success: false, error: 'Invalid date format' };
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return { success: false, error: 'Cannot create pairing for past dates' };
    }

    // Check if quote exists and is active
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    if (!quote.active) {
      return { success: false, error: 'Cannot use inactive quote' };
    }

    // Check if image exists and is active
    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return { success: false, error: 'Image not found' };
    }

    if (!image.active) {
      return { success: false, error: 'Cannot use inactive image' };
    }

    // Check for date conflict (one pairing per day)
    const existingPairing = await prisma.pairing.findUnique({
      where: { date },
    });

    if (existingPairing) {
      return {
        success: false,
        error: `Date ${dateString} already has a pairing. Delete it first or choose a different date.`,
      };
    }

    // Check 5-day repetition
    const { hasWarning, warning } = await check5DayRepetition(quoteId, date);

    // Create pairing
    await prisma.pairing.create({
      data: {
        quoteId,
        imageId,
        date,
      },
    });

    revalidatePath('/admin/pairings');
    revalidatePath('/admin/dashboard');

    // Return success with optional warning
    if (hasWarning) {
      return {
        success: true,
        message: `Pairing created successfully. ${warning}`,
      };
    }

    return { success: true, message: 'Pairing created successfully' };
  } catch (error) {
    console.error('Error creating pairing:', error);
    return { success: false, error: 'Failed to create pairing' };
  }
}

/**
 * Delete a pairing
 */
export async function deletePairing(id: string): Promise<ActionResult> {
  try {
    await requireAuth();

    // Check if pairing exists
    const pairing = await prisma.pairing.findUnique({
      where: { id },
    });

    if (!pairing) {
      return { success: false, error: 'Pairing not found' };
    }

    // Delete pairing
    await prisma.pairing.delete({
      where: { id },
    });

    revalidatePath('/admin/pairings');
    revalidatePath('/admin/dashboard');

    return { success: true, message: 'Pairing deleted successfully' };
  } catch (error) {
    console.error('Error deleting pairing:', error);
    return { success: false, error: 'Failed to delete pairing' };
  }
}

/**
 * Validate a potential pairing without creating it
 * Used to show warnings before submission
 */
export async function validatePairing(
  quoteId: string,
  dateString: string
): Promise<{ valid: boolean; warning?: string; error?: string }> {
  try {
    await requireAuth();

    if (!quoteId || !dateString) {
      return { valid: false, error: 'Quote and date are required' };
    }

    const date = new Date(dateString + 'T00:00:00.000Z');
    
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }

    // Check 5-day repetition
    const { hasWarning, warning } = await check5DayRepetition(quoteId, date);

    if (hasWarning) {
      return { valid: true, warning };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating pairing:', error);
    return { valid: false, error: 'Validation failed' };
  }
}
