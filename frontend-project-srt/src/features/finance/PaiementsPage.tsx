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
import { paiementsApi } from './financeApi';
import { PaiementForm } from './PaiementForm';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import type { Paiement } from '../../types/domain';
import type { PaiementFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';

const MODE_LABEL: Record<string, string> = { virement: 'Virement', cheque: 'Chèque', especes: 'Espèces', carte: 'Carte' };

export function PaiementsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [mode, setMode] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Paiement | null>(null);
  const [deleting, setDeleting] = useState<Paiement | null>(null);

  const query = useQuery({
    queryKey: ['paiements', { page, search, statut, mode, sortBy, sortDir }],
    queryFn: () => paiementsApi.list({ page, size: 10, search, sortBy, sortDir, filters: { statut, mode } }),
  });

  const create = useMutation({
    mutationFn: (v: PaiementFormValues) => paiementsApi.create({ ...v, date: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paiements'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setCreating(false); toast.push({ title: 'Paiement enregistré', variant: 'success' }); },
  });
  const update = useMutation({
    mutationFn: ({ id, v }: { id: string; v: PaiementFormValues }) => paiementsApi.update(id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paiements'] }); setEditing(null); toast.push({ title: 'Paiement mis à jour', variant: 'success' }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => paiementsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paiements'] }); setDeleting(null); toast.push({ title: 'Supprimé', variant: 'success' }); },
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const columns: Column<Paiement>[] = useMemo(() => [
    { key: 'reference', header: 'Référence', sortable: true, cell: (p) => <span className="cell-mono">{p.reference}</span> },
    { key: 'beneficiaire', header: 'Bénéficiaire', sortable: true, cell: (p) => (
      <div className="row-stack">
        <strong className="cell-strong">{p.beneficiaire}</strong>
        {p.factureNumero && <span>{p.factureNumero}</span>}
      </div>
    )},
    { key: 'montant', header: 'Montant', sortable: true, align: 'right', cell: (p) => <strong className="amount">{formatCurrency(p.montant)}</strong> },
    { key: 'mode', header: 'Mode', sortable: true, cell: (p) => <StatusBadge tone="neutral" status={p.mode} label={MODE_LABEL[p.mode]} /> },
    { key: 'statut', header: 'Statut', sortable: true, cell: (p) => <StatusBadge status={p.statut} /> },
    { key: 'date', header: 'Date', sortable: true, cell: (p) => <span className="cell-muted">{formatDateTime(p.date)}</span> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Paiements"
        description="Suivi des paiements effectués et reçus"
        breadcrumb={['Administration', 'Finance', 'Paiements']}
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} />Nouveau paiement</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Référence, bénéficiaire..." />
          <SelectFilter label="Statut" value={statut} onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'reussi', label: 'Réussi' },
              { value: 'en_attente', label: 'En attente' },
              { value: 'echoue', label: 'Échoué' },
              { value: 'rembourse', label: 'Remboursé' },
            ]} />
          <SelectFilter label="Mode" value={mode} onChange={(v) => { setMode(v); setPage(1); }}
            options={Object.entries(MODE_LABEL).map(([value, label]) => ({ value, label }))} />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(p) => p.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucun paiement"
        rowActions={(p) => (
          <span className="row-actions">
            <button className="icon-btn icon-btn--primary" onClick={() => setEditing(p)} title="Modifier"><Pencil size={15} /></button>
            <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(p)} title="Supprimer"><Trash2 size={15} /></button>
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau paiement"><PaiementForm onCancel={() => setCreating(false)} onSubmit={(v) => create.mutateAsync(v)} submitting={create.isPending} /></Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le paiement">
        {editing && <PaiementForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(v) => update.mutateAsync({ id: editing.id, v })} submitting={update.isPending} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting} title="Supprimer ce paiement ?"
        message={`Le paiement ${deleting?.reference} sera supprimé.`}
        confirmLabel="Supprimer" destructive loading={remove.isPending}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
