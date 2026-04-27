/* ============================================
   Bons & tickets — Adherent Portal
   Conventions are now in their dedicated section.
   ============================================ */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Ticket, AlertTriangle, Handshake, ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { offresApi } from '../api/offresApi';
import type { BonCommande, TicketRestaurant } from '../../../types/domain';

type Tab = 'bons' | 'tickets';

export function AdherentOffresPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('bons');

  const { data: offres, isLoading } = useQuery({
    queryKey: ['adherent-offres'],
    queryFn: () => offresApi.getOffres(),
  });

  const bonColumns = [
    { key: 'numero', header: 'Numéro', cell: (b: BonCommande) => b.numero, width: '140px' },
    { key: 'fournisseur', header: 'Fournisseur', cell: (b: BonCommande) => b.fournisseurNom },
    {
      key: 'montant',
      header: 'Montant',
      cell: (b: BonCommande) => `${b.montant.toFixed(0)} TND`,
      align: 'right' as const,
      width: '100px',
    },
    {
      key: 'dateExpiration',
      header: 'Expire le',
      cell: (b: BonCommande) => new Date(b.dateExpiration).toLocaleDateString('fr-FR'),
      width: '120px',
    },
    { key: 'statut', header: 'Statut', cell: (b: BonCommande) => <StatusBadge status={b.statut} />, width: '120px' },
  ];

  const ticketColumns = [
    { key: 'numero', header: 'Numéro', cell: (t: TicketRestaurant) => t.numero, width: '140px' },
    {
      key: 'type',
      header: 'Type',
      cell: (t: TicketRestaurant) => (t.typeBon === 'restaurant' ? 'Restaurant' : 'Cafétéria'),
      width: '120px',
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (t: TicketRestaurant) => `${t.montant.toFixed(2)} TND`,
      align: 'right' as const,
      width: '100px',
    },
    {
      key: 'dateEmission',
      header: 'Émis le',
      cell: (t: TicketRestaurant) => new Date(t.dateEmission).toLocaleDateString('fr-FR'),
      width: '120px',
    },
    { key: 'statut', header: 'Statut', cell: (t: TicketRestaurant) => <StatusBadge status={t.statut} />, width: '120px' },
  ];

  const availableBons = offres?.bons?.filter((b) => b.statut === 'attribue') || [];
  const availableTickets = offres?.tickets?.filter((t) => t.statut === 'attribue') || [];

  return (
    <div>
      <PageHeader
        title="Bons & tickets"
        description="Vos bons de commande et tickets restaurant attribués par l'amicale."
      />

      {/* Promo for conventions section */}
      <div
        className="adh-conv-promo"
        onClick={() => navigate('/adherent/conventions')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/adherent/conventions'); }}
      >
        <div className="adh-tile-icon tone-primary"><Handshake size={20} /></div>
        <div className="adh-conv-promo-text">
          <strong>Découvrez les conventions partenaires</strong>
          <span>Profitez de remises chez nos fournisseurs partenaires en demandant l\u2019adhésion à une convention.</span>
        </div>
        <ArrowRight size={18} className="adh-conv-promo-arrow" />
      </div>

      {/* KPI tiles */}
      <div className="adherent-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 'var(--space-5)' }}>
        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-info"><ShoppingBag size={20} /></div>
            <span className="adh-tile-label">Bons disponibles</span>
          </div>
          <div className="adh-tile-value">{availableBons.length}</div>
          <span className="adh-tile-meta">À utiliser avant expiration</span>
        </div>
        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-warning"><Ticket size={20} /></div>
            <span className="adh-tile-label">Tickets disponibles</span>
          </div>
          <div className="adh-tile-value">{availableTickets.length}</div>
          <span className="adh-tile-meta">Tickets restaurant attribués</span>
        </div>
      </div>

      {/* Tab nav */}
      <div role="tablist" style={{
        display: 'flex', gap: 4, padding: 4, marginBottom: 'var(--space-4)',
        background: 'white', border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-lg)', width: 'fit-content', maxWidth: '100%', overflowX: 'auto',
      }}>
        {([
          { k: 'bons',    label: 'Bons de commande',    icon: ShoppingBag, count: availableBons.length },
          { k: 'tickets', label: 'Tickets restaurant',  icon: Ticket,      count: availableTickets.length },
        ] as const).map(({ k, label, icon: Icon, count }) => {
          const active = activeTab === k;
          return (
            <button
              key={k}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(k)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', border: 'none', cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                background: active ? 'var(--color-primary-50)' : 'transparent',
                color: active ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
                fontWeight: active ? 600 : 500,
                fontSize: 'var(--font-size-sm)',
                whiteSpace: 'nowrap',
                transition: 'all 150ms',
              }}
            >
              <Icon size={16} />
              {label}
              <span style={{
                display: 'inline-block', minWidth: 20, padding: '0 6px',
                borderRadius: 999, fontSize: 11,
                background: active ? 'var(--color-primary-600)' : 'var(--color-surface-tertiary)',
                color: active ? 'white' : 'var(--color-text-secondary)',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'bons' && (
        <div className="adherent-adhesion-history">
          <div className="adherent-card-header">
            <h3><ShoppingBag size={18} style={{ marginRight: 8 }} /> Bons de commande</h3>
          </div>
          <DataTable
            columns={bonColumns}
            rows={offres?.bons || []}
            rowKey={(b) => b.id}
            loading={isLoading}
            emptyTitle="Aucun bon"
            emptyDescription="Vous n'avez pas encore de bon de commande."
          />
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="adherent-adhesion-history">
          <div className="adherent-card-header">
            <h3><Ticket size={18} style={{ marginRight: 8 }} /> Tickets restaurant</h3>
          </div>
          <DataTable
            columns={ticketColumns}
            rows={offres?.tickets || []}
            rowKey={(t) => t.id}
            loading={isLoading}
            emptyTitle="Aucun ticket"
            emptyDescription="Vous n'avez pas encore de ticket restaurant."
          />
        </div>
      )}

      {!isLoading && availableBons.length === 0 && availableTickets.length === 0 && (
        <div className="adh-alert info" style={{ marginTop: 'var(--space-4)' }}>
          <AlertTriangle size={18} className="adh-alert-icon" />
          <div>
            Vous n'avez actuellement aucun bon ni ticket disponible. Consultez les{' '}
            <Button variant="ghost" size="sm" onClick={() => navigate('/adherent/conventions')} style={{ padding: '0 4px', textDecoration: 'underline' }}>
              conventions partenaires
            </Button>{' '}
            pour profiter d'autres avantages.
          </div>
        </div>
      )}

      <style>{INLINE_STYLES}</style>
    </div>
  );
}

const INLINE_STYLES = `
.adh-conv-promo {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-4);
  background: linear-gradient(135deg, var(--color-primary-50), white);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 200ms;
}
.adh-conv-promo:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  border-color: var(--color-primary-300);
}
.adh-conv-promo-text {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.adh-conv-promo-text strong {
  color: var(--color-primary-700);
  font-size: var(--font-size-base);
}
.adh-conv-promo-text span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.adh-conv-promo-arrow {
  color: var(--color-primary-600);
  flex-shrink: 0;
  transition: transform 200ms;
}
.adh-conv-promo:hover .adh-conv-promo-arrow { transform: translateX(4px); }
`;
