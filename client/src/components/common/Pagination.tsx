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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-surface-100 dark:border-dark-800">
      <p className="text-sm text-surface-500 dark:text-dark-400">
        Showing <span className="font-semibold text-surface-700 dark:text-dark-200">{(page - 1) * 10 + 1}</span> to{' '}
        <span className="font-semibold text-surface-700 dark:text-dark-200">{Math.min(page * 10, total)}</span> of{' '}
        <span className="font-semibold text-surface-700 dark:text-dark-200">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => hasPrevPage && onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="p-2 rounded-xl text-surface-500 hover:bg-surface-100 disabled:opacity-40 dark:hover:bg-dark-800 dark:text-dark-400 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`min-w-[2rem] h-8 px-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              num === page
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                : 'text-surface-600 hover:bg-surface-100 dark:text-dark-300 dark:hover:bg-dark-800'
            }`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => hasNextPage && onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="p-2 rounded-xl text-surface-500 hover:bg-surface-100 disabled:opacity-40 dark:hover:bg-dark-800 dark:text-dark-400 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
