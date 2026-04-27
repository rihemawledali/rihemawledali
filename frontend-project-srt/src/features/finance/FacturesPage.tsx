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
import { facturesApi } from './financeApi';
import { suppliersApi } from '../suppliers/suppliersApi';
import { FactureForm } from './FactureForm';
import { formatCurrency, formatDate, daysUntil } from '../../lib/formatters';
import type { Facture } from '../../types/domain';
import type { FactureFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';

export function FacturesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [sortBy, setSortBy] = useState('dateEcheance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Facture | null>(null);
  const [deleting, setDeleting] = useState<Facture | null>(null);

  const query = useQuery({
    queryKey: ['factures', { page, search, statut, sortBy, sortDir }],
    queryFn: () => facturesApi.list({ page, size: 10, search, sortBy, sortDir, filters: { statut } }),
  });

  const buildPayload = async (v: FactureFormValues): Promise<Omit<Facture, 'id'>> => {
    const all = await suppliersApi.list({ page: 1, size: 200 });
    const f = all.items.find((s) => s.id === v.fournisseurId);
    return {
      numero: v.numero, fournisseurId: v.fournisseurId, fournisseurNom: f?.nom ?? '—',
      montant: v.montant, statut: v.statut,
      dateEmission: new Date(v.dateEmission).toISOString(),
      dateEcheance: new Date(v.dateEcheance).toISOString(),
    };
  };

  const create = useMutation({
    mutationFn: async (v: FactureFormValues) => facturesApi.create(await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['factures'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setCreating(false); toast.push({ title: 'Facture créée', variant: 'success' }); },
  });
  const update = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: FactureFormValues }) => facturesApi.update(id, await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['factures'] }); setEditing(null); toast.push({ title: 'Facture mise à jour', variant: 'success' }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => facturesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['factures'] }); setDeleting(null); toast.push({ title: 'Supprimée', variant: 'success' }); },
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const columns: Column<Facture>[] = useMemo(() => [
    { key: 'numero', header: 'Numéro', sortable: true, cell: (f) => <span className="cell-mono">{f.numero}</span> },
    { key: 'fournisseurNom', header: 'Fournisseur', sortable: true, cell: (f) => <strong className="cell-strong">{f.fournisseurNom}</strong> },
    { key: 'montant', header: 'Montant', sortable: true, align: 'right', cell: (f) => <strong className="amount">{formatCurrency(f.montant)}</strong> },
    { key: 'dateEmission', header: 'Émise le', sortable: true, cell: (f) => formatDate(f.dateEmission) },
    { key: 'dateEcheance', header: 'Échéance', sortable: true, cell: (f) => {
      const d = daysUntil(f.dateEcheance);
      const overdue = f.statut !== 'payee' && d < 0;
      const soon = f.statut !== 'payee' && d >= 0 && d < 7;
      return (
        <div className="row-stack">
          <span>{formatDate(f.dateEcheance)}</span>
          {overdue && <span style={{ color: 'var(--color-error-600)' }}>{Math.abs(d)} j de retard</span>}
          {soon && <span style={{ color: 'var(--color-warning-600)' }}>Dans {d} j</span>}
        </div>
      );
    }},
    { key: 'statut', header: 'Statut', sortable: true, cell: (f) => <StatusBadge status={f.statut} /> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Factures"
        description="Factures émises par les fournisseurs"
        breadcrumb={['Administration', 'Finance', 'Factures']}
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} />Nouvelle facture</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Numéro, fournisseur..." />
          <SelectFilter label="Statut" value={statut} onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'payee', label: 'Payée' },
              { value: 'impayee', label: 'Impayée' },
              { value: 'partielle', label: 'Partielle' },
              { value: 'en_retard', label: 'En retard' },
            ]} />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(f) => f.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucune facture"
        rowActions={(f) => (
          <span className="row-actions">
            <button className="icon-btn icon-btn--primary" onClick={() => setEditing(f)} title="Modifier"><Pencil size={15} /></button>
            <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(f)} title="Supprimer"><Trash2 size={15} /></button>
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouvelle facture"><FactureForm onCancel={() => setCreating(false)} onSubmit={(v) => create.mutateAsync(v)} submitting={create.isPending} /></Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier la facture">
        {editing && <FactureForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(v) => update.mutateAsync({ id: editing.id, v })} submitting={update.isPending} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting} title="Supprimer cette facture ?"
        message={`La facture ${deleting?.numero} sera supprimée.`}
        confirmLabel="Supprimer" destructive loading={remove.isPending}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
