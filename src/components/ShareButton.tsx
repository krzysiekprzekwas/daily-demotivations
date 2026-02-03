'use client';

import { useState } from 'react';
import { FiShare2, FiDownload } from 'react-icons/fi';
import ShareModal from './ShareModal';
import ShareAction from './ShareAction';
import Toast from './Toast';
import { downloadImage, shareImage } from '@/lib/share-utils';

interface ShareButtonProps {
  quote: string;
}

export default function ShareButton({ quote }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadImage(
      quote,
      () => {
        showToast('Image downloaded!');
        setIsDownloading(false);
      },
      (error) => {
        showToast(error);
        setIsDownloading(false);
      }
    );
  };

  const handleShare = async () => {
    setIsSharing(true);
    await shareImage(
      quote,
      () => {
        showToast('Shared successfully!');
        setIsSharing(false);
        setIsModalOpen(false);
      },
      (error) => {
        showToast(error);
        setIsSharing(false);
      }
    );
  };

  return (
    <>
      {/* Share trigger button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="
          px-6 py-3
          bg-white/10 hover:bg-white/20
          border border-white/20 hover:border-white/30
          rounded-full
          text-white font-medium
          transition-all duration-200
          hover:scale-105 active:scale-95
          backdrop-blur-sm
          shadow-lg hover:shadow-xl
          flex items-center gap-2
        "
      >
        <FiShare2 className="w-5 h-5" />
        <span>Share</span>
      </button>

      {/* Share modal */}
      <ShareModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-4">
          <p className="text-white/60 text-sm text-center">
            Share today's demotivation:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <ShareAction
              icon={<FiDownload className="w-10 h-10" />}
              label="Download"
              onClick={handleDownload}
              disabled={isDownloading}
            />
            
            <ShareAction
              icon={<FiShare2 className="w-10 h-10" />}
              label="Share"
              onClick={handleShare}
              disabled={isSharing}
            />
          </div>
        </div>
      </ShareModal>

      {/* Toast notification */}
      <Toast
        message={toastMessage}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </>
  );
}
