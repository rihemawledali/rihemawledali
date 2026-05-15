import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { ClockAlert, FileSignature, Handshake, PauseCircle, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { formatDate, daysUntil } from '../../../shared/lib/formatters';
import { conventionsApi } from './conventionsApi';
import { suppliersApi } from '../suppliers/suppliersApi';
import { ConventionForm } from './ConventionForm';
import type { Convention } from '../../../shared/types/domain';
import type { ConventionFormValues } from '../../../shared/validators';
import '../../../shared/layout/CrudPage.css';
import '../AdminManagementPages.css';

const TYPE_LABEL: Record<string, string> = {
  sante: 'Santé',
  restauration: 'Restauration',
  transport: 'Transport',
  loisir: 'Loisir',
  commerce: 'Commerce',
  education: 'Éducation',
};

const MODE_AVANTAGE_LABEL: Record<NonNullable<Convention['modeAvantage']>, string> = {
  REMISE_POURCENTAGE: 'Remise %',
  REMISE_MONTANT_FIXE: 'Remise fixe',
};

function renderAvantage(convention: Convention) {
  if (!convention.modeAvantage) return '—';
  if (convention.modeAvantage === 'REMISE_POURCENTAGE' && convention.tauxReduction != null) {
    return `${MODE_AVANTAGE_LABEL[convention.modeAvantage]} · ${convention.tauxReduction}%`;
  }
  if (convention.modeAvantage === 'REMISE_MONTANT_FIXE' && convention.montantReduction != null) {
    return `${MODE_AVANTAGE_LABEL[convention.modeAvantage]} · ${convention.montantReduction} TND`;
  }
  return MODE_AVANTAGE_LABEL[convention.modeAvantage];
}

export function ConventionsPage() {
  const queryClient = useQueryClient();
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

  const buildPayload = async (values: ConventionFormValues): Promise<Omit<Convention, 'id'>> => {
    const suppliers = await suppliersApi.list({ page: 1, size: 200 });
    const supplier = suppliers.items.find((item) => item.id === values.fournisseurId);
    const legacyRemise = values.modeAvantage === 'REMISE_POURCENTAGE' ? (values.tauxReduction ?? 0) : 0;

    return {
      fournisseurId: values.fournisseurId,
      fournisseurNom: supplier?.nom ?? '—',
      type: values.type,
      dateDebut: new Date(values.dateDebut).toISOString(),
      dateFin: new Date(values.dateFin).toISOString(),
      remise: legacyRemise,
      statut: values.statut,
      description: values.description,
      typeConvention: values.typeConvention || undefined,
      modeAvantage: values.modeAvantage,
      tauxReduction: values.modeAvantage === 'REMISE_POURCENTAGE' ? values.tauxReduction : undefined,
      montantReduction: values.modeAvantage === 'REMISE_MONTANT_FIXE' ? values.montantReduction : undefined,
    };
  };

  const create = useMutation({
    mutationFn: async (values: ConventionFormValues) => conventionsApi.create(await buildPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreating(false);
      toast.push({ title: 'Convention créée', variant: 'success' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ConventionFormValues }) =>
      conventionsApi.update(id, await buildPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      setEditing(null);
      toast.push({ title: 'Convention mise à jour', variant: 'success' });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => conventionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleting(null);
      toast.push({ title: 'Convention supprimée', variant: 'success' });
    },
  });

  const onSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const columns: Column<Convention>[] = useMemo(() => [
    {
      key: 'fournisseurNom',
      header: 'Fournisseur',
      sortable: true,
      cell: (convention) => (
        <div className="row-stack">
          <strong className="cell-strong">{convention.fournisseurNom}</strong>
          {convention.description && <span>{convention.description}</span>}
        </div>
      ),
    },
    { key: 'type', header: 'Type', sortable: true, cell: (convention) => <StatusBadge status={convention.type} tone="info" label={TYPE_LABEL[convention.type]} /> },
    { key: 'modeAvantage', header: 'Mode d’avantage', cell: (convention) => <span className="cell-strong">{renderAvantage(convention)}</span> },
    { key: 'dateDebut', header: 'Début', sortable: true, cell: (convention) => formatDate(convention.dateDebut) },
    {
      key: 'dateFin',
      header: 'Fin',
      sortable: true,
      cell: (convention) => {
        const days = daysUntil(convention.dateFin);
        const expiringSoon = convention.statut === 'active' && days > 0 && days < 30;
        return (
          <div className="row-stack">
            <span>{formatDate(convention.dateFin)}</span>
            {expiringSoon && <span className="admin-expiry-note">Expire dans {days} j</span>}
          </div>
        );
      },
    },
    { key: 'statut', header: 'Statut', sortable: true, cell: (convention) => <StatusBadge status={convention.statut} /> },
  ], []);

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const activeCount = rows.filter((convention) => convention.statut === 'active').length;
  const expiringCount = rows.filter((convention) => {
    const days = daysUntil(convention.dateFin);
    return convention.statut === 'active' && days > 0 && days < 30;
  }).length;
  const pausedCount = rows.filter((convention) => convention.statut === 'suspendue' || convention.statut === 'en_negociation').length;

  return (
    <div className="admin-surface">
      <PageHeader
        title="Conventions"
        description="Accords avec les fournisseurs partenaires."
        breadcrumb={['Administration', 'Gestion', 'Conventions']}
        actions={(
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} className="admin-btn-icon" />
            Nouvelle convention
          </Button>
        )}
      />

      <section className="admin-hero">
        <div>
          <span className="admin-hero-kicker">Partenariats</span>
          <h2>Conventions et avantages</h2>
          <p>Suivez les accords actifs, les échéances proches et les conventions en négociation.</p>
        </div>
      </section>

      <section className="admin-metrics" aria-label="Synthèse conventions">
        <AdminMetric icon={FileSignature} label="Résultats" value={total} tone="info" />
        <AdminMetric icon={Handshake} label="Actives sur la page" value={activeCount} tone="success" />
        <AdminMetric icon={ClockAlert} label="Échéance proche" value={expiringCount} tone="warning" />
        <AdminMetric icon={PauseCircle} label="Suspendues / négociation" value={pausedCount} tone="neutral" />
      </section>

      <section className="admin-workspace">
        <div className="admin-toolbar-panel">
          <div className="crud-toolbar">
            <FilterBar>
              <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Rechercher fournisseur ou description..." />
              <SelectFilter
                label="Type"
                value={type}
                onChange={(value) => { setType(value); setPage(1); }}
                options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))}
              />
              <SelectFilter
                label="Statut"
                value={statut}
                onChange={(value) => { setStatut(value); setPage(1); }}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'expiree', label: 'Expirée' },
                  { value: 'en_negociation', label: 'En négociation' },
                  { value: 'suspendue', label: 'Suspendue' },
                ]}
              />
            </FilterBar>
          </div>
        </div>

        <div className="admin-table-panel">
          <header className="admin-table-head">
            <div>
              <span className="admin-section-kicker">Catalogue</span>
              <h3>Liste des conventions</h3>
              <p>{total} convention{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}</p>
            </div>
          </header>

          <DataTable
            columns={columns}
            rows={rows}
            loading={query.isLoading}
            rowKey={(convention) => convention.id}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={onSort}
            emptyTitle="Aucune convention"
            emptyDescription="Aucune convention ne correspond à vos critères."
            rowActions={(convention) => (
              <span className="row-actions">
                <button className="icon-btn icon-btn--primary" onClick={() => setEditing(convention)} title="Modifier">
                  <Pencil size={15} />
                </button>
                <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(convention)} title="Supprimer">
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouvelle convention" size="lg">
        <ConventionForm onCancel={() => setCreating(false)} onSubmit={(values) => create.mutateAsync(values)} submitting={create.isPending} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier la convention" size="lg">
        {editing && (
          <ConventionForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(values) => update.mutateAsync({ id: editing.id, values })}
            submitting={update.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Supprimer cette convention ?"
        message={`La convention avec ${deleting?.fournisseurNom} sera supprimée.`}
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
