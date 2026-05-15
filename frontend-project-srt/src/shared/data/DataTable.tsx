import type { ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SkeletonRows } from './Skeleton';
import { EmptyState } from './EmptyState';
import './DataTable.css';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  rowKey: (row: T) => string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowActions?: (row: T) => ReactNode;
  actionsWidth?: string;
}

export function DataTable<T>({
  columns, rows, loading, rowKey,
  sortBy, sortDir, onSortChange,
  emptyTitle, emptyDescription, rowActions, actionsWidth = '64px',
}: DataTableProps<T>) {
  if (loading) return <div className="data-table-card"><SkeletonRows cols={Math.min(columns.length, 6)} rows={6} /></div>;
  if (!rows.length) return <div className="data-table-card"><EmptyState title={emptyTitle} description={emptyDescription} /></div>;

  return (
    <div className="data-table-card">
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sortBy === col.key;
                const Icon = !col.sortable ? null : active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={col.key} style={{ width: col.width, textAlign: col.align ?? 'left' }}>
                    {col.sortable ? (
                      <button className={`data-table-sort ${active ? 'is-active' : ''}`} onClick={() => onSortChange?.(col.key)}>
                        {col.header}
                        {Icon && <Icon size={13} />}
                      </button>
                    ) : col.header}
                  </th>
                );
              })}
              {rowActions && <th style={{ width: actionsWidth, textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>{col.cell(row)}</td>
                ))}
                {rowActions && <td className="data-table-actions">{rowActions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
