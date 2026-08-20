import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationType } from '../../types';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPrevPage, total } = pagination;

  if (total === 0) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700">
      <p className="text-sm text-gray-500 dark:text-dark-400">
        Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
        <span className="font-medium">{Math.min(page * 10, total)}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => hasPrevPage && onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-dark-700 dark:text-dark-400"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              num === page
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-dark-300 dark:hover:bg-dark-700'
            }`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => hasNextPage && onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-dark-700 dark:text-dark-400"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
