import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Mail, Pencil, Phone, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { Button } from '../../../shared/ui/Button';
import { DataTable, type Column } from '../../../shared/data/DataTable';
import { Modal } from '../../../shared/data/Modal';
import { ConfirmDialog } from '../../../shared/data/ConfirmDialog';
import { Pagination } from '../../../shared/data/Pagination';
import { SearchInput } from '../../../shared/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../shared/data/FilterBar';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { useToast } from '../../../shared/feedback/useToast';
import { suppliersApi } from '../../../shared/api/suppliersApi';
import { SupplierForm } from './SupplierForm';
import type { Fournisseur } from '../../../shared/types/domain';
import type { SupplierFormValues } from '../../../shared/validators';
import '../../../shared/layout/CrudPage.css';
import '../AdminManagementPages.css';

const CAT_LABEL: Record<string, string> = {
  sante: 'Santé',
  restauration: 'Restauration',
  transport: 'Transport',
  loisir: 'Loisir',
  commerce: 'Commerce',
  education: 'Éducation',
};

const PAGE_SIZE = 10;
const CATEGORY_OPTIONS = Object.entries(CAT_LABEL).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
];

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
    queryFn: () => suppliersApi.list({ page, size: PAGE_SIZE, search, sortBy, sortDir, filters: { categorie, status } }),
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

  const columns: Column<Fournisseur>[] = [
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
  ];

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const metrics = [
    { icon: Building2, label: 'Résultats', value: total, tone: 'info' },
    { icon: UserCheck, label: 'Actifs sur la page', value: rows.filter((supplier) => supplier.status === 'actif').length, tone: 'success' },
    { icon: UserX, label: 'Inactifs', value: rows.filter((supplier) => supplier.status === 'inactif').length, tone: 'warning' },
  ];

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeCategory(value: string) {
    setCategorie(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  return (
    <div className="admin-surface">
      <PageHeader
        title="Fournisseurs"
        breadcrumb={['Administration', 'Gestion', 'Fournisseurs']}
        actions={(
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} className="admin-btn-icon" />
            Nouveau fournisseur
          </Button>
        )}
      />
      <section className="admin-metrics" aria-label="Synthèse fournisseurs">
        {metrics.map((metric) => <AdminMetric key={metric.label} {...metric} />)}
      </section>

      <section className="admin-workspace">
        <div className="admin-toolbar-panel">
          <div className="crud-toolbar">
            <FilterBar>
              <SearchInput value={search} onChange={changeSearch} placeholder="Rechercher nom, email, téléphone..." />
              <SelectFilter label="Catégorie" value={categorie} onChange={changeCategory} options={CATEGORY_OPTIONS} />
              <SelectFilter label="Statut" value={status} onChange={changeStatus} options={STATUS_OPTIONS} />
            </FilterBar>
          </div>
        </div>

        <div className="admin-table-panel">
          <header className="admin-table-head">
            <div>
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
              <Pagination page={page} size={PAGE_SIZE} total={query.data.total} onPageChange={setPage} />
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

function AdminMetric({ icon: Icon, label, value, tone }: any) {
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
