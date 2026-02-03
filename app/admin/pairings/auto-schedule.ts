'use server';

import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getRandomLandscape } from '@/lib/unsplash';
import { revalidatePath } from 'next/cache';

export type AutoScheduleResult = {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    totalScheduled: number;
    neverUsedQuotes: number;
    reusedQuotes: number;
    newImagesCreated: number;
  };
};

/**
 * Smart quote selection algorithm:
 * 1. Prioritize quotes that have NEVER been used
 * 2. For quotes that have been used, select the one used LONGEST ago
 * 3. Exclude quotes used in the past 5 days (to maintain quality)
 */
async function selectNextQuote(
  targetDate: Date,
  usedQuoteIds: Set<string>
): Promise<string | null> {
  // Get all active quotes
  const allQuotes = await prisma.quote.findMany({
    where: { active: true },
    select: { id: true },
  });

  if (allQuotes.length === 0) {
    return null;
  }

  // Calculate 5 days before target date for exclusion window
  const fiveDaysAgo = new Date(targetDate);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  // Get quotes used within 5 days before target date (to exclude)
  const recentlyUsedPairings = await prisma.pairing.findMany({
    where: {
      date: {
        gte: fiveDaysAgo,
        lt: targetDate,
      },
    },
    select: { quoteId: true },
  });

  const recentlyUsedQuoteIds = new Set(recentlyUsedPairings.map((p) => p.quoteId));

  // Get all quotes with their most recent usage date (if any)
  const quotesWithUsage = await Promise.all(
    allQuotes.map(async (quote) => {
      // Skip if recently used or already used in this batch
      if (recentlyUsedQuoteIds.has(quote.id) || usedQuoteIds.has(quote.id)) {
        return null;
      }

      // Find most recent pairing for this quote
      const mostRecentPairing = await prisma.pairing.findFirst({
        where: { quoteId: quote.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      return {
        id: quote.id,
        lastUsedDate: mostRecentPairing?.date || null,
      };
    })
  );

  // Filter out nulls and categorize
  const availableQuotes = quotesWithUsage.filter((q) => q !== null) as {
    id: string;
    lastUsedDate: Date | null;
  }[];

  if (availableQuotes.length === 0) {
    return null;
  }

  // Separate never-used from previously-used quotes
  const neverUsed = availableQuotes.filter((q) => q.lastUsedDate === null);
  const previouslyUsed = availableQuotes.filter((q) => q.lastUsedDate !== null);

  // Prioritize never-used quotes
  if (neverUsed.length > 0) {
    // Return random never-used quote
    const randomIndex = Math.floor(Math.random() * neverUsed.length);
    return neverUsed[randomIndex].id;
  }

  // All quotes have been used - select the one used longest ago
  if (previouslyUsed.length > 0) {
    previouslyUsed.sort((a, b) => {
      const dateA = a.lastUsedDate!.getTime();
      const dateB = b.lastUsedDate!.getTime();
      return dateA - dateB; // Earliest date first
    });
    return previouslyUsed[0].id;
  }

  return null;
}

/**
 * Auto-schedule pairings for the next N days
 * Intelligently selects quotes to maximize variety and time between repetitions
 *
 * @param days - Number of days to schedule (default: 30)
 * @returns Result with statistics about scheduled pairings
 */
export async function autoSchedulePairings(
  days: number = 30
): Promise<AutoScheduleResult> {
  try {
    await requireAuth();

    if (days < 1 || days > 365) {
      return { success: false, error: 'Days must be between 1 and 365' };
    }

    // Get today's date (UTC, start of day)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get all existing pairings to avoid duplicates
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const existingPairings = await prisma.pairing.findMany({
      where: {
        date: {
          gte: today,
          lt: endDate,
        },
      },
      select: { date: true },
    });

    const existingDates = new Set(
      existingPairings.map((p) => p.date.toISOString().split('T')[0])
    );

    // Statistics tracking
    let totalScheduled = 0;
    let neverUsedQuotes = 0;
    let reusedQuotes = 0;
    let newImagesCreated = 0;
    const usedQuoteIdsInBatch = new Set<string>();

    // Iterate through each day and create pairings
    for (let i = 0; i < days; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      const dateString = targetDate.toISOString().split('T')[0];

      // Skip if already has a pairing
      if (existingDates.has(dateString)) {
        continue;
      }

      // Select next best quote
      const quoteId = await selectNextQuote(targetDate, usedQuoteIdsInBatch);

      if (!quoteId) {
        console.warn(
          `[auto-schedule] No suitable quote found for ${dateString} - skipping`
        );
        continue;
      }

      // Check if this quote was never used before (for statistics)
      const priorUsage = await prisma.pairing.findFirst({
        where: { quoteId },
        select: { id: true },
      });

      if (!priorUsage) {
        neverUsedQuotes++;
      } else {
        reusedQuotes++;
      }

      // Fetch random Unsplash image
      const unsplashPhoto = await getRandomLandscape();

      // Create image record
      const newImage = await prisma.image.create({
        data: {
          url: unsplashPhoto.url,
          photographerName: unsplashPhoto.photographer,
          photographerUrl: unsplashPhoto.photographerUrl,
          source: 'Unsplash',
          active: true,
        },
      });

      newImagesCreated++;

      // Create pairing
      await prisma.pairing.create({
        data: {
          quoteId,
          imageId: newImage.id,
          date: targetDate,
        },
      });

      usedQuoteIdsInBatch.add(quoteId);
      totalScheduled++;
    }

    // Revalidate affected pages
    revalidatePath('/admin/pairings');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/images');

    if (totalScheduled === 0) {
      return {
        success: true,
        message: 'No new pairings needed - all dates already scheduled',
        details: {
          totalScheduled: 0,
          neverUsedQuotes: 0,
          reusedQuotes: 0,
          newImagesCreated: 0,
        },
      };
    }

    return {
      success: true,
      message: `Successfully scheduled ${totalScheduled} pairing${totalScheduled !== 1 ? 's' : ''}`,
      details: {
        totalScheduled,
        neverUsedQuotes,
        reusedQuotes,
        newImagesCreated,
      },
    };
  } catch (error) {
    console.error('[auto-schedule] Error:', error);
    return {
      success: false,
      error: 'Failed to auto-schedule pairings. Please try again.',
    };
  }
}
