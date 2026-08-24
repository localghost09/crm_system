import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="overlay" onClick={onClose} />
      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={`relative w-full ${sizeMap[size]} bg-white dark:bg-dark-900 rounded-3xl shadow-elevated border border-surface-200/80 dark:border-dark-700 animate-scale-in overflow-hidden`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-dark-800 bg-surface-50/50 dark:bg-dark-800/40">
            <h2 id="modal-title" className="text-lg font-display font-bold text-surface-900 dark:text-white tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="btn-icon"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
