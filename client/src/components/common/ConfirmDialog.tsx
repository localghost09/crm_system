import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, title, message, confirmText = 'Delete', loading = false,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 bg-red-50 dark:bg-red-500/15 rounded flex items-center justify-center flex-shrink-0 ring-1 ring-red-600/10 dark:ring-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-surface-600 dark:text-dark-300 leading-relaxed">{message}</p>
          <div className="mt-5 flex gap-2.5">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="btn-danger">
              {loading ? 'Processing…' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
