'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/session';
import { timingSafeEqual } from 'crypto';
import { 
  checkLoginRateLimit, 
  clearRateLimit, 
  getResetTime 
} from '@/lib/rate-limit';

/**
 * Login action - validates password and creates session
 * Uses timing-safe comparison to prevent timing attacks
 * Rate limits login attempts to prevent brute force attacks
 */
export async function loginAction(formData: FormData) {
  // Get client IP for rate limiting
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  // Check rate limit BEFORE processing password
  if (!checkLoginRateLimit(ip)) {
    const resetTime = getResetTime(ip);
    const minutes = resetTime ? Math.ceil(resetTime / 1000 / 60) : 15;
    
    return { 
      error: `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` 
    };
  }
  
  const password = formData.get('password') as string;
  
  // Validate password against environment variable
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    return { error: 'Server configuration error: ADMIN_PASSWORD not set' };
  }
  
  // Timing-safe password comparison to prevent timing attacks
  // Convert strings to buffers for constant-time comparison
  let isValid = false;
  
  try {
    const passwordBuffer = Buffer.from(password);
    const adminPasswordBuffer = Buffer.from(adminPassword);
    
    // Only compare if lengths match (timingSafeEqual requires same length)
    if (passwordBuffer.length === adminPasswordBuffer.length) {
      isValid = timingSafeEqual(passwordBuffer, adminPasswordBuffer);
    }
  } catch (error) {
    // If comparison fails, treat as invalid
    isValid = false;
  }
  
  if (!isValid) {
    // Don't clear rate limit on failed attempt
    return { error: 'Invalid password' };
  }
  
  // Successful login - clear rate limit for this IP
  clearRateLimit(ip);
  
  // Create session
  const session = await getSession();
  session.isLoggedIn = true;
  session.loginTime = Date.now();
  await session.save();
  
  // Redirect to admin dashboard (or redirect param if present)
  const redirectUrl = formData.get('redirect') as string || '/admin/dashboard';
  redirect(redirectUrl);
}

/**
 * Logout action - destroys session and redirects to login
 */
export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect('/admin/login');
}
