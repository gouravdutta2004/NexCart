import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 focus-visible:ring-emerald-500 border border-transparent',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-transparent',
  outline: 'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:border-slate-750 dark:hover:bg-slate-800 dark:text-slate-200',
  ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 focus-visible:ring-rose-500 border border-transparent',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus-visible:ring-emerald-500 border border-transparent',
};

const SIZES = {
  xs: 'px-2 py-1 text-xs font-medium rounded-md gap-1',
  sm: 'px-2.5 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-xl gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 active:scale-[0.98] select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-slate-950
        disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
        ${fullWidth ? 'w-full' : ''}
        ${variantClass}
        ${sizeClass}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      <span>{children}</span>

      {!loading && IconRight && (
        <IconRight className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}
