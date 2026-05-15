/* ============================================
   Tickets restaurant — Adherent Portal
   Conventions live in their dedicated section.
   ============================================ */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, AlertTriangle, Handshake, ArrowRight, Coffee, UtensilsCrossed,
} from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { DataTable } from '../../../../shared/data/DataTable';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { Button } from '../../../../shared/ui/Button';
import { offresApi } from '../api';
import { useToast } from '../../../../shared/feedback/useToast';
import type { TicketRestaurant } from '../../../../shared/types/domain';

type StatusFilter = 'all' | 'attribue' | 'utilise' | 'expire';

export function AdherentOffresPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: offres, isLoading } = useQuery({
    queryKey: ['adherent-offres'],
    queryFn: () => offresApi.getOffres(),
  });

  const allTickets = useMemo(() => offres?.tickets || [], [offres]);

  const acceptTicket = useMutation({
    mutationFn: (id: string) => offresApi.acceptTicket(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-offres'] });
      qc.invalidateQueries({ queryKey: ['adherent-dashboard'] });
      toast.push({
        title: 'Ticket accepte',
        description: '50% de sa valeur sera ajoute a votre retenue mensuelle.',
        variant: 'success',
      });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const rejectTicket = useMutation({
    mutationFn: (id: string) => offresApi.rejectTicket(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-offres'] });
      qc.invalidateQueries({ queryKey: ['adherent-dashboard'] });
      toast.push({ title: 'Ticket refuse', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const stats = useMemo(() => {
    const available = allTickets.filter((t) => t.statut === 'attribue');
    const used = allTickets.filter((t) => t.statut === 'utilise');
    const totalAvailable = available.reduce((sum, t) => sum + t.montant, 0);
    return {
      availableCount: available.length,
      usedCount: used.length,
      totalAvailable,
    };
  }, [allTickets]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return allTickets;
    return allTickets.filter((t) => t.statut === statusFilter);
  }, [allTickets, statusFilter]);

  const ticketColumns = [
    {
      key: 'numero',
      header: 'Numéro',
      cell: (t: TicketRestaurant) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.numero}</span>
      ),
      width: '160px',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (t: TicketRestaurant) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {t.typeBon === 'restaurant'
            ? <UtensilsCrossed size={14} style={{ color: '#8a92a6' }} />
            : <Coffee size={14} style={{ color: '#8a92a6' }} />}
          {t.typeBon === 'restaurant' ? 'Restaurant' : 'Cafétéria'}
        </span>
      ),
      width: '160px',
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (t: TicketRestaurant) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {t.montant.toFixed(2)} TND
        </span>
      ),
      align: 'right' as const,
      width: '120px',
    },
    {
      key: 'dateEmission',
      header: 'Émis le',
      cell: (t: TicketRestaurant) => new Date(t.dateEmission).toLocaleDateString('fr-FR'),
      width: '130px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (t: TicketRestaurant) => (
        <StatusBadge
          status={t.statut}
          label={t.statut === 'attribue' ? 'À accepter' : t.statut === 'utilise' ? 'Accepté' : undefined}
        />
      ),
      width: '130px',
    },
    {
      key: 'actions',
      header: 'Decision',
      cell: (t: TicketRestaurant) => t.statut === 'attribue' ? (
        <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button
            size="sm"
            onClick={() => acceptTicket.mutate(t.id)}
            isLoading={acceptTicket.isPending && acceptTicket.variables === t.id}
            disabled={rejectTicket.isPending}
          >
            Accepter
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => rejectTicket.mutate(t.id)}
            isLoading={rejectTicket.isPending && rejectTicket.variables === t.id}
            disabled={acceptTicket.isPending}
          >
            Refuser
          </Button>
        </span>
      ) : <span className="cell-muted">Decide</span>,
      align: 'right' as const,
      width: '190px',
    },
  ];

  const filters: { k: StatusFilter; label: string }[] = [
    { k: 'all',      label: 'Tous' },
    { k: 'attribue', label: 'À accepter' },
    { k: 'utilise',  label: 'Acceptés' },
    { k: 'expire',   label: 'Expirés' },
  ];

  return (
    <div>
      <PageHeader
        title="Tickets restaurant"
        description="Vos tickets restaurant et cafétéria attribués par l'amicale."
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
          <span>Profitez de remises chez nos fournisseurs partenaires en demandant l&rsquo;adhésion à une convention.</span>
        </div>
        <ArrowRight size={18} className="adh-conv-promo-arrow" />
      </div>

      {/* KPI tiles */}
      <div className="adh-stats-grid">
        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-warning"><Ticket size={18} /></div>
            <span className="adh-tile-label">Tickets à accepter</span>
          </div>
          <div className="adh-tile-value">{stats.availableCount}</div>
          <span className="adh-tile-meta">Accepter ou refuser</span>
        </div>

        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-primary"><UtensilsCrossed size={18} /></div>
            <span className="adh-tile-label">Valeur à décider</span>
          </div>
          <div className="adh-tile-value">
            {stats.totalAvailable.toFixed(0)} <span style={{ fontSize: '0.95rem', color: 'var(--adh-text-3)' }}>TND</span>
          </div>
          <span className="adh-tile-meta">50% retenu après acceptation</span>
        </div>

        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-success"><Coffee size={18} /></div>
            <span className="adh-tile-label">Tickets acceptés</span>
          </div>
          <div className="adh-tile-value">{stats.usedCount}</div>
          <span className="adh-tile-meta">Ajoutés à la retenue</span>
        </div>
      </div>

      {/* Status filters */}
      <div role="tablist" style={{
        display: 'flex', gap: 4, padding: 4, marginBottom: 16,
        background: 'var(--adh-surface)', border: '1px solid var(--adh-border)',
        borderRadius: 10, width: 'fit-content', maxWidth: '100%', overflowX: 'auto',
      }}>
        {filters.map((f) => {
          const active = statusFilter === f.k;
          const count = f.k === 'all'
            ? allTickets.length
            : allTickets.filter((t) => t.statut === f.k).length;
          return (
            <button
              key={f.k}
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(f.k)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', border: 'none', cursor: 'pointer',
                borderRadius: 8,
                background: active ? '#eff6ff' : 'transparent',
                color: active ? '#1d4ed8' : 'var(--adh-text-2)',
                fontWeight: active ? 600 : 500,
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                transition: 'all 150ms',
              }}
            >
              {f.label}
              <span style={{
                display: 'inline-block', minWidth: 20, padding: '0 6px',
                borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: active ? '#2563eb' : 'var(--adh-surface-2)',
                color: active ? 'white' : 'var(--adh-text-2)',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      <section className="adh-card">
        <div className="adh-card-header">
          <h3 className="adh-card-title">
            <Ticket size={16} /> Mes tickets restaurant
          </h3>
          <span className="adh-card-subtitle">
            {filteredTickets.length} ticket{filteredTickets.length > 1 ? 's' : ''}
          </span>
        </div>
        <DataTable
          columns={ticketColumns}
          rows={filteredTickets}
          rowKey={(t) => t.id}
          loading={isLoading}
          emptyTitle="Aucun ticket"
          emptyDescription="Vous n'avez pas encore de ticket restaurant pour ce filtre."
        />
      </section>

      {!isLoading && stats.availableCount === 0 && (
        <div className="adh-alert info" style={{ marginTop: 16 }}>
          <AlertTriangle size={16} className="adh-alert-icon" />
          <div>
            Vous n'avez actuellement aucun ticket restaurant à accepter. Consultez les{' '}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/adherent/conventions')}
              style={{ padding: '0 4px', textDecoration: 'underline' }}
            >
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
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #eef4ff, white);
  border: 1px solid #dbeafe;
  border-radius: 12px;
  cursor: pointer;
  transition: all 200ms;
  box-shadow: var(--adh-shadow-xs);
}
.adh-conv-promo:hover {
  transform: translateY(-1px);
  box-shadow: var(--adh-shadow-sm);
  border-color: #93c5fd;
}
.adh-conv-promo-text {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.adh-conv-promo-text strong {
  color: #1d4ed8;
  font-size: 0.875rem;
  font-weight: 600;
}
.adh-conv-promo-text span {
  color: var(--adh-text-2);
  font-size: 0.8125rem;
}
.adh-conv-promo-arrow {
  color: #2563eb;
  flex-shrink: 0;
  transition: transform 200ms;
}
.adh-conv-promo:hover .adh-conv-promo-arrow { transform: translateX(4px); }
`;
