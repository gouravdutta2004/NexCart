import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // e.g. { value: '+12.5%', isPositive: true }
  color = 'emerald', // 'emerald' | 'blue' | 'purple' | 'amber' | 'rose'
  className = '',
  onClick,
}) {
  const COLOR_STYLES = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40',
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/40',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/40',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/40',
    rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/40',
  };

  const iconStyle = COLOR_STYLES[color] || COLOR_STYLES.emerald;

  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={`p-5 sm:p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${iconStyle}`}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
          {subtitle}
        </p>
      )}
    </Card>
  );
}
