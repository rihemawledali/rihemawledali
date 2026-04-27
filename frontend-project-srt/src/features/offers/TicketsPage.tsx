import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/data/DataTable';
import { Modal } from '../../components/data/Modal';
import { ConfirmDialog } from '../../components/data/ConfirmDialog';
import { Pagination } from '../../components/data/Pagination';
import { SearchInput } from '../../components/data/SearchInput';
import { FilterBar, SelectFilter } from '../../components/data/FilterBar';
import { StatusBadge } from '../../components/data/StatusBadge';
import { useToast } from '../../components/feedback/useToast';
import { ticketsApi } from './offersApi';
import { usersApi } from '../users/usersApi';
import { TicketForm } from './TicketForm';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { TicketRestaurant } from '../../types/domain';
import type { TicketFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';

export function TicketsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [typeBon, setTypeBon] = useState('');
  const [sortBy, setSortBy] = useState('dateEmission');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TicketRestaurant | null>(null);
  const [deleting, setDeleting] = useState<TicketRestaurant | null>(null);

  const query = useQuery({
    queryKey: ['tickets', { page, search, statut, typeBon, sortBy, sortDir }],
    queryFn: () => ticketsApi.list({ page, size: 10, search, sortBy, sortDir, filters: { statut, typeBon } }),
  });

  const buildPayload = async (v: TicketFormValues): Promise<Omit<TicketRestaurant, 'id'>> => {
    const all = await usersApi.list({ page: 1, size: 500 });
    const a = v.adherentId ? all.items.find((u) => u.id === v.adherentId) : undefined;
    return {
      numero: v.numero, typeBon: v.typeBon, montant: v.montant, statut: v.statut,
      adherentId: v.adherentId || undefined,
      adherentNom: a ? `${a.prenom} ${a.nom}` : undefined,
      dateEmission: new Date(v.dateEmission).toISOString(),
    };
  };

  const create = useMutation({
    mutationFn: async (v: TicketFormValues) => ticketsApi.create(await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets'] }); setCreating(false); toast.push({ title: 'Ticket créé', variant: 'success' }); },
  });
  const update = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: TicketFormValues }) => ticketsApi.update(id, await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets'] }); setEditing(null); toast.push({ title: 'Ticket mis à jour', variant: 'success' }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => ticketsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets'] }); setDeleting(null); toast.push({ title: 'Supprimé', variant: 'success' }); },
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const columns: Column<TicketRestaurant>[] = useMemo(() => [
    { key: 'numero', header: 'Numéro', sortable: true, cell: (t) => <span className="cell-mono">{t.numero}</span> },
    { key: 'typeBon', header: 'Type', sortable: true, cell: (t) => <StatusBadge tone="info" status={t.typeBon} label={t.typeBon === 'restaurant' ? 'Restaurant' : 'Cafétéria'} /> },
    { key: 'adherentNom', header: 'Adhérent', cell: (t) => t.adherentNom ?? <span className="cell-muted">— Non attribué —</span> },
    { key: 'montant', header: 'Montant', sortable: true, align: 'right', cell: (t) => <strong className="amount">{formatCurrency(t.montant)}</strong> },
    { key: 'dateEmission', header: 'Émis le', sortable: true, cell: (t) => formatDate(t.dateEmission) },
    { key: 'statut', header: 'Statut', sortable: true, cell: (t) => <StatusBadge status={t.statut} /> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Tickets restaurant"
        description="Émettre et attribuer les tickets restaurant et cafétéria"
        breadcrumb={['Administration', 'Offres', 'Tickets restaurant']}
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} />Nouveau ticket</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Numéro, adhérent..." />
          <SelectFilter label="Type" value={typeBon} onChange={(v) => { setTypeBon(v); setPage(1); }}
            options={[{ value: 'restaurant', label: 'Restaurant' }, { value: 'cafeteria', label: 'Cafétéria' }]} />
          <SelectFilter label="Statut" value={statut} onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'en_attente', label: 'En attente' },
              { value: 'attribue', label: 'Attribué' },
              { value: 'utilise', label: 'Utilisé' },
              { value: 'expire', label: 'Expiré' },
            ]} />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(t) => t.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucun ticket"
        rowActions={(t) => (
          <span className="row-actions">
            <button className="icon-btn icon-btn--primary" onClick={() => setEditing(t)} title="Modifier"><Pencil size={15} /></button>
            <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(t)} title="Supprimer"><Trash2 size={15} /></button>
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau ticket"><TicketForm onCancel={() => setCreating(false)} onSubmit={(v) => create.mutateAsync(v)} submitting={create.isPending} /></Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le ticket">
        {editing && <TicketForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(v) => update.mutateAsync({ id: editing.id, v })} submitting={update.isPending} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting} title="Supprimer ce ticket ?"
        message={`Le ticket ${deleting?.numero} sera supprimé.`}
        confirmLabel="Supprimer" destructive loading={remove.isPending}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
