import { BadgeCheck, Banknote, Handshake, HeartHandshake, type LucideIcon } from 'lucide-react';
import { useAdherentDashboard } from '../hooks';
import type { ConventionStats, DashboardData } from '../model';
import { formatCurrency, formatNumber } from '../../../../shared/lib/formatters';
import './AdherentDashboardPage.css';

export function AdherentDashboardPage() {
  const dashboard = useAdherentDashboard();

  return (
    <div className="adh-dashboard-page">
      <header className="adh-dashboard-header">
        <div>
          <h1 className="adh-dashboard-title">Tableau de bord</h1>
          <p className="adh-dashboard-subtitle">Vue d'ensemble de votre espace adherent</p>
        </div>
      </header>

      <AdherentDashboardTiles
        data={dashboard.data}
        conventionStats={dashboard.conventionStats}
        hasConventionData={dashboard.hasConventionData}
        loading={dashboard.isLoading}
      />
    </div>
  );
}

function AdherentDashboardTiles({
  data,
  conventionStats,
  hasConventionData,
  loading,
}: {
  data?: DashboardData;
  conventionStats: ConventionStats;
  hasConventionData: boolean;
  loading?: boolean;
}) {
  const adhesionStatut = data?.adhesion?.statut === 'active' ? 'Active' : 'Inactive';
  const cotisation = data?.adhesion ? formatCurrency(data.adhesion.montantCotisation) : '-';
  const pretMontant = data?.activeLoan ? formatCurrency(data.activeLoan.montant) : '-';
  const indemnitesEnAttente = data ? formatNumber(data.pendingIndemnities) : '-';
  const conventionsActives = hasConventionData ? formatNumber(conventionStats.active) : '-';
  const conventionsMeta = hasConventionData
    ? `${formatNumber(conventionStats.pending)} en attente, ${formatNumber(conventionStats.available)} disponibles`
    : undefined;

  const tiles = [
    { label: 'Mon adhesion', value: adhesionStatut, meta: cotisation !== '-' ? `Cotisation ${cotisation}` : undefined, icon: BadgeCheck, tone: 'success' as const },
    { label: 'Pret en cours', value: pretMontant, meta: data?.activeLoan ? `${data.activeLoan.duree} mois` : 'Aucun pret actif', icon: Banknote, tone: 'primary' as const },
    { label: 'Indemnites en attente', value: indemnitesEnAttente, icon: HeartHandshake, tone: 'warning' as const },
    { label: 'Conventions actives', value: conventionsActives, meta: conventionsMeta, icon: Handshake, tone: 'info' as const },
  ];

  return (
    <div className="adh-dashboard-stats">
      {tiles.map((tile) => (
        <AdherentDashboardTile key={tile.label} loading={loading} {...tile} />
      ))}
    </div>
  );
}

function AdherentDashboardTile({
  icon: Icon,
  label,
  value,
  meta,
  tone,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  meta?: string;
  tone: 'success' | 'primary' | 'warning' | 'info';
  loading?: boolean;
}) {
  return (
    <article className={`adh-dashboard-tile ${loading ? 'is-loading' : ''}`}>
      <div className="adh-dashboard-tile-head">
        <span className={`adh-dashboard-tile-icon tone-${tone}`}>
          <Icon size={18} />
        </span>
        <span className="adh-dashboard-tile-label">{label}</span>
      </div>
      <div className="adh-dashboard-tile-value">{loading ? '-' : value}</div>
      {meta && <div className="adh-dashboard-tile-meta">{meta}</div>}
    </article>
  );
}
