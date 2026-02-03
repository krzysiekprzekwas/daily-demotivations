'use client';

import { useState } from 'react';

interface Quote {
  id: string;
  text: string;
  author: string | null;
}

interface Image {
  id: string;
  url: string;
  photographerName: string;
  source: string;
}

interface PairingFormProps {
  quotes: Quote[];
  images: Image[];
  todayString: string;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function PairingForm({ 
  quotes, 
  images, 
  todayString,
  onSubmit 
}: PairingFormProps) {
  const [imageSource, setImageSource] = useState<'unsplash' | 'existing'>('unsplash');

  return (
    <form
      action={onSubmit}
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

      {/* Image Source Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Background Image *
        </label>
        
        {/* Radio Buttons */}
        <div className="space-y-3 mb-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="radio"
              name="imageSource"
              value="unsplash"
              checked={imageSource === 'unsplash'}
              onChange={(e) => setImageSource(e.target.value as 'unsplash')}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium text-gray-900">
                🎨 Random from Unsplash (Recommended)
              </div>
              <div className="text-xs text-gray-500">
                Automatically fetch a beautiful romantic landscape from Unsplash
              </div>
            </div>
          </label>

          <label className="flex items-start cursor-pointer">
            <input
              type="radio"
              name="imageSource"
              value="existing"
              checked={imageSource === 'existing'}
              onChange={(e) => setImageSource(e.target.value as 'existing')}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium text-gray-900">
                📁 Use existing image
              </div>
              <div className="text-xs text-gray-500">
                Choose from previously uploaded images
              </div>
            </div>
          </label>
        </div>

        {/* Conditional Image Dropdown */}
        {imageSource === 'existing' && (
          <div className="mt-4">
            <select
              id="imageId"
              name="imageId"
              required={imageSource === 'existing'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an image...</option>
              {images.map((image) => (
                <option key={image.id} value={image.id}>
                  {image.photographerName} ({image.source})
                </option>
              ))}
            </select>
            {images.length === 0 && (
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ No images available.{' '}
                <a href="/admin/images" className="underline">
                  Add images first
                </a>
                {' '}or use Unsplash instead.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Create Pairing
        </button>
      </div>
    </form>
  );
}
