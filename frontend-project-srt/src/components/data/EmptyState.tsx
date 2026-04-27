import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title = 'Aucune donnée',
  description = 'Aucun élément à afficher pour le moment.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon ?? <Inbox size={32} />}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
