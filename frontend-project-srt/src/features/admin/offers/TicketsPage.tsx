import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, PackageCheck, Search, Ticket, UserRound } from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { Button } from '../../../shared/ui/Button';
import { DataTable, type Column } from '../../../shared/data/DataTable';
import { Pagination } from '../../../shared/data/Pagination';
import { SearchInput } from '../../../shared/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../shared/data/FilterBar';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { useToast } from '../../../shared/feedback/useToast';
import { bonsCommandeApi, ticketsApi, treasurerAdherentsApi } from './offersApi';
import { formatCurrency, formatDate, formatNumber } from '../../../shared/lib/formatters';
import type { TicketRestaurant } from '../../../shared/types/domain';
import '../../../shared/layout/CrudPage.css';
import './OffersPages.css';

interface TicketLocationState {
  bonCommandeId?: string;
}

const TICKET_STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'attribue', label: 'Attribue' },
  { value: 'utilise', label: 'Utilise' },
  { value: 'expire', label: 'Expire' },
];

interface TicketCountRow {
  id: string;
  bonCommandeNumero: string;
  adherentNom?: string;
  adherentMatricule?: string;
  statut: TicketRestaurant['statut'];
  dateAttribution?: string;
  quantite: number;
  montantTotal: number;
}

export function TicketsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const location = useLocation();
  const state = location.state as TicketLocationState | null;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [selectedBonId, setSelectedBonId] = useState(state?.bonCommandeId ?? '');
  const [selectedAdherentId, setSelectedAdherentId] = useState('');
  const [quantite, setQuantite] = useState(1);

  const bons = useQuery({
    queryKey: ['bons-commande', 'assignable'],
    queryFn: () => bonsCommandeApi.list({ page: 1, size: 1000, filters: { statut: 'valide' } }),
  });

  const adherents = useQuery({
    queryKey: ['treasurer', 'adherents', 'ticket-options'],
    queryFn: () => treasurerAdherentsApi.list({ page: 1, size: 1000, filters: { role: 'adherent' } }),
  });

  const assignableBons = useMemo(
    () => (bons.data?.items ?? []).filter((bon) => bon.statut === 'valide' && (bon.quantiteRestante ?? 0) > 0),
    [bons.data],
  );

  const effectiveBonId = selectedBonId || assignableBons[0]?.id || '';

  const tickets = useQuery({
    queryKey: ['tickets', { search, statut, effectiveBonId }],
    queryFn: () => effectiveBonId
      ? ticketsApi.listByBon(effectiveBonId, { page: 1, size: 5000, search, filters: { statut } })
      : ticketsApi.list({ page: 1, size: 5000, search, filters: { statut } }),
  });

  const selectedBon = useMemo(
    () => (bons.data?.items ?? []).find((bon) => bon.id === effectiveBonId),
    [bons.data, effectiveBonId],
  );

  const assign = useMutation({
    mutationFn: () => ticketsApi.assign({
      bonCommandeId: effectiveBonId,
      adherentId: selectedAdherentId,
      quantite,
    }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['bons-commande'] });
      setQuantite(1);
      toast.push({
        title: `${created.length} ticket(s) attribue(s)`,
        variant: 'success',
      });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const stats = useMemo(() => {
    const rows = tickets.data?.items ?? [];
    return {
      visible: tickets.data?.total ?? 0,
      libres: rows.filter((ticket) => ticket.statut === 'en_attente').length,
      attribues: rows.filter((ticket) => ticket.statut === 'attribue').length,
    };
  }, [tickets.data]);

  const groupedRows = useMemo(
    () => groupTicketsByAssignment(tickets.data?.items ?? []),
    [tickets.data],
  );

  const pageRows = useMemo(
    () => groupedRows.slice((page - 1) * 10, page * 10),
    [groupedRows, page],
  );

  const columns: Column<TicketCountRow>[] = useMemo(() => [
    {
      key: 'bonCommandeNumero',
      header: 'Bon',
      cell: (row) => (
        <div className="offer-main-cell">
          <span className="cell-mono">{row.bonCommandeNumero}</span>
          <small>{formatNumber(row.quantite)} ticket(s)</small>
        </div>
      ),
    },
    {
      key: 'adherentNom',
      header: 'Adherent',
      cell: (row) => row.adherentNom ? (
        <div className="offer-main-cell">
          <strong className="cell-strong">{row.adherentNom}</strong>
          {row.adherentMatricule && <small>{row.adherentMatricule}</small>}
        </div>
      ) : <span className="cell-muted">Stock non attribue</span>,
    },
    {
      key: 'quantite',
      header: 'Nombre',
      align: 'right',
      width: '110px',
      cell: (row) => <strong className="amount">{formatNumber(row.quantite)}</strong>,
    },
    {
      key: 'montantTotal',
      header: 'Valeur totale',
      align: 'right',
      width: '120px',
      cell: (row) => <strong className="amount">{formatCurrency(row.montantTotal)}</strong>,
    },
    {
      key: 'dateAttribution',
      header: 'Attribution',
      width: '140px',
      cell: (row) => row.dateAttribution ? formatDate(row.dateAttribution) : <span className="cell-muted">-</span>,
    },
    {
      key: 'statut',
      header: 'Statut',
      width: '125px',
      cell: (row) => <StatusBadge status={row.statut} />,
    },
  ], []);

  const canAssign = !!effectiveBonId && !!selectedAdherentId && quantite > 0 && quantite <= (selectedBon?.quantiteRestante ?? 0);

  return (
    <div className="offers-page">
      <PageHeader
        title="Tickets restaurant"
        description="Attribuer les tickets issus d'un bon de commande valide a un adherent."
        breadcrumb={['Tresorerie', 'Offres', 'Tickets restaurant']}
      />

      <section className="ticket-assignment-panel">
        <div className="ticket-assignment-summary">
          <span className="offer-eyebrow">Bon selectionne</span>
          <h2>{selectedBon?.numero ?? 'Aucun bon valide'}</h2>
          <p>
            {selectedBon
              ? `${formatNumber(selectedBon.quantiteRestante ?? 0)} ticket(s) disponibles sur ${formatNumber(selectedBon.quantiteTotale ?? 0)}`
              : 'Validez un bon de commande avant attribution.'}
          </p>
        </div>

        <div className="ticket-assignment-form">
          <label>
            <span>Bon de commande</span>
            <select
              value={effectiveBonId}
              onChange={(event) => { setSelectedBonId(event.target.value); setPage(1); }}
            >
              <option value="">Selectionner un bon</option>
              {assignableBons.map((bon) => (
                <option key={bon.id} value={bon.id}>
                  {bon.numero} - {formatNumber(bon.quantiteRestante ?? 0)} restant(s)
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Adherent</span>
            <select
              value={selectedAdherentId}
              onChange={(event) => setSelectedAdherentId(event.target.value)}
            >
              <option value="">Selectionner un adherent</option>
              {(adherents.data?.items ?? []).map((adherent) => (
                <option key={adherent.id} value={adherent.id}>
                  {adherent.prenom} {adherent.nom}{adherent.matricule ? ` - ${adherent.matricule}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Quantite</span>
            <input
              type="number"
              min={1}
              max={selectedBon?.quantiteRestante ?? 1}
              value={quantite}
              onChange={(event) => setQuantite(Number(event.target.value))}
            />
          </label>

          <Button onClick={() => assign.mutate()} disabled={!canAssign} isLoading={assign.isPending}>
            <CheckCircle2 size={16} />
            Attribuer
          </Button>
        </div>
      </section>

      <section className="offers-metrics">
        <TicketMetric icon={<PackageCheck size={18} />} label="Tickets affiches" value={formatNumber(stats.visible)} tone="primary" />
        <TicketMetric icon={<Ticket size={18} />} label="Tickets libres" value={formatNumber(stats.libres)} tone="warning" />
        <TicketMetric icon={<UserRound size={18} />} label="Tickets attribues" value={formatNumber(stats.attribues)} tone="success" />
        <TicketMetric icon={<Search size={18} />} label="Bon actif" value={selectedBon ? selectedBon.numero : '-'} tone="info" />
      </section>

      <section className="offers-workspace">
        <div className="crud-toolbar offers-toolbar">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(1); }}
              placeholder="Numero, adherent, matricule..."
            />
            <SelectFilter
              label="Statut"
              value={statut}
              onChange={(value) => { setStatut(value); setPage(1); }}
              options={TICKET_STATUS_OPTIONS}
            />
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          rows={pageRows}
          loading={tickets.isLoading}
          rowKey={(row) => row.id}
          emptyTitle="Aucun mouvement de tickets"
          emptyDescription="Selectionnez un bon de commande ou modifiez les filtres."
        />

        {groupedRows.length > 0 && (
          <div className="data-table-card offers-pagination">
            <Pagination page={page} size={10} total={groupedRows.length} onPageChange={setPage} />
          </div>
        )}
      </section>
    </div>
  );
}

function groupTicketsByAssignment(tickets: TicketRestaurant[]): TicketCountRow[] {
  const map = new Map<string, TicketCountRow>();

  for (const ticket of tickets) {
    const key = [
      ticket.bonCommandeId ?? 'sans-bon',
      ticket.adherentId ?? 'stock',
      ticket.statut,
      ticket.dateAttribution ?? 'sans-date',
    ].join('|');

    const current = map.get(key);
    if (current) {
      current.quantite += 1;
      current.montantTotal += ticket.montant;
      continue;
    }

    map.set(key, {
      id: key,
      bonCommandeNumero: ticket.bonCommandeNumero ?? 'Sans bon',
      adherentNom: ticket.adherentNom,
      adherentMatricule: ticket.adherentMatricule,
      statut: ticket.statut,
      dateAttribution: ticket.dateAttribution,
      quantite: 1,
      montantTotal: ticket.montant,
    });
  }

  return [...map.values()];
}

function TicketMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
}) {
  return (
    <article className={`offer-metric offer-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
