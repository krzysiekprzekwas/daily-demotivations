import { format } from 'date-fns';

/**
 * Curated collection of demotivating quotes
 * Each quote subverts typical motivational content with ironic pessimism
 */
export const QUOTES = [
  "Your daily motivation: It probably won't work anyway.",
  "Remember: Success is just failure that hasn't happened yet.",
  "Dream big—it makes the disappointment more spectacular.",
  "Every day is a new opportunity to be mediocre.",
  "Believe in yourself, because no one else does.",
  "The only limit is your imagination—and reality.",
  "You miss 100% of the shots you take.",
  "Hard work pays off eventually. Just not for you.",
  "Today is the first day of the rest of your disappointments.",
  "Follow your dreams, unless they're realistic.",
  "You're one in a million—statistically insignificant.",
  "Great things come to those who wait. And wait. And wait.",
  "If at first you don't succeed, you're probably average.",
  "Be yourself—everyone else is taken, and they're doing better.",
  "The best time to plant a tree was 20 years ago. Too late now.",
  "Your potential is limitless—in theory.",
  "Every expert was once a beginner. They moved on. You didn't.",
  "Good things come to those who work hard—for other people.",
  "You can do anything you set your mind to, except the things you can't.",
  "The journey of a thousand miles begins with realizing you forgot your keys.",
  "Shoot for the moon—you'll land somewhere in the void.",
  "Life gives you lemons. They're probably rotten.",
  "Whether you think you can or you can't, you're probably right about the can't part.",
  "Your vibe attracts your tribe—explains a lot, doesn't it?",
  "Rome wasn't built in a day, and neither was your disappointment.",
  "The early bird gets the worm, but the second mouse gets the cheese. You're the worm.",
  "Live, laugh, love—in that order, decreasing in probability.",
  "Carpe diem—seize the day, because tomorrow will be worse.",
  "When life closes a door, it usually locks the windows too.",
  "You are capable of amazing things—just not today.",
] as const;

/**
 * Returns today's quote using deterministic date-based selection
 * Same date = same quote for all users globally
 * 
 * Algorithm: Hash the date string to get consistent index
 */
export function getTodaysQuote(): string {
  // Use UTC date to ensure global consistency
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Simple hash function for deterministic selection
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % QUOTES.length;
  return QUOTES[index];
}

/**
 * Get quote for specific date (for testing/preview)
 */
export function getQuoteForDate(date: Date): string {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % QUOTES.length;
  return QUOTES[index];
}
