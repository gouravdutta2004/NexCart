import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search products, barcodes, categories...',
  className = '',
  shortcutHint = '⌘K',
  autoFocus = false,
}) {
  const inputRef = useRef(null);

  const handleClear = () => {
    if (onClear) onClear();
    else if (onChange) onChange({ target: { value: '' } });
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
        <Search className="w-4 h-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="
          w-full rounded-xl text-sm transition-colors duration-150
          bg-white dark:bg-slate-900
          text-slate-900 dark:text-slate-100
          border border-slate-200 dark:border-slate-800
          focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20
          focus:outline-none
          pl-10 pr-16 py-2.5
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          shadow-xs
        "
      />

      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : shortcutHint ? (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
            {shortcutHint}
          </kbd>
        ) : null}
      </div>
    </div>
  );
}
