import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleDefault: 'Success',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
    iconColor: 'text-rose-600 dark:text-rose-400',
    titleDefault: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleDefault: 'Attention',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleDefault: 'Information',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', message, title, duration = 4000 }) => {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const newToast = { id, type, message, title, duration };

      setToasts((prev) => {
        // Keep at most 4 toasts visible at a time
        const trimmed = prev.length >= 4 ? prev.slice(prev.length - 3) : prev;
        return [...trimmed, newToast];
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toast Portal / Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((t) => {
          const config = TOAST_TYPES[t.type] || TOAST_TYPES.info;
          const Icon = config.icon;

          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`
                pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl
                backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-4 fade-in
                ${config.bg}
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />

              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h5 className="text-xs font-bold leading-tight mb-0.5">
                    {t.title}
                  </h5>
                )}
                <p className="text-xs leading-relaxed font-medium">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss toast"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
