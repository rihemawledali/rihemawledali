import type { ReactNode } from 'react';
import './ChartCard.css';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  height?: number;
}

export function ChartCard({ title, subtitle, action, children, height = 280 }: ChartCardProps) {
  return (
    <section className="chart-card">
      <header className="chart-card-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="chart-card-body" style={{ height }}>
        {children}
      </div>
    </section>
  );
}
