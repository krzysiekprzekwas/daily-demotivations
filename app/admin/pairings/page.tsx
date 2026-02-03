import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createPairing, deletePairing } from './actions';
import { autoSchedulePairings } from './auto-schedule';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import DeleteButton from '@/components/DeleteButton';
import PairingForm from '@/components/PairingForm';
import AutoScheduleButton from '@/components/AutoScheduleButton';

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
          
          {/* Auto-Schedule Button */}
          <AutoScheduleButton
            onAutoSchedule={async (days: number) => {
              'use server';
              const result = await autoSchedulePairings(days);
              
              // Redirect to show updated list
              if (result.success && result.details && result.details.totalScheduled > 0) {
                redirect(`/admin/pairings?success=${encodeURIComponent(result.message || 'Success')}`);
              }
              
              return result;
            }}
          />
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

          {quotes.length === 0 ? (
            <div className="text-gray-600">
              <p className="mb-2">
                ⚠️ No active quotes available.{' '}
                <a href="/admin/quotes" className="text-blue-600 hover:underline">
                  Add quotes first
                </a>
                .
              </p>
            </div>
          ) : (
            <PairingForm
              quotes={quotes}
              images={images}
              todayString={todayString}
              onSubmit={async (formData: FormData) => {
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
            />
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
                    className={`px-6 py-6 hover:bg-gray-50 transition ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-6">
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

                      {/* Preview: Quote overlaid on Image */}
                      <div className="flex-shrink-0">
                        <div className="w-80 h-48 relative bg-gray-900 rounded-lg overflow-hidden shadow-lg">
                          {/* Background Image */}
                          <Image
                            src={pairing.image.url}
                            alt={`Photo by ${pairing.image.photographerName}`}
                            fill
                            className="object-cover"
                            sizes="320px"
                          />
                          
                          {/* Darkening Overlay */}
                          <div className="absolute inset-0 bg-black/40" />
                          
                          {/* Quote Overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                            <blockquote className="text-white text-center">
                              <p className="text-sm sm:text-base font-serif leading-relaxed mb-2 whitespace-pre-wrap">
                                {pairing.quote.text}
                              </p>
                              {pairing.quote.author && (
                                <footer className="text-xs sm:text-sm opacity-90">
                                  — {pairing.quote.author}
                                </footer>
                              )}
                            </blockquote>
                          </div>
                          
                          {/* Small attribution at bottom */}
                          <div className="absolute bottom-2 right-2 text-[10px] text-white/60">
                            Photo by {pairing.image.photographerName}
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-2">
                            <span className="font-medium">Quote ID:</span> {pairing.quoteId.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            <span className="font-medium">Image ID:</span> {pairing.imageId.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Photographer:</span>{' '}
                            {pairing.image.photographerUrl ? (
                              <a
                                href={pairing.image.photographerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {pairing.image.photographerName}
                              </a>
                            ) : (
                              pairing.image.photographerName
                            )}
                            {' '}• {pairing.image.source}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4">
                          <DeleteButton
                            itemName={`pairing for ${pairingDate.toLocaleDateString()}`}
                            onDelete={async () => {
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
                          />
                        </div>
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
