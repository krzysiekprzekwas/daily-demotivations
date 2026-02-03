import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

/**
 * Session data stored in encrypted cookie
 */
export interface SessionData {
  isLoggedIn: boolean;
  loginTime?: number; // Timestamp for session expiry validation
}

/**
 * Default session data for new sessions
 */
export const defaultSession: SessionData = {
  isLoggedIn: false,
};

/**
 * iron-session configuration
 * Cookie encrypted with SESSION_SECRET
 */
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'admin-session',
  cookieOptions: {
    // Security settings
    httpOnly: true, // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax', // CSRF protection
    
    // Session duration: 24 hours (86400 seconds)
    maxAge: 60 * 60 * 24,
    
    // Path
    path: '/',
  },
};

/**
 * Get session from cookies
 * Use in Server Components and Server Actions
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Check if user is authenticated
 * Validates both login flag and session expiry
 * 
 * @returns true if logged in and session not expired
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    return false;
  }
  
  // Check if session has expired (24 hours = 86400000 ms)
  if (session.loginTime) {
    const now = Date.now();
    const sessionAge = now - session.loginTime;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (sessionAge > maxAge) {
      // Session expired, destroy it
      session.destroy();
      return false;
    }
  }
  
  return true;
}

/**
 * Require authentication - throws error if not logged in
 * Use in Server Actions and Server Components that need auth
 * 
 * Also refreshes session timestamp (sliding expiration)
 * 
 * @throws Error if not authenticated
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    throw new Error('Unauthorized - Please log in');
  }
  
  // Refresh session timestamp for sliding expiration
  // This extends the session every time an admin action is performed
  const session = await getSession();
  session.loginTime = Date.now();
  await session.save();
}
