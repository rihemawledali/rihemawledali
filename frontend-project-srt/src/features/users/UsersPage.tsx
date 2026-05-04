import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { Pencil, Plus, ShieldCheck, Trash2, UserCheck, Users, UserX } from 'lucide-react';
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
import { formatDate } from '../../lib/formatters';
import { usersApi, type AdminUserPayload } from './usersApi';
import { UserForm } from './UserForm';
import type { Utilisateur } from '../../types/domain';
import type { UserFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';
import '../admin/AdminManagementPages.css';

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
  manager: 'Gestionnaire',
  adherent: 'Adhérent',
};

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
    queryFn: () => usersApi.list({ page, size: 10, search, sortBy, sortDir, filters: { role, status } }),
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

  const columns: Column<Utilisateur>[] = useMemo(() => [
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
  ], []);

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const activeCount = rows.filter((user) => user.status === 'actif').length;
  const suspendedCount = rows.filter((user) => user.status === 'suspendu').length;
  const adminCount = rows.filter((user) => user.role === 'admin').length;

  return (
    <div className="admin-surface">
      <PageHeader
        title="Utilisateurs"
        description="Gérer les comptes administrateurs, trésoriers, gestionnaires et adhérents."
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
        <AdminMetric icon={Users} label="Résultats" value={total} tone="info" />
        <AdminMetric icon={UserCheck} label="Actifs sur la page" value={activeCount} tone="success" />
        <AdminMetric icon={ShieldCheck} label="Administrateurs" value={adminCount} tone="neutral" />
        <AdminMetric icon={UserX} label="Suspendus" value={suspendedCount} tone="warning" />
      </section>

      <section className="admin-workspace">
        <div className="admin-toolbar-panel">
          <div className="crud-toolbar">
            <FilterBar>
              <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Rechercher nom, email, matricule..." />
              <SelectFilter
                label="Rôle"
                value={role}
                onChange={(value) => { setRole(value); setPage(1); }}
                options={[
                  { value: 'admin', label: 'Administrateur' },
                  { value: 'treasurer', label: 'Trésorier' },
                  { value: 'manager', label: 'Gestionnaire' },
                  { value: 'adherent', label: 'Adhérent' },
                ]}
              />
              <SelectFilter
                label="Statut"
                value={status}
                onChange={(value) => { setStatus(value); setPage(1); }}
                options={[
                  { value: 'actif', label: 'Actif' },
                  { value: 'inactif', label: 'Inactif' },
                  { value: 'suspendu', label: 'Suspendu' },
                ]}
              />
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
              <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
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
