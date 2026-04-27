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
import { conventionsApi } from './conventionsApi';
import { suppliersApi } from '../suppliers/suppliersApi';
import { ConventionForm } from './ConventionForm';
import { formatDate, daysUntil } from '../../lib/formatters';
import type { Convention } from '../../types/domain';
import type { ConventionFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';

const TYPE_LABEL: Record<string, string> = {
  sante: 'Santé', restauration: 'Restauration', transport: 'Transport',
  loisir: 'Loisir', commerce: 'Commerce', education: 'Éducation',
};

export function ConventionsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [sortBy, setSortBy] = useState('dateFin');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Convention | null>(null);
  const [deleting, setDeleting] = useState<Convention | null>(null);

  const query = useQuery({
    queryKey: ['conventions', { page, search, type, statut, sortBy, sortDir }],
    queryFn: () => conventionsApi.list({ page, size: 10, search, sortBy, sortDir, filters: { type, statut } }),
  });

  const buildPayload = async (v: ConventionFormValues): Promise<Omit<Convention, 'id'>> => {
    const all = await suppliersApi.list({ page: 1, size: 200 });
    const f = all.items.find((s) => s.id === v.fournisseurId);
    return {
      fournisseurId: v.fournisseurId,
      fournisseurNom: f?.nom ?? '—',
      type: v.type,
      dateDebut: new Date(v.dateDebut).toISOString(),
      dateFin: new Date(v.dateFin).toISOString(),
      remise: v.remise,
      statut: v.statut,
      description: v.description,
    };
  };

  const create = useMutation({
    mutationFn: async (v: ConventionFormValues) => conventionsApi.create(await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conventions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setCreating(false); toast.push({ title: 'Convention créée', variant: 'success' }); },
  });
  const update = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: ConventionFormValues }) => conventionsApi.update(id, await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conventions'] }); setEditing(null); toast.push({ title: 'Convention mise à jour', variant: 'success' }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => conventionsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conventions'] }); setDeleting(null); toast.push({ title: 'Supprimée', variant: 'success' }); },
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const columns: Column<Convention>[] = useMemo(() => [
    { key: 'fournisseurNom', header: 'Fournisseur', sortable: true, cell: (c) => (
      <div className="row-stack"><strong className="cell-strong">{c.fournisseurNom}</strong>{c.description && <span>{c.description}</span>}</div>
    )},
    { key: 'type', header: 'Type', sortable: true, cell: (c) => <StatusBadge status={c.type} tone="info" label={TYPE_LABEL[c.type]} /> },
    { key: 'remise', header: 'Remise', sortable: true, align: 'right', cell: (c) => <strong>{c.remise}%</strong> },
    { key: 'dateDebut', header: 'Début', sortable: true, cell: (c) => formatDate(c.dateDebut) },
    { key: 'dateFin', header: 'Fin', sortable: true, cell: (c) => {
      const days = daysUntil(c.dateFin);
      const expiringSoon = c.statut === 'active' && days > 0 && days < 30;
      return (
        <div className="row-stack">
          <span>{formatDate(c.dateFin)}</span>
          {expiringSoon && <span style={{ color: 'var(--color-warning-600)' }}>Expire dans {days} j</span>}
        </div>
      );
    }},
    { key: 'statut', header: 'Statut', sortable: true, cell: (c) => <StatusBadge status={c.statut} /> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Conventions"
        description="Accords avec les fournisseurs partenaires"
        breadcrumb={['Administration', 'Gestion', 'Conventions']}
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} />Nouvelle convention</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Rechercher..." />
          <SelectFilter label="Type" value={type} onChange={(v) => { setType(v); setPage(1); }}
            options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          <SelectFilter label="Statut" value={statut} onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'expiree', label: 'Expirée' },
              { value: 'en_negociation', label: 'En négociation' },
              { value: 'suspendue', label: 'Suspendue' },
            ]} />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(c) => c.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucune convention"
        rowActions={(c) => (
          <span className="row-actions">
            <button className="icon-btn icon-btn--primary" onClick={() => setEditing(c)} title="Modifier"><Pencil size={15} /></button>
            <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(c)} title="Supprimer"><Trash2 size={15} /></button>
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouvelle convention" size="lg">
        <ConventionForm onCancel={() => setCreating(false)} onSubmit={(v) => create.mutateAsync(v)} submitting={create.isPending} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier la convention" size="lg">
        {editing && <ConventionForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(v) => update.mutateAsync({ id: editing.id, v })} submitting={update.isPending} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title="Supprimer cette convention ?"
        message={`La convention avec ${deleting?.fournisseurNom} sera supprimée.`}
        confirmLabel="Supprimer" destructive loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
