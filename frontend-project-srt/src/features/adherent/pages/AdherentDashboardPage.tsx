/* ============================================
   Adherent Dashboard — Cards-only overview
   ============================================ */

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Banknote, HeartHandshake, Tag, Handshake, Wallet } from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { conventionsApi } from '../api/conventionsApi';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import '../layout/AdherentLayout.css';

export function AdherentDashboardPage() {
  const dashboard = useQuery({ queryKey: ['adherent', 'dashboard'], queryFn: dashboardApi.getDashboard });
  const conventions = useQuery({ queryKey: ['adherent', 'conventions'], queryFn: conventionsApi.getConventions });
  const activeConventionsCount = conventions.data?.filter((c) => c.joined && c.statut === 'active').length ?? 0;

  const data = dashboard.data;
  const loading = dashboard.isLoading;

  const adhesionStatut = data?.adhesion?.statut === 'active' ? 'Active' : 'Inactive';
  const cotisation = data?.adhesion ? formatCurrency(data.adhesion.montantCotisation) : '—';
  const pretMontant = data?.activeLoan ? formatCurrency(data.activeLoan.montant) : '—';
  const indemnitesEnAttente = data ? formatNumber(data.pendingIndemnities) : '—';
  const ticketsDispo = data ? formatNumber(data.availableOffers) : '—';
  const conventionsActives = conventions.isLoading ? '—' : formatNumber(activeConventionsCount);
  const solde = data?.financialChart?.length
    ? formatCurrency(data.financialChart[data.financialChart.length - 1].solde)
    : '—';

  const tiles = [
    { label: 'Mon adhésion', value: adhesionStatut, meta: cotisation !== '—' ? `Cotisation ${cotisation}` : undefined, icon: BadgeCheck, tone: 'success' as const },
    { label: 'Prêt en cours', value: pretMontant, meta: data?.activeLoan ? `${data.activeLoan.duree} mois` : 'Aucun prêt actif', icon: Banknote, tone: 'primary' as const },
    { label: 'Indemnités en attente', value: indemnitesEnAttente, icon: HeartHandshake, tone: 'warning' as const },
    { label: 'Tickets restaurant', value: ticketsDispo, meta: 'Disponibles', icon: Tag, tone: 'info' as const },
    { label: 'Conventions actives', value: conventionsActives, icon: Handshake, tone: 'violet' as const },
    { label: 'Solde estimé', value: solde, icon: Wallet, tone: 'success' as const },
  ];

  return (
    <div className="adh-page">
      <header className="adh-page-header">
        <div>
          <h1 className="adh-page-title">Tableau de bord</h1>
          <p className="adh-page-sub">Vue d'ensemble de votre espace adhérent</p>
        </div>
      </header>

      <div className="adh-stats-grid">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <article className={`adh-tile ${loading ? 'is-loading' : ''}`} key={t.label}>
              <div className="adh-tile-head">
                <span className={`adh-tile-icon tone-${t.tone}`}>
                  <Icon size={18} />
                </span>
                <span className="adh-tile-label">{t.label}</span>
              </div>
              <div className="adh-tile-value">{loading ? '—' : t.value}</div>
              {t.meta && <div className="adh-tile-meta">{t.meta}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
