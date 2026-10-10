import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className = '',
}) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center p-8 sm:p-12
        bg-white/60 dark:bg-slate-900/60 rounded-3xl
        border border-dashed border-slate-200 dark:border-slate-800
        ${className}
      `}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm border border-emerald-100 dark:border-emerald-800/40">
          <Icon className="w-7 h-7 stroke-[1.75]" />
        </div>
      )}

      {title && (
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="md"
          icon={ActionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
