import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '../data/Skeleton';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  trend?: number;
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
}

export function StatCard({ label, value, icon, trend, tone = 'primary', loading }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <span className="stat-card-label">{label}</span>
        <strong className="stat-card-value">
          {loading ? <Skeleton width={120} height={28} /> : value}
        </strong>
        {trend != null && !loading && (
          <span className={`stat-card-trend ${trend >= 0 ? 'is-up' : 'is-down'}`}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend).toFixed(1)}%
            <span className="stat-card-trend-label">vs mois dernier</span>
          </span>
        )}
      </div>
    </div>
  );
}
