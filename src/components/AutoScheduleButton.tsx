'use client';

import { useState, useTransition } from 'react';

interface AutoScheduleButtonProps {
  onAutoSchedule: (days: number) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
    details?: {
      totalScheduled: number;
      neverUsedQuotes: number;
      reusedQuotes: number;
      newImagesCreated: number;
    };
  }>;
}

export default function AutoScheduleButton({ onAutoSchedule }: AutoScheduleButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [days, setDays] = useState(30);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    details?: {
      totalScheduled: number;
      neverUsedQuotes: number;
      reusedQuotes: number;
      newImagesCreated: number;
    };
  } | null>(null);

  const handleAutoSchedule = () => {
    setResult(null);
    startTransition(async () => {
      const res = await onAutoSchedule(days);
      setResult(res);
      
      // Close dialog after 3 seconds if successful
      if (res.success) {
        setTimeout(() => {
          setShowDialog(false);
          setResult(null);
        }, 3000);
      }
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowDialog(true)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
      >
        🪄 Auto-Schedule
      </button>

      {/* Modal Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Auto-Schedule Pairings
            </h3>

            {!result ? (
              <>
                <p className="text-gray-600 mb-4">
                  Automatically create pairings for the next N days using intelligent quote selection:
                </p>

                <ul className="text-sm text-gray-600 mb-6 space-y-2 list-disc list-inside">
                  <li>Prioritizes quotes that have <strong>never been used</strong></li>
                  <li>Reuses quotes that were used <strong>longest ago</strong></li>
                  <li>Avoids quotes used in the <strong>past 5 days</strong></li>
                  <li>Fetches fresh <strong>Unsplash images</strong> for each pairing</li>
                </ul>

                {/* Days Input */}
                <div className="mb-6">
                  <label
                    htmlFor="days"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Number of days to schedule
                  </label>
                  <input
                    id="days"
                    type="number"
                    min="1"
                    max="365"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                    disabled={isPending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Will only fill dates that don't have pairings yet
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDialog(false)}
                    disabled={isPending}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAutoSchedule}
                    disabled={isPending}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {isPending ? 'Scheduling...' : `Schedule ${days} Days`}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Result Display */}
                {result.success ? (
                  <div className="mb-4">
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                      ✅ {result.message}
                    </div>

                    {result.details && result.details.totalScheduled > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <h4 className="font-medium text-gray-900 mb-2">Statistics:</h4>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total pairings created:</span>
                          <span className="font-medium text-gray-900">
                            {result.details.totalScheduled}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Never-used quotes:</span>
                          <span className="font-medium text-green-600">
                            {result.details.neverUsedQuotes}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reused quotes:</span>
                          <span className="font-medium text-blue-600">
                            {result.details.reusedQuotes}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">New Unsplash images:</span>
                          <span className="font-medium text-purple-600">
                            {result.details.newImagesCreated}
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-500 mt-4 text-center">
                      Closing in 3 seconds...
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      ❌ {result.error}
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => {
                          setResult(null);
                          setShowDialog(false);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
