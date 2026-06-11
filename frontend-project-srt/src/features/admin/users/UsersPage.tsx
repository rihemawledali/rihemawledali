import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, ShieldCheck, Trash2, UserCheck, Users, UserX } from 'lucide-react';
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
import { formatDate } from '../../../shared/lib/formatters';
import { usersApi, type AdminUserPayload } from './usersApi';
import { UserForm } from './UserForm';
import type { Utilisateur } from '../../../shared/types/domain';
import type { UserFormValues } from '../../../shared/validators';
import '../../../shared/layout/CrudPage.css';
import '../AdminManagementPages.css';

function toAdminPayload(values: UserFormValues): AdminUserPayload {
  const payload: AdminUserPayload = {
    firstName: values.prenom,
    lastName: values.nom,
    email: values.email,
    phone: values.telephone,
    role: values.role,
    statut: values.status,
    matricule: values.matricule || undefined,
  };
  if (values.password) payload.password = values.password;
  return payload;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrateur',
  treasurer: 'Trésorier',
  adherent: 'Adhérent',
};

const PAGE_SIZE = 10;
const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'suspendu', label: 'Suspendu' },
];

export function UsersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editing, setEditing] = useState<Utilisateur | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Utilisateur | null>(null);

  const query = useQuery({
    queryKey: ['users', { page, search, role, status, sortBy, sortDir }],
    queryFn: () => usersApi.list({ page, size: PAGE_SIZE, search, sortBy, sortDir, filters: { role, status } }),
  });

  const create = useMutation({
    mutationFn: (values: UserFormValues) => usersApi.create(toAdminPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreating(false);
      toast.push({ title: 'Utilisateur créé', variant: 'success' });
    },
    onError: (error) => toast.push({ title: getErrorMessage(error, 'Échec de la création'), variant: 'error' }),
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
      usersApi.update(id, toAdminPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditing(null);
      toast.push({ title: 'Utilisateur mis à jour', variant: 'success' });
    },
    onError: (error) => toast.push({ title: getErrorMessage(error, 'Échec de la mise à jour'), variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleting(null);
      toast.push({ title: 'Utilisateur supprimé', variant: 'success' });
    },
    onError: (error) => toast.push({ title: getErrorMessage(error, 'Échec de la suppression'), variant: 'error' }),
  });

  const onSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const columns: Column<Utilisateur>[] = [
    {
      key: 'nom',
      header: 'Utilisateur',
      sortable: true,
      cell: (user) => (
        <div className="row-stack">
          <strong className="cell-strong">{user.prenom} {user.nom}</strong>
          <span>{user.matricule || 'Sans matricule'}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortable: true, cell: (user) => <span className="cell-mono">{user.email}</span> },
    { key: 'telephone', header: 'Téléphone', cell: (user) => user.telephone || '—' },
    { key: 'role', header: 'Rôle', sortable: true, cell: (user) => <StatusBadge status={user.role} tone="info" label={ROLE_LABEL[user.role]} /> },
    { key: 'status', header: 'Statut', sortable: true, cell: (user) => <StatusBadge status={user.status} /> },
    { key: 'createdAt', header: 'Créé le', sortable: true, cell: (user) => <span className="cell-muted">{formatDate(user.createdAt)}</span> },
  ];

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const metrics = [
    { icon: Users, label: 'Résultats', value: total, tone: 'info' },
    { icon: UserCheck, label: 'Actifs sur la page', value: rows.filter((user) => user.status === 'actif').length, tone: 'success' },
    { icon: ShieldCheck, label: 'Administrateurs', value: rows.filter((user) => user.role === 'admin').length, tone: 'neutral' },
    { icon: UserX, label: 'Suspendus', value: rows.filter((user) => user.status === 'suspendu').length, tone: 'warning' },
  ];

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeRole(value: string) {
    setRole(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  return (
    <div className="admin-surface">
      <PageHeader
        title="Utilisateurs"
        description="Gérer les comptes administrateurs, trésoriers et adhérents."
        breadcrumb={['Administration', 'Gestion', 'Utilisateurs']}
        actions={(
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} className="admin-btn-icon" />
            Nouvel utilisateur
          </Button>
        )}
      />

      <section className="admin-hero">
        <div>
          <span className="admin-hero-kicker">Gestion des accès</span>
          <h2>Comptes et rôles</h2>
          <p>Contrôlez les accès, statuts et informations de contact des utilisateurs de la plateforme.</p>
        </div>
      </section>

      <section className="admin-metrics" aria-label="Synthèse utilisateurs">
        {metrics.map((metric) => <AdminMetric key={metric.label} {...metric} />)}
      </section>

      <section className="admin-workspace">
        <div className="admin-toolbar-panel">
          <div className="crud-toolbar">
            <FilterBar>
              <SearchInput value={search} onChange={changeSearch} placeholder="Rechercher nom, email, matricule..." />
              <SelectFilter label="Rôle" value={role} onChange={changeRole} options={ROLE_OPTIONS} />
              <SelectFilter label="Statut" value={status} onChange={changeStatus} options={STATUS_OPTIONS} />
            </FilterBar>
          </div>
        </div>

        <div className="admin-table-panel">
          <header className="admin-table-head">
            <div>
              <span className="admin-section-kicker">Annuaire</span>
              <h3>Liste des utilisateurs</h3>
              <p>{total} compte{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}</p>
            </div>
          </header>

          <DataTable
            columns={columns}
            rows={rows}
            loading={query.isLoading}
            rowKey={(user) => user.id}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={onSort}
            emptyTitle="Aucun utilisateur"
            emptyDescription="Aucun utilisateur ne correspond à vos critères. Essayez de modifier vos filtres."
            rowActions={(user) => (
              <span className="row-actions">
                <button className="icon-btn icon-btn--primary" title="Modifier" onClick={() => setEditing(user)}>
                  <Pencil size={15} />
                </button>
                <button className="icon-btn icon-btn--danger" title="Supprimer" onClick={() => setDeleting(user)}>
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

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nouvel utilisateur"
        description="Créer un compte avec un rôle et un statut"
        size="md"
      >
        <UserForm
          onCancel={() => setCreating(false)}
          onSubmit={(values) => create.mutateAsync(values)}
          submitting={create.isPending}
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Modifier l'utilisateur"
        size="md"
      >
        {editing && (
          <UserForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(values) => update.mutateAsync({ id: editing.id, values })}
            submitting={update.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Supprimer l'utilisateur ?"
        message={`Cette action supprimera définitivement ${deleting?.prenom} ${deleting?.nom}.`}
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
