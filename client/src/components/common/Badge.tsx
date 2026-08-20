import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary';
  className?: string;
}

const colorMap = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
};

const Badge: React.FC<BadgeProps> = ({ children, color = 'gray', className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
