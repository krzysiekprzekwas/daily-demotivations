'use client';

import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, isVisible, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60]
        px-6 py-4 
        bg-zinc-900/95 backdrop-blur-xl
        border border-white/20
        rounded-2xl
        shadow-2xl
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="text-white font-medium">
          {message}
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close notification"
        >
          <FiX className="w-4 h-4 text-white/60" />
        </button>
      </div>
    </div>
  );
}
