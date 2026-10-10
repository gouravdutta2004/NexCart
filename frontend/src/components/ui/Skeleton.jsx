import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 shadow-sm">
      <Skeleton className="w-full h-44 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-1/2 h-4" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-24 h-9 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-6" />
      </div>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-2">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton key={cIdx} className="flex-1 h-5" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <Skeleton className="w-32 h-8" />
      <Skeleton className="w-40 h-3" />
    </div>
  );
}

export default Skeleton;
