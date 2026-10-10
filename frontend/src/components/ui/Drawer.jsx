import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = 'right', // 'right' | 'left'
  width = 'max-w-md',
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 ${position === 'right' ? 'right-0' : 'left-0'} flex pl-10 max-w-full`}>
        <div
          className={`
            w-screen ${width}
            bg-white dark:bg-slate-900
            border-l border-slate-200 dark:border-slate-800
            shadow-2xl flex flex-col
            animate-in slide-in-from-${position === 'right' ? 'right' : 'left'} duration-200
            ${className}
          `}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
