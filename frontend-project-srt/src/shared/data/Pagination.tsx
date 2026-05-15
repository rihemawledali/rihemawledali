import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

interface PaginationProps {
  page: number;
  size: number;
  total: number;
  onPageChange: (p: number) => void;
}

export function Pagination({ page, size, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(page * size, total);

  return (
    <div className="pagination">
      <span className="pagination-info">
        {start.toLocaleString('fr-FR')}-{end.toLocaleString('fr-FR')} sur {total.toLocaleString('fr-FR')}
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="pagination-page">Page {page} / {totalPages}</span>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
