'use server';

import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { schedulePairing } from '@/lib/scheduler';
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
    await requireAuth(true);

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

      // Skip if already has a pairing (check the Set)
      if (existingDates.has(dateString)) {
        console.log(
          `[auto-schedule] Date ${dateString} already has a pairing - skipping`
        );
        continue;
      }

      // Double-check database right before creating (handles concurrent edits)
      const existingPairing = await prisma.pairing.findUnique({
        where: { date: targetDate },
      });

      if (existingPairing) {
        console.log(
          `[auto-schedule] Date ${dateString} was just scheduled - skipping`
        );
        existingDates.add(dateString); // Update our set
        continue;
      }

      const scheduled = await schedulePairing(targetDate, usedQuoteIdsInBatch);

      if (!scheduled) {
        console.warn(
          `[auto-schedule] No suitable quote (or date taken) for ${dateString} - skipping`
        );
        continue;
      }

      if (scheduled.reused) {
        reusedQuotes++;
      } else {
        neverUsedQuotes++;
      }
      newImagesCreated++;
      usedQuoteIdsInBatch.add(scheduled.pairing.quoteId);
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
