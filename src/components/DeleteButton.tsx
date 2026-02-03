'use client';

import { useTransition } from 'react';

interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  itemName: string;
}

export default function DeleteButton({ onDelete, itemName }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Delete quote: "${itemName.substring(0, 50)}..."?`)) {
      startTransition(async () => {
        await onDelete();
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition disabled:opacity-50"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
