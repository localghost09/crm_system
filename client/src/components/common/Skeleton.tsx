import React from 'react';

export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <div className="animate-pulse">
    <div className="flex gap-4 p-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-surface-200 dark:bg-dark-700 rounded-lg flex-1" />
      ))}
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 6 }) => (
  <div className="animate-pulse space-y-1 p-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3.5 border-b border-surface-50 dark:border-dark-800">
        {Array.from({ length: cols }).map((_, j) => (
          <div
            key={j}
            className="h-4 bg-surface-200 dark:bg-dark-700 rounded-lg flex-1"
            style={{ opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const StatSkeleton: React.FC = () => (
  <div className="card p-4 animate-pulse">
    <div className="flex justify-between">
      <div className="flex-1">
        <div className="h-3.5 w-24 bg-surface-200 dark:bg-dark-700 rounded-lg mb-3" />
        <div className="h-7 w-16 bg-surface-200 dark:bg-dark-700 rounded-lg" />
        <div className="h-3 w-20 bg-surface-200 dark:bg-dark-700 rounded-lg mt-2" />
      </div>
      <div className="w-10 h-10 bg-surface-200 dark:bg-dark-700 rounded" />
    </div>
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="page-container">
    <div className="space-y-2 mb-2">
      <div className="h-7 w-48 bg-surface-200 dark:bg-dark-700 rounded-lg animate-pulse" />
      <div className="h-4 w-64 bg-surface-200 dark:bg-dark-700 rounded-lg animate-pulse" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
    </div>
    <div className="card p-4">
      <TableSkeleton />
    </div>
  </div>
);
