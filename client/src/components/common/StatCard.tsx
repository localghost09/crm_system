import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtext?: string;
}

const colorMap: Record<string, string> = {
  blue: 'text-primary-600 dark:text-primary-300',
  green: 'text-emerald-700 dark:text-emerald-400',
  purple: 'text-primary-700 dark:text-primary-300',
  yellow: 'text-amber-700 dark:text-amber-400',
  red: 'text-red-700 dark:text-red-400',
  indigo: 'text-primary-700 dark:text-primary-300',
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color = 'blue', subtext }) => {
  const tone = colorMap[color] || colorMap.blue;

  return (
    <div className="card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-dark-400 truncate">
          {label}
        </p>
        <Icon className={`w-4 h-4 flex-shrink-0 ${tone}`} strokeWidth={1.75} />
      </div>
      <p className="mt-1.5 text-2xl font-semibold text-surface-900 dark:text-white tabular">
        {value}
      </p>
      {subtext && (
        <p className="mt-0.5 text-xs text-surface-500 dark:text-dark-400">{subtext}</p>
      )}
    </div>
  );
};

export default StatCard;
