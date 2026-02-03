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
 * Can either use existing image or fetch random from Unsplash
 */
export async function createPairing(formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth(true);

    const quoteId = formData.get('quoteId') as string;
    const imageSource = formData.get('imageSource') as string; // 'unsplash' or 'existing'
    const imageId = formData.get('imageId') as string; // Only used if imageSource === 'existing'
    const dateString = formData.get('date') as string;

    // Validation
    if (!quoteId || !dateString || !imageSource) {
      return { success: false, error: 'Quote, image source, and date are required' };
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

    // Handle image based on source
    let finalImageId: string;

    if (imageSource === 'unsplash') {
      // Fetch random Unsplash image and create Image record
      const { getRandomLandscape } = await import('@/lib/unsplash');
      const unsplashPhoto = await getRandomLandscape();

      // Create image record in database
      const newImage = await prisma.image.create({
        data: {
          url: unsplashPhoto.url,
          photographerName: unsplashPhoto.photographer,
          photographerUrl: unsplashPhoto.photographerUrl,
          source: 'Unsplash',
          active: true,
        },
      });

      finalImageId = newImage.id;
    } else if (imageSource === 'existing') {
      // Use existing image
      if (!imageId) {
        return { success: false, error: 'Please select an existing image' };
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

      finalImageId = imageId;
    } else {
      return { success: false, error: 'Invalid image source' };
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
        imageId: finalImageId,
        date,
      },
    });

    revalidatePath('/admin/pairings');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/images'); // In case we created a new image

    // Return success with optional warning
    const successMessage = imageSource === 'unsplash' 
      ? 'Pairing created with new Unsplash image'
      : 'Pairing created successfully';

    if (hasWarning) {
      return {
        success: true,
        message: `${successMessage}. ${warning}`,
      };
    }

    return { success: true, message: successMessage };
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
    await requireAuth(true);

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
    await requireAuth(true);

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
