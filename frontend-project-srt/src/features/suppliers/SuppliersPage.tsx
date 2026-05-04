import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { Building2, Mail, Pencil, Phone, Plus, Store, Trash2, UserCheck, UserX } from 'lucide-react';
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
import '../admin/AdminManagementPages.css';

const CAT_LABEL: Record<string, string> = {
  sante: 'Santé',
  restauration: 'Restauration',
  transport: 'Transport',
  loisir: 'Loisir',
  commerce: 'Commerce',
  education: 'Éducation',
};

export function SuppliersPage() {
  const queryClient = useQueryClient();
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
    mutationFn: (values: SupplierFormValues) => suppliersApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreating(false);
      toast.push({ title: 'Fournisseur créé', variant: 'success' });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) => suppliersApi.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditing(null);
      toast.push({ title: 'Fournisseur mis à jour', variant: 'success' });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => suppliersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleting(null);
      toast.push({ title: 'Fournisseur supprimé', variant: 'success' });
    },
  });

  const onSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const columns: Column<Fournisseur>[] = useMemo(() => [
    {
      key: 'nom',
      header: 'Fournisseur',
      sortable: true,
      cell: (supplier) => (
        <div className="row-stack">
          <strong className="cell-strong">{supplier.nom}</strong>
          <span>{supplier.adresse || 'Adresse non renseignée'}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (supplier) => (
        <div className="row-stack">
          <span className="admin-contact-line"><Mail size={12} />{supplier.email || 'Email non renseigné'}</span>
          <span className="admin-contact-line"><Phone size={12} />{supplier.telephone || 'Téléphone non renseigné'}</span>
        </div>
      ),
    },
    {
      key: 'categorie',
      header: 'Catégorie',
      sortable: true,
      cell: (supplier) => <StatusBadge status={supplier.categorie} tone="info" label={CAT_LABEL[supplier.categorie]} />,
    },
    { key: 'status', header: 'Statut', sortable: true, cell: (supplier) => <StatusBadge status={supplier.status} /> },
  ], []);

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const activeCount = rows.filter((supplier) => supplier.status === 'actif').length;
  const inactiveCount = rows.filter((supplier) => supplier.status === 'inactif').length;
  const categoriesCount = new Set(rows.map((supplier) => supplier.categorie)).size;

  return (
    <div className="admin-surface">
      <PageHeader
        title="Fournisseurs"
        description="Annuaire des partenaires conventionnés."
        breadcrumb={['Administration', 'Gestion', 'Fournisseurs']}
        actions={(
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} className="admin-btn-icon" />
            Nouveau fournisseur
          </Button>
        )}
      />

      <section className="admin-hero">
        <div>
          <span className="admin-hero-kicker">Réseau partenaires</span>
          <h2>Fournisseurs conventionnés</h2>
          <p>Centralisez les contacts, catégories et statuts des partenaires de l’Amicale SRT.</p>
        </div>
      </section>

      <section className="admin-metrics" aria-label="Synthèse fournisseurs">
        <AdminMetric icon={Building2} label="Résultats" value={total} tone="info" />
        <AdminMetric icon={UserCheck} label="Actifs sur la page" value={activeCount} tone="success" />
        <AdminMetric icon={Store} label="Catégories visibles" value={categoriesCount} tone="neutral" />
        <AdminMetric icon={UserX} label="Inactifs" value={inactiveCount} tone="warning" />
      </section>

      <section className="admin-workspace">
        <div className="admin-toolbar-panel">
          <div className="crud-toolbar">
            <FilterBar>
              <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Rechercher nom, email, téléphone..." />
              <SelectFilter
                label="Catégorie"
                value={categorie}
                onChange={(value) => { setCategorie(value); setPage(1); }}
                options={Object.entries(CAT_LABEL).map(([value, label]) => ({ value, label }))}
              />
              <SelectFilter
                label="Statut"
                value={status}
                onChange={(value) => { setStatus(value); setPage(1); }}
                options={[
                  { value: 'actif', label: 'Actif' },
                  { value: 'inactif', label: 'Inactif' },
                ]}
              />
            </FilterBar>
          </div>
        </div>

        <div className="admin-table-panel">
          <header className="admin-table-head">
            <div>
              <span className="admin-section-kicker">Annuaire</span>
              <h3>Liste des fournisseurs</h3>
              <p>{total} fournisseur{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}</p>
            </div>
          </header>

          <DataTable
            columns={columns}
            rows={rows}
            loading={query.isLoading}
            rowKey={(supplier) => supplier.id}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={onSort}
            emptyTitle="Aucun fournisseur"
            emptyDescription="Aucun fournisseur ne correspond à vos critères."
            rowActions={(supplier) => (
              <span className="row-actions">
                <button className="icon-btn icon-btn--primary" onClick={() => setEditing(supplier)} title="Modifier">
                  <Pencil size={15} />
                </button>
                <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(supplier)} title="Supprimer">
                  <Trash2 size={15} />
                </button>
              </span>
            )}
          />

          {query.data && query.data.total > 0 && (
            <div className="admin-pagination">
              <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
            </div>
          )}
        </div>
      </section>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau fournisseur">
        <SupplierForm onCancel={() => setCreating(false)} onSubmit={(values) => create.mutateAsync(values)} submitting={create.isPending} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le fournisseur">
        {editing && (
          <SupplierForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(values) => update.mutateAsync({ id: editing.id, values })}
            submitting={update.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Supprimer ce fournisseur ?"
        message={`Le fournisseur "${deleting?.nom}" sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

function AdminMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'info' | 'neutral';
}) {
  return (
    <article className={`admin-metric is-${tone}`}>
      <span className="admin-metric-icon">
        <Icon size={18} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}
