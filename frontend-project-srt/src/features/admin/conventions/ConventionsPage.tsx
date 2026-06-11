import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { getConventionAvantageSummary } from '../../../shared/lib/conventionWorkflow';
import { conventionsApi } from './conventionsApi';
import { suppliersApi } from '../../../shared/api/suppliersApi';
import { ConventionForm } from './ConventionForm';
import type { Convention, PageResult } from '../../../shared/types/domain';
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

const PAGE_SIZE = 10;
const TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expiree', label: 'Expirée' },
  { value: 'en_negociation', label: 'En négociation' },
  { value: 'suspendue', label: 'Suspendue' },
];

function renderTypeAvantage(convention: Convention) {
  if (!convention.typeAvantage) return '—';
  return getConventionAvantageSummary(convention).title;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function prependConventionToPage(
  pageData: PageResult<Convention> | undefined,
  convention: Convention
): PageResult<Convention> {
  if (!pageData) {
    return { items: [convention], total: 1, page: 1, size: 10 };
  }
  const alreadyExists = pageData.items.some((item) => item.id === convention.id);
  const items = [
    convention,
    ...pageData.items.filter((item) => item.id !== convention.id),
  ].slice(0, pageData.size);
  return {
    ...pageData,
    items,
    total: alreadyExists ? pageData.total : pageData.total + 1,
  };
}

export function ConventionsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Convention | null>(null);
  const [deleting, setDeleting] = useState<Convention | null>(null);

  const query = useQuery({
    queryKey: ['conventions', { page, search, type, statut, sortBy, sortDir }],
    queryFn: () => conventionsApi.list({ page, size: PAGE_SIZE, search, sortBy, sortDir, filters: { type, statut } }),
  });

  const buildPayload = async (values: ConventionFormValues): Promise<Omit<Convention, 'id'>> => {
    const suppliers = await suppliersApi.list({ page: 1, size: 200 });
    const supplier = suppliers.items.find((item) => item.id === values.fournisseurId);
    return {
      fournisseurId: values.fournisseurId,
      fournisseurNom: supplier?.nom ?? '—',
      type: values.type,
      dateDebut: values.dateDebut,
      dateFin: values.dateFin,
      remise: 0,
      statut: values.statut,
      description: values.description,
      typeConvention: values.typeConvention || undefined,
      typeAvantage: values.typeAvantage,
      pourcentageAdherent: values.pourcentageAdherent,
      montantAvantage: values.montantAvantage,
      nombreMoisRetenue: values.nombreMoisRetenue,
      quantiteDisponible: values.quantiteDisponible,
      autoriseAyantsDroit: values.autoriseAyantsDroit,
    };
  };

  const create = useMutation({
    mutationFn: async (values: ConventionFormValues) => conventionsApi.create(await buildPayload(values)),
    onSuccess: (createdConvention) => {
      const visibleConventionsKey = ['conventions', {
        page: 1,
        search: '',
        type: '',
        statut: '',
        sortBy: 'id',
        sortDir: 'desc' as const,
      }];
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.setQueriesData<PageResult<Convention>>(
        { queryKey: ['conventions'] },
        (old) => prependConventionToPage(old, createdConvention)
      );
      queryClient.setQueryData<PageResult<Convention>>(
        visibleConventionsKey,
        (old) => prependConventionToPage(old, createdConvention)
      );
      setCreating(false);
      setSearch('');
      setType('');
      setStatut('');
      setSortBy('id');
      setSortDir('desc');
      setPage(1);
      toast.push({ title: 'Convention créée', variant: 'success' });
    },
    onError: (error) => {
      toast.push({ title: 'Convention non creee', description: getErrorMessage(error, 'Verifier les champs saisis.'), variant: 'error' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ConventionFormValues }) =>
      conventionsApi.update(id, await buildPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions'] });
      setEditing(null);
      toast.push({ title: 'Convention mise à jour', variant: 'success' });
    },
    onError: (error) => {
      toast.push({ title: 'Convention non mise a jour', description: getErrorMessage(error, 'Verifier les champs saisis.'), variant: 'error' });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => conventionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleting(null);
      toast.push({ title: 'Convention supprimée', variant: 'success' });
    },
    onError: (error) => {
      toast.push({ title: 'Suppression impossible', description: getErrorMessage(error, 'Veuillez reessayer.'), variant: 'error' });
    },
  });

  const onSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const columns: Column<Convention>[] = [
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
    { key: 'typeAvantage', header: "Type d'avantage", cell: (convention) => <span className="cell-strong">{renderTypeAvantage(convention)}</span> },
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
  ];

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const activeCount = rows.filter((convention) => convention.statut === 'active').length;
  const expiringCount = rows.filter((convention) => {
    const days = daysUntil(convention.dateFin);
    return convention.statut === 'active' && days > 0 && days < 30;
  }).length;
  const pausedCount = rows.filter((convention) => convention.statut === 'suspendue' || convention.statut === 'en_negociation').length;
  const metrics = [
    { icon: FileSignature, label: 'Résultats', value: total, tone: 'info' },
    { icon: Handshake, label: 'Actives sur la page', value: activeCount, tone: 'success' },
    { icon: ClockAlert, label: 'Échéance proche', value: expiringCount, tone: 'warning' },
    { icon: PauseCircle, label: 'Suspendues / négociation', value: pausedCount, tone: 'neutral' },
  ];

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeType(value: string) {
    setType(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatut(value);
    setPage(1);
  }

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
        {metrics.map((metric) => <AdminMetric key={metric.label} {...metric} />)}
      </section>

      <section className="admin-workspace">
        <div className="admin-toolbar-panel">
          <div className="crud-toolbar">
            <FilterBar>
              <SearchInput value={search} onChange={changeSearch} placeholder="Rechercher fournisseur ou description..." />
              <SelectFilter label="Type" value={type} onChange={changeType} options={TYPE_OPTIONS} />
              <SelectFilter label="Statut" value={statut} onChange={changeStatus} options={STATUS_OPTIONS} />
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
              <Pagination page={page} size={PAGE_SIZE} total={query.data.total} onPageChange={setPage} />
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
