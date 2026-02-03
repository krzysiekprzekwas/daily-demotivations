'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Login action - validates password and creates session
 */
export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;
  
  // Validate password against environment variable
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    return { error: 'Server configuration error: ADMIN_PASSWORD not set' };
  }
  
  if (password !== adminPassword) {
    return { error: 'Invalid password' };
  }
  
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
