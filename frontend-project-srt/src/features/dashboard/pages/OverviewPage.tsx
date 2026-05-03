import { useQuery } from '@tanstack/react-query';
import {
  Users, Banknote, Wallet, ClockAlert, FileSignature, Building2,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { StatCard } from '../../../components/charts/StatCard';
import { dashboardApi } from '../dashboardApi';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import './OverviewPage.css';

export function OverviewPage() {
  const stats = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: dashboardApi.stats });

  return (
    <div className="overview-page">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité du système SRT"
        breadcrumb={['Administration', 'Tableau de bord']}
      />

      <div className="overview-stats">
        <StatCard
          label="Total adhérents"
          value={stats.data ? formatNumber(stats.data.totalAdherents) : '—'}
          icon={<Users size={22} />}
          tone="primary"
          trend={stats.data?.trendAdherents}
          loading={stats.isLoading}
        />
        <StatCard
          label="Prêts actifs"
          value={stats.data ? formatNumber(stats.data.pretsActifs) : '—'}
          icon={<Banknote size={22} />}
          tone="info"
          trend={stats.data?.trendPrets}
          loading={stats.isLoading}
        />
        <StatCard
          label="Revenu total"
          value={stats.data ? formatCurrency(stats.data.revenuTotal) : '—'}
          icon={<Wallet size={22} />}
          tone="success"
          trend={stats.data?.trendRevenu}
          loading={stats.isLoading}
        />
        <StatCard
          label="Demandes en attente"
          value={stats.data ? formatNumber(stats.data.demandesEnAttente) : '—'}
          icon={<ClockAlert size={22} />}
          tone="warning"
          trend={stats.data?.trendDemandes}
          loading={stats.isLoading}
        />
        <StatCard
          label="Conventions actives"
          value={stats.data ? formatNumber(stats.data.conventionsActives) : '—'}
          icon={<FileSignature size={22} />}
          tone="primary"
          loading={stats.isLoading}
        />
        <StatCard
          label="Fournisseurs actifs"
          value={stats.data ? formatNumber(stats.data.fournisseursActifs) : '—'}
          icon={<Building2 size={22} />}
          tone="info"
          loading={stats.isLoading}
        />
      </div>

    </div>
  );
}
