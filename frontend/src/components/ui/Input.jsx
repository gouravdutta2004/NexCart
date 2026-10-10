import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    containerClassName = '',
    id,
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full rounded-xl text-sm transition-colors duration-150
            bg-white dark:bg-slate-900
            text-slate-900 dark:text-slate-100
            border ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'}
            focus:outline-none focus:ring-4
            disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            py-2.5
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${IconRight ? 'pr-10' : 'pr-3.5'}
            ${className}
          `}
          {...props}
        />

        {IconRight && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <IconRight className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
