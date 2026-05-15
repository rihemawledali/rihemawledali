import type { ReactNode } from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: string[];
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="page-header-breadcrumb" aria-label="Fil d'Ariane">
            {breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="page-header-sep">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'is-current' : ''}>{b}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
