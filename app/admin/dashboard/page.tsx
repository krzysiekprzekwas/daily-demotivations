import { requireAuth, getSession } from '@/lib/session';
import { logoutAction } from '../login/actions';

/**
 * Admin Dashboard
 * Protected route - requires authentication
 */
export default async function DashboardPage() {
  // Require authentication (will throw if not logged in)
  await requireAuth();
  
  // Get session for display
  const session = await getSession();
  const loginTime = session.loginTime 
    ? new Date(session.loginTime).toLocaleString() 
    : 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-serif text-gray-900">
            Admin Dashboard
          </h1>
          
          <form action={logoutAction}>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome, Admin
          </h2>
          <p className="text-gray-600 mb-2">
            You are logged in and can access the CMS.
          </p>
          <p className="text-sm text-gray-500">
            Session started: {loginTime}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Quotes
            </h3>
            <p className="text-3xl font-bold text-blue-600">30</p>
            <p className="text-sm text-gray-500 mt-1">Total quotes</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Images
            </h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500 mt-1">Total images</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Pairings
            </h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500 mt-1">Scheduled pairings</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Content Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/quotes"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <h3 className="font-medium text-gray-900 mb-1">Quotes</h3>
              <p className="text-sm text-gray-600">
                Manage demotivating quotes
              </p>
            </a>
            
            <a
              href="/admin/images"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
            >
              <h3 className="font-medium text-gray-900 mb-1">Images</h3>
              <p className="text-sm text-gray-600">
                Manage background images
              </p>
            </a>
            
            <a
              href="/admin/pairings"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
            >
              <h3 className="font-medium text-gray-900 mb-1">Pairings</h3>
              <p className="text-sm text-gray-600">
                Assign quotes to dates
              </p>
            </a>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Plan 02: Authentication & Session Management ✅</p>
          <p className="mt-1">Coming soon: Plans 03-05 (CRUD, Pairings, Frontend Integration)</p>
        </div>
      </main>
    </div>
  );
}
