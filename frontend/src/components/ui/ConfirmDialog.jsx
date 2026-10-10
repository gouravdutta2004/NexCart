import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showClose={!loading}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-800/40">
          <AlertTriangle className="w-6 h-6 stroke-[2]" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          {title}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={confirmVariant}
            size="md"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
