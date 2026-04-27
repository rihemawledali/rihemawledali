import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
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
import { suppliersApi } from './suppliersApi';
import { SupplierForm } from './SupplierForm';
import type { Fournisseur } from '../../types/domain';
import type { SupplierFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';

const CAT_LABEL: Record<string, string> = {
  sante: 'Santé', restauration: 'Restauration', transport: 'Transport',
  loisir: 'Loisir', commerce: 'Commerce', education: 'Éducation',
};

export function SuppliersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Fournisseur | null>(null);
  const [deleting, setDeleting] = useState<Fournisseur | null>(null);

  const query = useQuery({
    queryKey: ['suppliers', { page, search, categorie, status, sortBy, sortDir }],
    queryFn: () => suppliersApi.list({ page, size: 10, search, sortBy, sortDir, filters: { categorie, status } }),
  });

  const create = useMutation({
    mutationFn: (v: SupplierFormValues) => suppliersApi.create(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setCreating(false); toast.push({ title: 'Fournisseur créé', variant: 'success' }); },
  });
  const update = useMutation({
    mutationFn: ({ id, v }: { id: string; v: SupplierFormValues }) => suppliersApi.update(id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setEditing(null); toast.push({ title: 'Fournisseur mis à jour', variant: 'success' }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => suppliersApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setDeleting(null); toast.push({ title: 'Supprimé', variant: 'success' }); },
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const columns: Column<Fournisseur>[] = useMemo(() => [
    { key: 'nom', header: 'Fournisseur', sortable: true, cell: (f) => (
      <div className="row-stack">
        <strong className="cell-strong">{f.nom}</strong>
        <span>{f.adresse}</span>
      </div>
    )},
    { key: 'contact', header: 'Contact', cell: (f) => (
      <div className="row-stack">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Mail size={12} />{f.email}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Phone size={12} />{f.telephone}</span>
      </div>
    )},
    { key: 'categorie', header: 'Catégorie', sortable: true, cell: (f) => <StatusBadge status={f.categorie} tone="info" label={CAT_LABEL[f.categorie]} /> },
    { key: 'status', header: 'Statut', sortable: true, cell: (f) => <StatusBadge status={f.status} /> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        description="Annuaire des partenaires conventionnés"
        breadcrumb={['Administration', 'Gestion', 'Fournisseurs']}
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} />Nouveau fournisseur</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Rechercher nom, email..." />
          <SelectFilter
            label="Catégorie" value={categorie}
            onChange={(v) => { setCategorie(v); setPage(1); }}
            options={Object.entries(CAT_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <SelectFilter
            label="Statut" value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[{ value: 'actif', label: 'Actif' }, { value: 'inactif', label: 'Inactif' }]}
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(f) => f.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucun fournisseur"
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau fournisseur">
        <SupplierForm onCancel={() => setCreating(false)} onSubmit={(v) => create.mutateAsync(v)} submitting={create.isPending} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le fournisseur">
        {editing && <SupplierForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(v) => update.mutateAsync({ id: editing.id, v })} submitting={update.isPending} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title="Supprimer ce fournisseur ?"
        message={`Le fournisseur "${deleting?.nom}" sera supprimé définitivement.`}
        confirmLabel="Supprimer" destructive loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
