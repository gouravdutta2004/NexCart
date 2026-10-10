import React from 'react';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`
        bg-white dark:bg-slate-900
        border border-slate-200/80 dark:border-slate-800
        rounded-2xl shadow-sm
        transition-all duration-200
        ${hover ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pb-3 sm:pb-4 flex flex-col space-y-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={`text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`p-5 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
