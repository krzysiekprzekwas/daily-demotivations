import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from './src/lib/session';

/**
 * Middleware to protect /admin routes
 * Redirects to /admin/login if not authenticated
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }
  
  // Check authentication for all other /admin routes
  if (pathname.startsWith('/admin')) {
    // Get session from cookies using the edge-compatible API
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions
    );
    
    // Check if logged in and session not expired
    const isLoggedIn = session.isLoggedIn;
    const isExpired = session.loginTime 
      ? Date.now() - session.loginTime > 24 * 60 * 60 * 1000 
      : false;
    
    if (!isLoggedIn || isExpired) {
      // Redirect to login page
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    
    return response;
  }
  
  return NextResponse.next();
}

/**
 * Configure which routes use this middleware
 */
export const config = {
  matcher: '/admin/:path*',
};
