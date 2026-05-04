import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
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
import { PageHeader } from '../../../components/layout/PageHeader';
import { dashboardApi } from '../dashboardApi';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import '../../admin/AdminManagementPages.css';
import './OverviewPage.css';

export function OverviewPage() {
  const stats = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: dashboardApi.stats });
  const data = stats.data;

  return (
    <div className="admin-surface overview-page">
      <PageHeader
        title="Tableau de bord"
        description="Vue d’ensemble de l’activité du système SRT"
        breadcrumb={['Administration', 'Tableau de bord']}
      />

      <section className="admin-hero">
        <div>
          <span className="admin-hero-kicker">Pilotage administratif</span>
          <h2>Vue opérationnelle</h2>
          <p>Suivi des adhérents, des flux financiers, des prêts et des dossiers en attente.</p>
        </div>
      </section>

      <section className="admin-metrics is-dashboard" aria-label="Indicateurs administrateur">
        <AdminMetric
          icon={Users}
          label="Total adhérents"
          value={data ? formatNumber(data.totalAdherents) : '—'}
          tone="info"
          loading={stats.isLoading}
        />
        <AdminMetric
          icon={Banknote}
          label="Prêts actifs"
          value={data ? formatNumber(data.pretsActifs) : '—'}
          tone="neutral"
          loading={stats.isLoading}
        />
        <AdminMetric
          icon={Wallet}
          label="Revenu total"
          value={data ? formatCurrency(data.revenuTotal) : '—'}
          tone="success"
          loading={stats.isLoading}
        />
        <AdminMetric
          icon={ClockAlert}
          label="Demandes en attente"
          value={data ? formatNumber(data.demandesEnAttente) : '—'}
          tone="warning"
          loading={stats.isLoading}
        />
        <AdminMetric
          icon={Building2}
          label="Fournisseurs actifs"
          value={data ? formatNumber(data.fournisseursActifs) : '—'}
          tone="info"
          loading={stats.isLoading}
        />
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-dashboard-panel">
          <header className="admin-dashboard-panel-head">
            <div>
              <span className="admin-section-kicker">Tendances</span>
              <h3>Évolution du mois</h3>
              <p>Comparaison synthétique avec le mois précédent.</p>
            </div>
          </header>
          <div className="admin-dashboard-list">
            <DashboardRow label="Adhérents" value={formatTrend(data?.trendAdherents)} />
            <DashboardRow label="Revenus" value={formatTrend(data?.trendRevenu)} />
            <DashboardRow label="Prêts" value={formatTrend(data?.trendPrets)} />
            <DashboardRow label="Demandes" value={formatTrend(data?.trendDemandes)} />
          </div>
        </article>

        <article className="admin-dashboard-panel">
          <header className="admin-dashboard-panel-head">
            <div>
              <span className="admin-section-kicker">Contrôle</span>
              <h3>Priorités</h3>
              <p>Points à consulter dans les modules de gestion.</p>
            </div>
          </header>
          <div className="admin-dashboard-list">
            <DashboardRow label="Dossiers en attente" value={data ? formatNumber(data.demandesEnAttente) : '—'} />
            <DashboardRow label="Comptes adhérents" value={data ? formatNumber(data.totalAdherents) : '—'} />
            <DashboardRow label="Partenaires actifs" value={data ? formatNumber(data.fournisseursActifs) : '—'} />
          </div>
        </article>
      </section>
    </div>
  );
}

function AdminMetric({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'info' | 'neutral';
  loading?: boolean;
}) {
  return (
    <article className={`admin-metric is-${tone}`}>
      <span className="admin-metric-icon">
        {loading ? <LayoutDashboard size={18} /> : <Icon size={18} />}
      </span>
      <div>
        <strong>{loading ? '—' : value}</strong>
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
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
