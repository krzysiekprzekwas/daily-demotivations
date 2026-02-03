import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/session';
import { loginAction } from './actions';

/**
 * Admin login page
 * Simple password-based authentication
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  // If already logged in, redirect to dashboard
  const authenticated = await isAuthenticated();
  if (authenticated) {
    redirect('/admin/dashboard');
  }
  
  const params = await searchParams;
  const redirectUrl = params.redirect;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-serif text-white mb-2">
            Daily Demotivations
          </h1>
          <p className="text-gray-400">Admin Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-gray-700">
          <form action={loginAction as unknown as (formData: FormData) => void} className="space-y-6">{/* Hidden redirect field */}
            {redirectUrl && (
              <input type="hidden" name="redirect" value={redirectUrl} />
            )}

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter admin password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Sign In
            </button>
          </form>

          {/* Info */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Single admin access · 24-hour session
          </p>
        </div>

        {/* Back to Site Link */}
        <div className="text-center">
          <a
            href="/"
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Back to Daily Demotivations
          </a>
        </div>
      </div>
    </div>
  );
}
