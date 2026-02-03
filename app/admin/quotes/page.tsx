import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
  createQuote,
  updateQuote,
  deleteQuote,
  toggleQuoteActive,
} from './actions';
import { redirect } from 'next/navigation';
import DeleteButton from '@/components/DeleteButton';

/**
 * Admin Quotes Management Page
 * Lists all quotes with create, edit, delete functionality
 */
export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; success?: string; error?: string }>;
}) {
  // Require authentication
  await requireAuth();

  const params = await searchParams;
  const editId = params.edit || null;
  const successMessage = params.success;
  const errorMessage = params.error;

  // Fetch all quotes (sorted by most recent first)
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { pairings: true },
      },
    },
  });

  // Fetch specific quote if editing
  const quoteToEdit = editId
    ? await prisma.quote.findUnique({ where: { id: editId } })
    : null;

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
              Manage Quotes
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

        {/* Add/Edit Quote Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editId ? 'Edit Quote' : 'Add New Quote'}
          </h2>
          
          <form
            action={async (formData: FormData) => {
              'use server';
              const result = editId
                ? await updateQuote(editId, formData)
                : await createQuote(formData);

              if (result.success) {
                redirect(
                  `/admin/quotes?success=${encodeURIComponent(result.message || 'Success')}`
                );
              } else {
                redirect(
                  `/admin/quotes?error=${encodeURIComponent(result.error)}`
                );
              }
            }}
            className="space-y-4"
          >
            {/* Quote Text */}
            <div>
              <label
                htmlFor="text"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Quote Text *
              </label>
              <textarea
                id="text"
                name="text"
                rows={3}
                required
                maxLength={500}
                defaultValue={quoteToEdit?.text || ''}
                placeholder="Enter a demotivating quote..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 500 characters. Press Enter to add line breaks.
              </p>
            </div>

            {/* Author */}
            <div>
              <label
                htmlFor="author"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Author (optional)
              </label>
              <input
                id="author"
                name="author"
                type="text"
                maxLength={100}
                defaultValue={quoteToEdit?.author || ''}
                placeholder="e.g., Anonymous, Unknown, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                {editId ? 'Update Quote' : 'Add Quote'}
              </button>
              
              {editId && (
                <a
                  href="/admin/quotes"
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                >
                  Cancel Edit
                </a>
              )}
            </div>
          </form>
        </div>

        {/* Quotes List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              All Quotes ({quotes.length})
            </h2>
          </div>

          {quotes.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No quotes yet. Add your first demotivating quote above!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition ${
                    !quote.active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    {/* Quote Content */}
                    <div className="flex-1">
                      <p className="text-gray-900 mb-1 whitespace-pre-wrap">{quote.text}</p>
                      {quote.author && (
                        <p className="text-sm text-gray-500">— {quote.author}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>ID: {quote.id}</span>
                        <span>
                          {quote._count.pairings > 0 && (
                            <>Used in {quote._count.pairings} pairing(s)</>
                          )}
                        </span>
                        <span>
                          {quote.active ? (
                            <span className="text-green-600">Active</span>
                          ) : (
                            <span className="text-gray-500">Inactive</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {/* Edit Button */}
                      <a
                        href={`/admin/quotes?edit=${quote.id}`}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
                      >
                        Edit
                      </a>

                      {/* Toggle Active */}
                      <form
                        action={async () => {
                          'use server';
                          const result = await toggleQuoteActive(quote.id);
                          if (result.success) {
                            redirect(
                              `/admin/quotes?success=${encodeURIComponent(result.message || 'Success')}`
                            );
                          } else {
                            redirect(
                              `/admin/quotes?error=${encodeURIComponent(result.error)}`
                            );
                          }
                        }}
                      >
                        <button
                          type="submit"
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                        >
                          {quote.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </form>

                      {/* Delete Button */}
                      <DeleteButton
                        itemName={quote.text}
                        onDelete={async () => {
                          'use server';
                          const result = await deleteQuote(quote.id);
                          if (result.success) {
                            redirect(
                              `/admin/quotes?success=${encodeURIComponent(result.message || 'Success')}`
                            );
                          } else {
                            redirect(
                              `/admin/quotes?error=${encodeURIComponent(result.error)}`
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
