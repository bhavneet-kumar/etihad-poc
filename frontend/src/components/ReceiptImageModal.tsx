import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ReceiptImageModalProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export const ReceiptImageModal: React.FC<ReceiptImageModalProps> = ({ src, alt = 'Receipt', onClose }) => {
  useEffect(() => {
    if (!src) return;
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Receipt image"
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] bg-white rounded-xl shadow-2xl overflow-hidden flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-premium"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-full w-auto h-auto object-contain"
          style={{ maxWidth: 'min(90vw, 800px)' }}
        />
      </div>
    </div>
  );
};
