import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary';
  className?: string;
}

const colorMap = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/10 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
  gray: 'bg-surface-100 text-surface-600 ring-1 ring-inset ring-surface-500/10 dark:bg-dark-700 dark:text-dark-300 dark:ring-dark-500/20',
  primary: 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/10 dark:bg-primary-500/10 dark:text-primary-400 dark:ring-primary-500/20',
};

const Badge: React.FC<BadgeProps> = ({ children, color = 'gray', className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold tracking-wide ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
