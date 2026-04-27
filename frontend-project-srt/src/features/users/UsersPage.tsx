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
import { formatDate } from '../../lib/formatters';
import { usersApi, type AdminUserPayload } from './usersApi';
import { UserForm } from './UserForm';
import type { Utilisateur } from '../../types/domain';
import type { UserFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';

/** Maps a UserForm value (frontend-shape) to the backend admin payload. */
function toAdminPayload(v: UserFormValues): AdminUserPayload {
  const payload: AdminUserPayload = {
    firstName: v.prenom,
    lastName: v.nom,
    email: v.email,
    phone: v.telephone,
    role: v.role,
    statut: v.status,
    matricule: v.matricule || undefined,
  };
  if (v.password) payload.password = v.password;
  return payload;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrateur', treasurer: 'Trésorier',
  manager: 'Gestionnaire', adherent: 'Adhérent',
};

export function UsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editing, setEditing] = useState<Utilisateur | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Utilisateur | null>(null);

  const query = useQuery({
    queryKey: ['users', { page, search, role, status, sortBy, sortDir }],
    queryFn: () => usersApi.list({ page, size: 10, search, sortBy, sortDir, filters: { role, status } }),
  });

  const create = useMutation({
    mutationFn: (v: UserFormValues) => usersApi.create(toAdminPayload(v)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setCreating(false);
      toast.push({ title: 'Utilisateur créé', variant: 'success' });
    },
    onError: (err) =>
      toast.push({ title: getErrorMessage(err, 'Échec de la création'), variant: 'error' }),
  });

  const update = useMutation({
    mutationFn: ({ id, v }: { id: string; v: UserFormValues }) =>
      usersApi.update(id, toAdminPayload(v)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditing(null);
      toast.push({ title: 'Utilisateur mis à jour', variant: 'success' });
    },
    onError: (err) =>
      toast.push({ title: getErrorMessage(err, 'Échec de la mise à jour'), variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleting(null);
      toast.push({ title: 'Utilisateur supprimé', variant: 'success' });
    },
    onError: (err) =>
      toast.push({ title: getErrorMessage(err, 'Échec de la suppression'), variant: 'error' }),
  });

  const onSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  const columns: Column<Utilisateur>[] = useMemo(() => [
    {
      key: 'nom', header: 'Utilisateur', sortable: true,
      cell: (u) => (
        <div className="row-stack">
          <strong className="cell-strong">{u.prenom} {u.nom}</strong>
          <span>{u.matricule}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortable: true, cell: (u) => <span className="cell-mono">{u.email}</span> },
    { key: 'telephone', header: 'Téléphone', cell: (u) => u.telephone },
    { key: 'role', header: 'Rôle', sortable: true, cell: (u) => <StatusBadge status={u.role} tone="info" label={ROLE_LABEL[u.role]} /> },
    { key: 'status', header: 'Statut', sortable: true, cell: (u) => <StatusBadge status={u.status} /> },
    { key: 'createdAt', header: 'Créé le', sortable: true, cell: (u) => <span className="cell-muted">{formatDate(u.createdAt)}</span> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gérer les comptes administrateurs, trésoriers, gestionnaires et adhérents"
        breadcrumb={['Administration', 'Gestion', 'Utilisateurs']}
        actions={
          <Button onClick={() => setCreating(true)}><Plus size={16} />Nouvel utilisateur</Button>
        }
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Rechercher nom, email, matricule…" />
          <SelectFilter
            label="Rôle"
            value={role}
            onChange={(v) => { setRole(v); setPage(1); }}
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
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { value: 'actif', label: 'Actif' },
              { value: 'inactif', label: 'Inactif' },
              { value: 'suspendu', label: 'Suspendu' },
            ]}
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(u) => u.id}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={onSort}
        emptyTitle="Aucun utilisateur"
        emptyDescription="Aucun utilisateur ne correspond à vos critères. Essayez de modifier vos filtres."
        rowActions={(u) => (
          <span className="row-actions">
            <button className="icon-btn icon-btn--primary" title="Modifier" onClick={() => setEditing(u)}>
              <Pencil size={15} />
            </button>
            <button className="icon-btn icon-btn--danger" title="Supprimer" onClick={() => setDeleting(u)}>
              <Trash2 size={15} />
            </button>
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nouvel utilisateur"
        description="Créer un compte avec un rôle et un statut"
        size="md"
      >
        <UserForm
          onCancel={() => setCreating(false)}
          onSubmit={(v) => create.mutateAsync(v)}
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
            onSubmit={(v) => update.mutateAsync({ id: editing.id, v })}
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
