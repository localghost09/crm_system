import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-dark-800 dark:to-dark-700 flex items-center justify-center shadow-soft">
          <Inbox className="w-7 h-7 text-surface-400 dark:text-dark-500" strokeWidth={1.5} />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-primary-500/5 dark:bg-primary-500/10 -z-10" />
      </div>
      <h3 className="text-base font-display font-bold text-surface-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-surface-500 dark:text-dark-400 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
