
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ticket, Coffee, UtensilsCrossed,
} from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { DataTable } from '../../../../shared/data/DataTable';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { Button } from '../../../../shared/ui/Button';
import { useToast } from '../../../../shared/feedback/useToast';
import { offresApi } from '../api';
import type { TicketAssignment } from '../../../../shared/types/domain';
import './AdherentOffresPage.css';

type StatusFilter = 'all' | 'attribue' | 'utilise' | 'expire';

const FILTERS: { k: StatusFilter; label: string }[] = [
  { k: 'all', label: 'Tous' },
  { k: 'attribue', label: 'À accepter' },
  { k: 'utilise', label: 'Acceptés' },
  { k: 'expire', label: 'Expirés' },
];

export function AdherentOffresPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: offres, isLoading } = useQuery({
    queryKey: ['adherent-offres'],
    queryFn: () => offresApi.getOffres(),
  });

  const allAssignments = useMemo(() => offres?.ticketAssignments || [], [offres]);
  const hasTickets = allAssignments.length > 0;

  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'all') return allAssignments;
    return allAssignments.filter((ticket) => ticket.statut === statusFilter);
  }, [allAssignments, statusFilter]);

  const acceptAssignment = useMutation({
    mutationFn: (id: string) => offresApi.acceptTicketAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adherent-offres'] });
      queryClient.invalidateQueries({ queryKey: ['adherent', 'dashboard'] });
      toast.push({
        title: 'Tickets acceptes',
        description: '50% de leur valeur sera ajoute a votre retenue mensuelle.',
        variant: 'success',
      });
    },
    onError: (error) => toast.push({ title: error instanceof Error ? error.message : 'Erreur', variant: 'error' }),
  });

  const rejectAssignment = useMutation({
    mutationFn: (id: string) => offresApi.rejectTicketAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adherent-offres'] });
      queryClient.invalidateQueries({ queryKey: ['adherent', 'dashboard'] });
      toast.push({ title: 'Tickets refuses', variant: 'success' });
    },
    onError: (error) => toast.push({ title: error instanceof Error ? error.message : 'Erreur', variant: 'error' }),
  });

  const ticketColumns = [
    {
      key: 'numero',
      header: 'Tickets',
      cell: (ticket: TicketAssignment) => <TicketNumber ticket={ticket} />,
      width: '210px',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (ticket: TicketAssignment) => <TicketType ticket={ticket} />,
      width: '160px',
    },
    {
      key: 'quantite',
      header: 'Quantite',
      cell: (ticket: TicketAssignment) => (
        <span className="adh-offer-ticket-count">
          {ticket.quantite} ticket{ticket.quantite > 1 ? 's' : ''}
        </span>
      ),
      align: 'right' as const,
      width: '120px',
    },
    {
      key: 'montant',
      header: 'Total',
      cell: (ticket: TicketAssignment) => (
        <span className="adh-offer-ticket-amount">{ticket.montantTotal.toFixed(2)} TND</span>
      ),
      align: 'right' as const,
      width: '120px',
    },
    {
      key: 'dateEmission',
      header: 'Attribue le',
      cell: (ticket: TicketAssignment) => formatTicketDate(ticket),
      width: '130px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (ticket: TicketAssignment) => (
        <StatusBadge
          status={ticket.statut}
          label={ticket.statut === 'attribue' ? 'À accepter' : ticket.statut === 'utilise' ? 'Accepté' : undefined}
        />
      ),
      width: '130px',
    },
    {
      key: 'actions',
      header: 'Decision',
      cell: (ticket: TicketAssignment) => (
        <TicketActions
          ticket={ticket}
          acceptAssignment={acceptAssignment}
          rejectAssignment={rejectAssignment}
        />
      ),
      align: 'right' as const,
      width: '190px',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tickets restaurant"
        description="Vos tickets restaurant et cafétéria attribués par l'amicale."
      />
      {!isLoading && !hasTickets ? (
        <NoTicketsNotice />
      ) : (
        <>
          <StatusTabs
            value={statusFilter}
            tickets={allAssignments}
            onChange={setStatusFilter}
          />

          <section className="adh-card">
            <div className="adh-card-header">
              <h3 className="adh-card-title">
                <Ticket size={16} /> Mes attributions de tickets
              </h3>
              <span className="adh-card-subtitle">
                {filteredAssignments.length} attribution{filteredAssignments.length > 1 ? 's' : ''}
              </span>
            </div>
            <DataTable
              columns={ticketColumns}
              rows={filteredAssignments}
              rowKey={(ticket) => ticket.id}
              loading={isLoading}
              emptyTitle="Aucune attribution"
              emptyDescription="Vous n'avez pas encore d'attribution de tickets pour ce filtre."
            />
          </section>
        </>
      )}
    </div>
  );
}

function NoTicketsNotice() {
  return (
    <section className="adh-card adh-offer-empty-panel">
      <div className="adh-offer-empty-icon">
        <Ticket size={20} />
      </div>
      <div>
        <h3>Aucun ticket attribue</h3>
        <p>
          Vous n'avez pas encore de tickets restaurant ou cafeteria sur votre compte.
          Les nouvelles attributions apparaitront ici des qu'elles seront disponibles.
        </p>
      </div>
    </section>
  );
}

function StatusTabs({ value, tickets, onChange }: {
  value: StatusFilter;
  tickets: TicketAssignment[];
  onChange: (value: StatusFilter) => void;
}) {
  return (
    <div role="tablist" className="adh-offer-tabs">
      {FILTERS.map((filter) => {
        const active = value === filter.k;
        const count = getFilterCount(tickets, filter.k);

        return (
          <button
            key={filter.k}
            type="button"
            role="tab"
            aria-selected={active}
            className={`adh-offer-tab ${active ? 'is-active' : ''}`}
            onClick={() => onChange(filter.k)}
          >
            {filter.label}
            <span className="adh-offer-tab-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function TicketNumber({ ticket }: { ticket: TicketAssignment }) {
  return (
    <span className="adh-offer-ticket-number">
      <strong>{formatTicketRange(ticket)}</strong>
      {ticket.bonCommandeNumero && <small className="cell-muted">{ticket.bonCommandeNumero}</small>}
    </span>
  );
}

function TicketType({ ticket }: { ticket: TicketAssignment }) {
  const Icon = ticket.typeBon === 'restaurant' ? UtensilsCrossed : Coffee;
  return (
    <span className="adh-offer-ticket-type">
      <Icon size={14} className="adh-offer-ticket-icon" />
      {ticket.typeBon === 'restaurant' ? 'Restaurant' : 'Cafétéria'}
    </span>
  );
}

function TicketActions({ ticket, acceptAssignment, rejectAssignment }: {
  ticket: TicketAssignment;
  acceptAssignment: any;
  rejectAssignment: any;
}) {
  if (ticket.statut !== 'attribue') return <span className="cell-muted">Decide</span>;

  return (
    <span className="adh-offer-actions">
      <Button
        size="sm"
        onClick={() => acceptAssignment.mutate(ticket.id)}
        isLoading={acceptAssignment.isPending && acceptAssignment.variables === ticket.id}
        disabled={rejectAssignment.isPending}
      >
        Accepter
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => rejectAssignment.mutate(ticket.id)}
        isLoading={rejectAssignment.isPending && rejectAssignment.variables === ticket.id}
        disabled={acceptAssignment.isPending}
      >
        Refuser
      </Button>
    </span>
  );
}

function getFilterCount(tickets: TicketAssignment[], filter: StatusFilter) {
  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter((ticket) => ticket.statut === filter);

  return filteredTickets.reduce((sum, ticket) => sum + ticket.quantite, 0);
}

function formatTicketDate(ticket: TicketAssignment) {
  const date = ticket.dateAttribution || ticket.dateEmission;
  return new Date(date).toLocaleDateString('fr-FR');
}

function formatTicketRange(ticket: TicketAssignment) {
  return ticket.firstNumero === ticket.lastNumero
    ? ticket.firstNumero
    : `${ticket.firstNumero} - ${ticket.lastNumero}`;
}
