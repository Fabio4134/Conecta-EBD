import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = 'registros'
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const isAll = pageSize >= totalItems || pageSize >= 9999;
  const totalPages = isAll ? 1 : Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : isAll ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = isAll ? totalItems : Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="p-4 border-t border-neutral-200/60 bg-white/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-neutral-600">
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        <span>
          Mostrando <span className="font-bold text-neutral-900">{startItem}</span> a{' '}
          <span className="font-bold text-neutral-900">{endItem}</span> de{' '}
          <span className="font-bold text-neutral-900">{totalItems}</span> {itemName}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-200">
            <span className="text-xs text-neutral-500 font-medium">Por página:</span>
            <select
              value={isAll ? 'all' : pageSize}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  onPageSizeChange(99999);
                } else {
                  onPageSizeChange(Number(val));
                }
                onPageChange(1);
              }}
              className="px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="all">Todos</option>
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 transition-colors shadow-sm"
            title="Primeira página"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 transition-colors shadow-sm"
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={idx}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    currentPage === p
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={idx} className="px-1 text-neutral-400 font-bold">
                  {p}
                </span>
              )
            )}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 transition-colors shadow-sm"
            title="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 transition-colors shadow-sm"
            title="Última página"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
