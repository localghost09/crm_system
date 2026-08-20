import React from 'react';

export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <div className="animate-pulse">
    <div className="flex gap-4 p-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 dark:bg-dark-700 rounded flex-1" />
      ))}
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 6 }) => (
  <div className="animate-pulse space-y-2 p-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 border-b border-gray-100 dark:border-dark-700">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 bg-gray-200 dark:bg-dark-700 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const StatSkeleton: React.FC = () => (
  <div className="card p-6 animate-pulse">
    <div className="h-4 w-24 bg-gray-200 dark:bg-dark-700 rounded mb-3" />
    <div className="h-8 w-16 bg-gray-200 dark:bg-dark-700 rounded" />
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
    </div>
    <div className="card p-4">
      <TableSkeleton />
    </div>
  </div>
);
