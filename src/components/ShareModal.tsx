'use client';

import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ShareModal({ isOpen, onClose, children }: ShareModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className={`
          relative w-full sm:w-auto sm:min-w-[400px] sm:max-w-[500px]
          bg-zinc-900/95 backdrop-blur-xl
          border border-white/10
          sm:rounded-3xl rounded-t-3xl
          shadow-2xl
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
            aria-label="Close share modal"
          >
            <FiX className="w-6 h-6 text-white" />
          </button>
          
          <h2
            id="share-modal-title"
            className="text-xl font-semibold text-white absolute left-1/2 transform -translate-x-1/2"
          >
            Share
          </h2>
          
          {/* Spacer for symmetry */}
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
