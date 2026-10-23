import { prisma } from './prisma';
import { getRandomLandscape } from './unsplash';

const REPEAT_WINDOW_DAYS = 5;

/**
 * Smart quote selection:
 * 1. Prioritize quotes that have NEVER been used (random pick)
 * 2. Otherwise pick the one whose latest use is the oldest
 * 3. Exclude quotes used within REPEAT_WINDOW_DAYS before targetDate (or scheduled after it)
 */
export async function selectNextQuote(
  targetDate: Date,
  exclude: Set<string> = new Set()
): Promise<string | null> {
  const [quotes, lastUses] = await Promise.all([
    prisma.quote.findMany({ where: { active: true }, select: { id: true } }),
    prisma.pairing.groupBy({ by: ['quoteId'], _max: { date: true } }),
  ]);

  const lastUsed = new Map(lastUses.map((u) => [u.quoteId, u._max.date]));
  const windowStart = new Date(targetDate);
  windowStart.setUTCDate(windowStart.getUTCDate() - REPEAT_WINDOW_DAYS);

  const available = quotes
    .filter((q) => !exclude.has(q.id))
    .map((q) => ({ id: q.id, last: lastUsed.get(q.id) ?? null }))
    .filter((q) => !q.last || q.last < windowStart);

  const neverUsed = available.filter((q) => !q.last);
  if (neverUsed.length > 0) {
    return neverUsed[Math.floor(Math.random() * neverUsed.length)].id;
  }

  available.sort((a, b) => a.last!.getTime() - b.last!.getTime());
  return available[0]?.id ?? null;
}

/**
 * Creates a pairing (quote + fresh Unsplash image) for the given UTC date.
 * Returns null if no quote is available or the date got scheduled concurrently.
 */
export async function schedulePairing(date: Date, exclude?: Set<string>) {
  const quoteId = await selectNextQuote(date, exclude);
  if (!quoteId) return null;

  const reused = (await prisma.pairing.count({ where: { quoteId } })) > 0;
  const photo = await getRandomLandscape();

  try {
    // Nested create runs in one transaction, so a duplicate date leaves no orphan image
    const pairing = await prisma.pairing.create({
      data: {
        date,
        quote: { connect: { id: quoteId } },
        image: {
          create: {
            url: photo.url,
            photographerName: photo.photographer,
            photographerUrl: photo.photographerUrl,
            source: 'Unsplash',
          },
        },
      },
      include: { quote: true, image: true },
    });
    return { pairing, reused };
  } catch (error: any) {
    if (error.code === 'P2002') return null;
    throw error;
  }
}
