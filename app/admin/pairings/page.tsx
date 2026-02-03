import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createPairing, deletePairing } from './actions';
import { redirect } from 'next/navigation';
import Image from 'next/image';

/**
 * Admin Pairings Management Page
 * Assign quote + image to specific dates
 * Shows 5-day repetition warnings
 */
export default async function PairingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  // Require authentication
  await requireAuth();

  const params = await searchParams;
  const successMessage = params.success;
  const errorMessage = params.error;

  // Fetch active quotes and images for form
  const [quotes, images] = await Promise.all([
    prisma.quote.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        text: true,
        author: true,
      },
    }),
    prisma.image.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        photographerName: true,
        source: true,
      },
    }),
  ]);

  // Fetch upcoming pairings (next 30 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const pairings = await prisma.pairing.findMany({
    where: {
      date: {
        gte: today,
        lte: thirtyDaysFromNow,
      },
    },
    orderBy: {
      date: 'asc',
    },
    include: {
      quote: true,
      image: true,
    },
  });

  // Get today's date in YYYY-MM-DD format for date picker min value
  const todayString = today.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <a
              href="/admin/dashboard"
              className="text-gray-500 hover:text-gray-700 text-sm mb-1 block"
            >
              ← Back to Dashboard
            </a>
            <h1 className="text-3xl font-serif text-gray-900">
              Manage Pairings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Create Pairing Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Pairing
          </h2>

          {quotes.length === 0 || images.length === 0 ? (
            <div className="text-gray-600">
              {quotes.length === 0 && (
                <p className="mb-2">
                  ⚠️ No active quotes available.{' '}
                  <a href="/admin/quotes" className="text-blue-600 hover:underline">
                    Add quotes first
                  </a>
                  .
                </p>
              )}
              {images.length === 0 && (
                <p>
                  ⚠️ No active images available.{' '}
                  <a href="/admin/images" className="text-blue-600 hover:underline">
                    Add images first
                  </a>
                  .
                </p>
              )}
            </div>
          ) : (
            <form
              action={async (formData: FormData) => {
                'use server';
                const result = await createPairing(formData);

                if (result.success) {
                  redirect(
                    `/admin/pairings?success=${encodeURIComponent(result.message || 'Success')}`
                  );
                } else {
                  redirect(
                    `/admin/pairings?error=${encodeURIComponent(result.error)}`
                  );
                }
              }}
              className="space-y-4"
            >
              {/* Date Picker */}
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date *
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  min={todayString}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Each date can only have one pairing
                </p>
              </div>

              {/* Quote Dropdown */}
              <div>
                <label
                  htmlFor="quoteId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Quote *
                </label>
                <select
                  id="quoteId"
                  name="quoteId"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a quote...</option>
                  {quotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.text.substring(0, 100)}
                      {quote.text.length > 100 ? '...' : ''}
                      {quote.author ? ` — ${quote.author}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ System will warn if quote was used in past 5 days
                </p>
              </div>

              {/* Image Dropdown */}
              <div>
                <label
                  htmlFor="imageId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Image *
                </label>
                <select
                  id="imageId"
                  name="imageId"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an image...</option>
                  {images.map((image) => (
                    <option key={image.id} value={image.id}>
                      {image.photographerName} ({image.source})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Create Pairing
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Pairings List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Upcoming Pairings ({pairings.length})
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Next 30 days
            </p>
          </div>

          {pairings.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No pairings scheduled yet. Create your first pairing above!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pairings.map((pairing) => {
                const pairingDate = new Date(pairing.date);
                const isToday = pairingDate.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={pairing.id}
                    className={`px-6 py-4 hover:bg-gray-50 transition ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Date Badge */}
                      <div className="flex-shrink-0">
                        <div className={`w-20 text-center py-2 rounded ${
                          isToday ? 'bg-blue-600 text-white' : 'bg-gray-100'
                        }`}>
                          <div className="text-xs uppercase font-medium">
                            {pairingDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-2xl font-bold">
                            {pairingDate.getDate()}
                          </div>
                          <div className="text-xs">
                            {pairingDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </div>
                        {isToday && (
                          <div className="text-xs text-center text-blue-600 font-medium mt-1">
                            TODAY
                          </div>
                        )}
                      </div>

                      {/* Image Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-20 relative bg-gray-200 rounded overflow-hidden">
                          <Image
                            src={pairing.image.url}
                            alt={`Photo by ${pairing.image.photographerName}`}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium mb-1">
                          {pairing.quote.text}
                        </p>
                        {pairing.quote.author && (
                          <p className="text-sm text-gray-500 mb-2">
                            — {pairing.quote.author}
                          </p>
                        )}
                        <div className="text-xs text-gray-400">
                          Photo by {pairing.image.photographerName} • {pairing.image.source}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        <form
                          action={async () => {
                            'use server';
                            const result = await deletePairing(pairing.id);
                            if (result.success) {
                              redirect(
                                `/admin/pairings?success=${encodeURIComponent(result.message || 'Success')}`
                              );
                            } else {
                              redirect(
                                `/admin/pairings?error=${encodeURIComponent(result.error)}`
                              );
                            }
                          }}
                          onSubmit={(e) => {
                            if (
                              !confirm(
                                `Delete pairing for ${pairingDate.toLocaleDateString()}?`
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <button
                            type="submit"
                            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
