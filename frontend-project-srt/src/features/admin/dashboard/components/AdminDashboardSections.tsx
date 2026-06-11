import {
  Banknote,
  Building2,
  ClockAlert,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../../shared/lib/formatters';
import type { DashboardStats } from '../model';

export function AdminDashboardMetrics({
  data,
  loading,
}: {
  data?: DashboardStats;
  loading?: boolean;
}) {
  return (
    <section className="admin-metrics is-dashboard" aria-label="Indicateurs administrateur">
      <AdminMetric
        icon={Users}
        label="Total adherents"
        value={data ? formatNumber(data.totalAdherents) : '-'}
        tone="info"
        loading={loading}
      />
      <AdminMetric
        icon={Banknote}
        label="Prets actifs"
        value={data ? formatNumber(data.pretsActifs) : '-'}
        tone="neutral"
        loading={loading}
      />
      <AdminMetric
        icon={Wallet}
        label="Revenu total"
        value={data ? formatCurrency(data.revenuTotal) : '-'}
        tone="success"
        loading={loading}
      />
      <AdminMetric
        icon={ClockAlert}
        label="Demandes en attente"
        value={data ? formatNumber(data.demandesEnAttente) : '-'}
        tone="warning"
        loading={loading}
      />
      <AdminMetric
        icon={Building2}
        label="Fournisseurs actifs"
        value={data ? formatNumber(data.fournisseursActifs) : '-'}
        tone="info"
        loading={loading}
      />
    </section>
  );
}

export function AdminTrendPanel({ data }: { data?: DashboardStats }) {
  return (
    <article className="admin-dashboard-panel">
      <header className="admin-dashboard-panel-head">
        <div>
          <span className="admin-section-kicker">Tendances</span>
          <h3>Evolution du mois</h3>
          <p>Comparaison synthetique avec le mois precedent.</p>
        </div>
      </header>
      <div className="admin-dashboard-list">
        <DashboardRow label="Adherents" value={formatTrend(data?.trendAdherents)} />
        <DashboardRow label="Revenus" value={formatTrend(data?.trendRevenu)} />
        <DashboardRow label="Prets" value={formatTrend(data?.trendPrets)} />
        <DashboardRow label="Demandes" value={formatTrend(data?.trendDemandes)} />
      </div>
    </article>
  );
}

export function AdminPriorityPanel({ data }: { data?: DashboardStats }) {
  return (
    <article className="admin-dashboard-panel">
      <header className="admin-dashboard-panel-head">
        <div>
          <span className="admin-section-kicker">Controle</span>
          <h3>Priorites</h3>
          <p>Points a consulter dans les modules de gestion.</p>
        </div>
      </header>
      <div className="admin-dashboard-list">
        <DashboardRow label="Dossiers en attente" value={data ? formatNumber(data.demandesEnAttente) : '-'} />
        <DashboardRow label="Comptes adherents" value={data ? formatNumber(data.totalAdherents) : '-'} />
        <DashboardRow label="Partenaires actifs" value={data ? formatNumber(data.fournisseursActifs) : '-'} />
      </div>
    </article>
  );
}

function AdminMetric({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: any) {
  return (
    <article className={`admin-metric is-${tone}`}>
      <span className="admin-metric-icon">
        {loading ? <LayoutDashboard size={18} /> : <Icon size={18} />}
      </span>
      <div>
        <strong>{loading ? '-' : value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function DashboardRow({ label, value }: { label: string; value: string }) {
  const isPositive = value.startsWith('+');
  return (
    <div className="admin-dashboard-row">
      <span>{label}</span>
      <strong>
        {isPositive ? <TrendingUp size={14} className="admin-btn-icon" /> : <ShieldCheck size={14} className="admin-btn-icon" />}
        {value}
      </strong>
    </div>
  );
}

function formatTrend(value?: number) {
  if (value == null) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
