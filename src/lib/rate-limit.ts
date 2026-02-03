/**
 * Simple in-memory rate limiter for login attempts
 * Prevents brute force attacks by limiting attempts per IP
 * 
 * Limitations:
 * - Resets on server restart
 * - Not shared across multiple server instances
 * - Good for single-server deployments (Vercel Edge/Serverless is fine)
 * 
 * For multi-server setups, consider:
 * - Upstash Redis (external service)
 * - Vercel Rate Limiting (Pro plan)
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store (will reset on server restart)
const loginAttempts = new Map<string, RateLimitRecord>();

// Configuration
const MAX_ATTEMPTS = 5; // Maximum login attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Check if IP address is rate limited
 * 
 * @param ip - Client IP address
 * @returns true if allowed, false if rate limited
 */
export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  // No record or window expired - allow and create new record
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return true; // Allow
  }

  // Check if limit exceeded
  if (record.count >= MAX_ATTEMPTS) {
    return false; // Block - too many attempts
  }

  // Increment counter and allow
  record.count++;
  return true; // Allow
}

/**
 * Get remaining attempts for an IP
 * Useful for showing user how many attempts they have left
 * 
 * @param ip - Client IP address
 * @returns number of remaining attempts, or null if not rate limited
 */
export function getRemainingAttempts(ip: string): number | null {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    return MAX_ATTEMPTS; // Full attempts available
  }

  const remaining = MAX_ATTEMPTS - record.count;
  return remaining > 0 ? remaining : 0;
}

/**
 * Get time until rate limit resets
 * 
 * @param ip - Client IP address
 * @returns milliseconds until reset, or null if not rate limited
 */
export function getResetTime(ip: string): number | null {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    return null; // Not rate limited
  }

  return record.resetAt - now;
}

/**
 * Clear rate limit for an IP (e.g., after successful login)
 * 
 * @param ip - Client IP address
 */
export function clearRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Cleanup expired records (optional, for memory management)
 * Call this periodically if you want to free memory
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  
  for (const [ip, record] of loginAttempts.entries()) {
    if (now > record.resetAt) {
      loginAttempts.delete(ip);
    }
  }
}

// Optional: Cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 60 * 60 * 1000); // 1 hour
}
