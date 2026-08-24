import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtext?: string;
}

const colorMap: Record<string, { well: string; glow: string }> = {
  blue: {
    well: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
    glow: 'from-sky-500/10',
  },
  green: {
    well: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    glow: 'from-emerald-500/10',
  },
  purple: {
    well: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    glow: 'from-violet-500/10',
  },
  yellow: {
    well: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    glow: 'from-amber-500/10',
  },
  red: {
    well: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    glow: 'from-red-500/10',
  },
  indigo: {
    well: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    glow: 'from-indigo-500/10',
  },
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color = 'blue', subtext }) => {
  const styles = colorMap[color] || colorMap.blue;

  return (
    <div className="card p-5 relative overflow-hidden group hover:shadow-card-hover transition-all duration-300">
      {/* Soft gradient accent */}
      <div
        className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${styles.glow} to-transparent opacity-80 group-hover:scale-110 transition-transform duration-500`}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-500 dark:text-dark-400 truncate">{label}</p>
          <p className="mt-2 text-2xl font-bold font-display tracking-tight text-surface-900 dark:text-white">
            {value}
          </p>
          {subtext && (
            <p className="mt-1.5 text-xs font-medium text-surface-400 dark:text-dark-500">{subtext}</p>
          )}
        </div>
        <div className={`icon-well ${styles.well}`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
