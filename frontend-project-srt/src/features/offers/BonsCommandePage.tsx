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
import { bonsCommandeApi } from './offersApi';
import { suppliersApi } from '../suppliers/suppliersApi';
import { usersApi } from '../users/usersApi';
import { BonCommandeForm } from './BonCommandeForm';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { BonCommande } from '../../types/domain';
import type { BonCommandeFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';

export function BonsCommandePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [sortBy, setSortBy] = useState('dateEmission');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BonCommande | null>(null);
  const [deleting, setDeleting] = useState<BonCommande | null>(null);

  const query = useQuery({
    queryKey: ['bons-commande', { page, search, statut, sortBy, sortDir }],
    queryFn: () => bonsCommandeApi.list({ page, size: 10, search, sortBy, sortDir, filters: { statut } }),
  });

  const buildPayload = async (v: BonCommandeFormValues): Promise<Omit<BonCommande, 'id'>> => {
    const [allS, allA] = await Promise.all([
      suppliersApi.list({ page: 1, size: 200 }),
      usersApi.list({ page: 1, size: 500 }),
    ]);
    const f = allS.items.find((s) => s.id === v.fournisseurId);
    const a = v.adherentId ? allA.items.find((u) => u.id === v.adherentId) : undefined;
    return {
      numero: v.numero,
      fournisseurId: v.fournisseurId,
      fournisseurNom: f?.nom ?? '—',
      adherentId: v.adherentId || undefined,
      adherentNom: a ? `${a.prenom} ${a.nom}` : undefined,
      montant: v.montant,
      statut: v.statut,
      dateEmission: new Date(v.dateEmission).toISOString(),
      dateExpiration: new Date(v.dateExpiration).toISOString(),
    };
  };

  const create = useMutation({
    mutationFn: async (v: BonCommandeFormValues) => bonsCommandeApi.create(await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bons-commande'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setCreating(false); toast.push({ title: 'Bon créé', variant: 'success' }); },
  });
  const update = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: BonCommandeFormValues }) => bonsCommandeApi.update(id, await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bons-commande'] }); setEditing(null); toast.push({ title: 'Bon mis à jour', variant: 'success' }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => bonsCommandeApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bons-commande'] }); setDeleting(null); toast.push({ title: 'Supprimé', variant: 'success' }); },
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const columns: Column<BonCommande>[] = useMemo(() => [
    { key: 'numero', header: 'Numéro', sortable: true, cell: (b) => <span className="cell-mono">{b.numero}</span> },
    { key: 'fournisseurNom', header: 'Fournisseur', sortable: true, cell: (b) => <strong className="cell-strong">{b.fournisseurNom}</strong> },
    { key: 'adherentNom', header: 'Adhérent', cell: (b) => b.adherentNom ?? <span className="cell-muted">— Non attribué —</span> },
    { key: 'montant', header: 'Montant', sortable: true, align: 'right', cell: (b) => <strong className="amount">{formatCurrency(b.montant)}</strong> },
    { key: 'dateExpiration', header: 'Expire le', sortable: true, cell: (b) => formatDate(b.dateExpiration) },
    { key: 'statut', header: 'Statut', sortable: true, cell: (b) => <StatusBadge status={b.statut} /> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Bons de commande"
        description="Gérer et attribuer les bons de commande aux adhérents"
        breadcrumb={['Administration', 'Offres', 'Bons de commande']}
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} />Nouveau bon</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Numéro, fournisseur, adhérent..." />
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
        rowKey={(b) => b.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucun bon de commande"
        rowActions={(b) => (
          <span className="row-actions">
            <button className="icon-btn icon-btn--primary" onClick={() => setEditing(b)} title="Modifier"><Pencil size={15} /></button>
            <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(b)} title="Supprimer"><Trash2 size={15} /></button>
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau bon de commande"><BonCommandeForm onCancel={() => setCreating(false)} onSubmit={(v) => create.mutateAsync(v)} submitting={create.isPending} /></Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le bon">
        {editing && <BonCommandeForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(v) => update.mutateAsync({ id: editing.id, v })} submitting={update.isPending} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting} title="Supprimer ce bon ?"
        message={`Le bon ${deleting?.numero} sera supprimé.`}
        confirmLabel="Supprimer" destructive loading={remove.isPending}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
