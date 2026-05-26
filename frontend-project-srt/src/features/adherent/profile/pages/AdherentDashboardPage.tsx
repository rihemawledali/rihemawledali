/* ============================================
   Adherent Dashboard - cards-only overview
   ============================================ */

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Banknote, Handshake, HeartHandshake } from 'lucide-react';
import { dashboardApi } from '../dashboardApi';
import { conventionsApi, getAdherentConventionStatus } from '../../conventions/api';
import { formatCurrency, formatNumber } from '../../../../shared/lib/formatters';
import '../../layout/AdherentLayout.css';

export function AdherentDashboardPage() {
  const dashboard = useQuery({ queryKey: ['adherent', 'dashboard'], queryFn: dashboardApi.getDashboard });
  const conventions = useQuery({
    queryKey: ['adherent-conventions'],
    queryFn: () => conventionsApi.getConventions(),
  });
  const demandes = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });

  const data = dashboard.data;
  const loading = dashboard.isLoading || conventions.isLoading || demandes.isLoading;

  const adhesionStatut = data?.adhesion?.statut === 'active' ? 'Active' : 'Inactive';
  const cotisation = data?.adhesion ? formatCurrency(data.adhesion.montantCotisation) : '-';
  const pretMontant = data?.activeLoan ? formatCurrency(data.activeLoan.montant) : '-';
  const indemnitesEnAttente = data ? formatNumber(data.pendingIndemnities) : '-';
  const conventionStats = (conventions.data ?? []).reduce(
    (acc, convention) => {
      const status = getAdherentConventionStatus(convention, demandes.data ?? []);
      if (status === 'active') acc.active += 1;
      if (status === 'deja_demandee') acc.pending += 1;
      if (status === 'disponible') acc.available += 1;
      return acc;
    },
    { active: 0, pending: 0, available: 0 }
  );
  const conventionsActives = conventions.data ? formatNumber(conventionStats.active) : '-';
  const conventionsMeta = conventions.data
    ? `${formatNumber(conventionStats.pending)} en attente, ${formatNumber(conventionStats.available)} disponibles`
    : undefined;

  const tiles = [
    { label: 'Mon adhesion', value: adhesionStatut, meta: cotisation !== '-' ? `Cotisation ${cotisation}` : undefined, icon: BadgeCheck, tone: 'success' as const },
    { label: 'Pret en cours', value: pretMontant, meta: data?.activeLoan ? `${data.activeLoan.duree} mois` : 'Aucun pret actif', icon: Banknote, tone: 'primary' as const },
    { label: 'Indemnites en attente', value: indemnitesEnAttente, icon: HeartHandshake, tone: 'warning' as const },
    { label: 'Conventions actives', value: conventionsActives, meta: conventionsMeta, icon: Handshake, tone: 'info' as const },
  ];

  return (
    <div className="adh-page">
      <header className="adh-page-header">
        <div>
          <h1 className="adh-page-title">Tableau de bord</h1>
          <p className="adh-page-sub">Vue d'ensemble de votre espace adherent</p>
        </div>
      </header>

      <div className="adh-stats-grid">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <article className={`adh-tile ${loading ? 'is-loading' : ''}`} key={tile.label}>
              <div className="adh-tile-head">
                <span className={`adh-tile-icon tone-${tile.tone}`}>
                  <Icon size={18} />
                </span>
                <span className="adh-tile-label">{tile.label}</span>
              </div>
              <div className="adh-tile-value">{loading ? '-' : tile.value}</div>
              {tile.meta && <div className="adh-tile-meta">{tile.meta}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
