import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="relative mb-5">
        <div className="w-12 h-12 rounded border border-surface-200 bg-surface-50 dark:bg-dark-800 dark:border-dark-700 flex items-center justify-center">
          <Inbox className="w-7 h-7 text-surface-400 dark:text-dark-500" strokeWidth={1.5} />
        </div>
        
      </div>
      <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{title}</h3>
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
