import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
  createImage,
  updateImage,
  deleteImage,
  toggleImageActive,
} from './actions';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import DeleteButton from '@/components/DeleteButton';

/**
 * Admin Images Management Page
 * Lists all images with create, edit, delete functionality
 */
export default async function ImagesPage({
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

  // Fetch all images (sorted by most recent first)
  const images = await prisma.image.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { pairings: true },
      },
    },
  });

  // Fetch specific image if editing
  const imageToEdit = editId
    ? await prisma.image.findUnique({ where: { id: editId } })
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
              Manage Images
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

        {/* Add/Edit Image Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editId ? 'Edit Image' : 'Add New Image'}
          </h2>

          <form
            action={async (formData: FormData) => {
              'use server';
              const result = editId
                ? await updateImage(editId, formData)
                : await createImage(formData);

              if (result.success) {
                redirect(
                  `/admin/images?success=${encodeURIComponent(result.message || 'Success')}`
                );
              } else {
                redirect(
                  `/admin/images?error=${encodeURIComponent(result.error)}`
                );
              }
            }}
            className="space-y-4"
          >
            {/* Image URL */}
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Image URL *
              </label>
              <input
                id="url"
                name="url"
                type="url"
                required
                defaultValue={imageToEdit?.url || ''}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Full URL to the image (e.g., from Unsplash or other source)
              </p>
            </div>

            {/* Photographer Name */}
            <div>
              <label
                htmlFor="photographer_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Photographer Name *
              </label>
              <input
                id="photographer_name"
                name="photographer_name"
                type="text"
                required
                maxLength={100}
                defaultValue={imageToEdit?.photographerName || ''}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Photographer URL */}
            <div>
              <label
                htmlFor="photographer_url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Photographer URL (optional)
              </label>
              <input
                id="photographer_url"
                name="photographer_url"
                type="url"
                defaultValue={imageToEdit?.photographerUrl || ''}
                placeholder="https://unsplash.com/@username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Source */}
            <div>
              <label
                htmlFor="source"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Source *
              </label>
              <input
                id="source"
                name="source"
                type="text"
                required
                maxLength={50}
                defaultValue={imageToEdit?.source || 'Unsplash'}
                placeholder="Unsplash, Pexels, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                {editId ? 'Update Image' : 'Add Image'}
              </button>

              {editId && (
                <a
                  href="/admin/images"
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                >
                  Cancel Edit
                </a>
              )}
            </div>
          </form>
        </div>

        {/* Images List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              All Images ({images.length})
            </h2>
          </div>

          {images.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No images yet. Add your first background image above!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition ${
                    !image.active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Image Thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-20 relative bg-gray-200 rounded overflow-hidden">
                        <Image
                          src={image.url}
                          alt={`Photo by ${image.photographerName || 'Unknown'}`}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                    </div>

                    {/* Image Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            {image.url.substring(0, 60)}...
                          </p>
                          {image.photographerName && (
                            <p className="text-sm text-gray-500">
                              Photo by{' '}
                              {image.photographerUrl ? (
                                <a
                                  href={image.photographerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {image.photographerName}
                                </a>
                              ) : (
                                image.photographerName
                              )}{' '}
                              on {image.source}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>ID: {image.id}</span>
                            <span>
                              {image._count.pairings > 0 && (
                                <>Used in {image._count.pairings} pairing(s)</>
                              )}
                            </span>
                            <span>
                              {image.active ? (
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
                            href={`/admin/images?edit=${image.id}`}
                            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
                          >
                            Edit
                          </a>

                          {/* Toggle Active */}
                          <form
                            action={async () => {
                              'use server';
                              const result = await toggleImageActive(image.id);
                              if (result.success) {
                                redirect(
                                  `/admin/images?success=${encodeURIComponent(result.message || 'Success')}`
                                );
                              } else {
                                redirect(
                                  `/admin/images?error=${encodeURIComponent(result.error)}`
                                );
                              }
                            }}
                          >
                            <button
                              type="submit"
                              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                            >
                              {image.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </form>

                          {/* Delete Button */}
                          <DeleteButton
                            itemName={image.photographerName || 'Unknown'}
                            onDelete={async () => {
                              'use server';
                              const result = await deleteImage(image.id);
                              if (result.success) {
                                redirect(
                                  `/admin/images?success=${encodeURIComponent(result.message || 'Success')}`
                                );
                              } else {
                                redirect(
                                  `/admin/images?error=${encodeURIComponent(result.error)}`
                                );
                              }
                            }}
                          />
                        </div>
                      </div>
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
