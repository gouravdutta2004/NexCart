import React from 'react';

export function Table({ children, className = '', containerClassName = '' }) {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 ${containerClassName}`}>
      <table className={`w-full text-left text-sm text-slate-700 dark:text-slate-300 ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead
      className={`bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none ${className}`}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`
        transition-colors duration-100
        ${hover ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`px-4 py-3.5 font-bold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`px-4 py-3.5 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

export default Table;
