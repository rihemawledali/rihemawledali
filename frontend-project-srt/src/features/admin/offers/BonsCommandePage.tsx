import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Eye,
  FileDown,
  PackagePlus,
  Pencil,
  Plus,
  Ticket,
  Trash2,
} from 'lucide-react';
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
import { bonsCommandeApi } from './offersApi';
import { suppliersApi } from '../suppliers/suppliersApi';
import { BonCommandeForm } from './BonCommandeForm';
import { formatCurrency, formatDate, formatNumber } from '../../../shared/lib/formatters';
import type { BonCommande, BonStatus } from '../../../shared/types/domain';
import type { BonCommandeFormValues } from '../../../shared/validators';
import '../../../shared/layout/CrudPage.css';
import './OffersPages.css';

const BON_STATUS_LABEL: Record<BonStatus, string> = {
  brouillon: 'Brouillon',
  valide: 'Valide',
  epuise: 'Epuise',
  expire: 'Expire',
  en_attente: 'En attente',
  attribue: 'Attribue',
  utilise: 'Utilise',
};

const BON_STATUS_TONE: Record<BonStatus, 'neutral' | 'info' | 'success' | 'warning' | 'error'> = {
  brouillon: 'warning',
  valide: 'success',
  epuise: 'neutral',
  expire: 'error',
  en_attente: 'warning',
  attribue: 'info',
  utilise: 'success',
};

const BON_STATUS_OPTIONS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'valide', label: 'Valide' },
  { value: 'epuise', label: 'Epuise' },
  { value: 'expire', label: 'Expire' },
];

export function BonsCommandePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const basePath = '/treasurer/bons-commande';

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
    queryFn: () => bonsCommandeApi.list({
      page,
      size: 10,
      search,
      sortBy,
      sortDir,
      filters: { statut },
    }),
  });

  const all = useQuery({
    queryKey: ['bons-commande', 'all'],
    queryFn: () => bonsCommandeApi.list({ page: 1, size: 1000 }),
  });

  const stats = useMemo(() => {
    const items = all.data?.items ?? [];
    return {
      total: items.length,
      valide: items.filter((b) => b.statut === 'valide').length,
      restant: items.reduce((sum, b) => sum + (b.quantiteRestante ?? 0), 0),
      montant: items.reduce((sum, b) => sum + b.montant, 0),
    };
  }, [all.data]);

  const buildPayload = async (v: BonCommandeFormValues): Promise<Omit<BonCommande, 'id'>> => {
    const suppliers = await suppliersApi.list({ page: 1, size: 200 });
    const fournisseur = suppliers.items.find((s) => s.id === v.fournisseurId);
    const quantiteTotale = Math.max(1, Math.trunc(v.quantiteTotale));
    const valeurUnitaire = Number(v.valeurUnitaire.toFixed(3));
    const montant = Number((quantiteTotale * valeurUnitaire).toFixed(3));

    return {
      numero: v.numero,
      fournisseurId: v.fournisseurId,
      fournisseurNom: fournisseur?.nom ?? '',
      adherentId: undefined,
      adherentNom: undefined,
      typeBon: v.typeBon,
      montant,
      valeurUnitaire,
      quantiteTotale,
      quantiteRestante: quantiteTotale,
      quantiteAttribuee: 0,
      statut: v.statut,
      dateEmission: v.dateEmission,
      dateExpiration: v.dateExpiration,
    };
  };

  const create = useMutation({
    mutationFn: async (v: BonCommandeFormValues) => bonsCommandeApi.create(await buildPayload(v)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bons-commande'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setCreating(false);
      toast.push({ title: 'Bon de commande cree', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: BonCommandeFormValues }) =>
      bonsCommandeApi.update(id, await buildPayload(v)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bons-commande'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setEditing(null);
      toast.push({ title: 'Bon de commande mis a jour', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const valider = useMutation({
    mutationFn: (id: string) => bonsCommandeApi.valider(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bons-commande'] });
      toast.push({ title: 'Bon de commande valide', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const downloadPdf = useMutation({
    mutationFn: (id: string) => bonsCommandeApi.downloadPdf(id),
    onError: (e) => toast.push({
      title: 'Téléchargement impossible',
      description: e instanceof Error ? e.message : 'Erreur inconnue',
      variant: 'error',
    }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => bonsCommandeApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bons-commande'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setDeleting(null);
      toast.push({ title: 'Bon de commande supprime', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const onSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const columns: Column<BonCommande>[] = useMemo(() => [
    {
      key: 'numero',
      header: 'Bon',
      sortable: true,
      cell: (b) => (
        <div className="offer-main-cell">
          <span className="cell-mono">{b.numero}</span>
          <small>{b.typeBon === 'cafeteria' ? 'Cafeteria' : 'Restaurant'}</small>
        </div>
      ),
      width: '170px',
    },
    {
      key: 'fournisseurNom',
      header: 'Fournisseur',
      sortable: true,
      cell: (b) => <strong className="cell-strong">{b.fournisseurNom || 'Non renseigne'}</strong>,
    },
    {
      key: 'quantiteRestante',
      header: 'Stock',
      align: 'right',
      width: '190px',
      cell: (b) => <StockCell bon={b} />,
    },
    {
      key: 'montant',
      header: 'Montant',
      sortable: true,
      align: 'right',
      width: '140px',
      cell: (b) => <strong className="amount">{formatCurrency(b.montant)}</strong>,
    },
    {
      key: 'dateExpiration',
      header: 'Expiration',
      sortable: true,
      width: '130px',
      cell: (b) => formatDate(b.dateExpiration),
    },
    {
      key: 'statut',
      header: 'Statut',
      sortable: true,
      width: '125px',
      cell: (b) => (
        <StatusBadge
          status={b.statut}
          tone={BON_STATUS_TONE[b.statut]}
          label={BON_STATUS_LABEL[b.statut] ?? b.statut}
        />
      ),
    },
  ], []);

  return (
    <div className="offers-page">
      <PageHeader
        title="Bons de commande"
        description="Gerer le stock global des tickets restaurant avant attribution aux adherents."
        breadcrumb={['Tresorerie', 'Offres', 'Bons de commande']}
        actions={(
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Nouveau bon
          </Button>
        )}
      />

      <section className="offers-metrics">
        <OfferMetric icon={<PackagePlus size={18} />} label="Bons" value={formatNumber(stats.total)} loading={all.isLoading} tone="primary" />
        <OfferMetric icon={<CheckCircle2 size={18} />} label="Valides" value={formatNumber(stats.valide)} loading={all.isLoading} tone="success" />
        <OfferMetric icon={<Ticket size={18} />} label="Tickets restants" value={formatNumber(stats.restant)} loading={all.isLoading} tone="warning" />
        <OfferMetric icon={<Ticket size={18} />} label="Montant global" value={formatCurrency(stats.montant)} loading={all.isLoading} tone="info" />
      </section>

      <section className="offers-workspace">
        <div className="crud-toolbar offers-toolbar">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(1); }}
              placeholder="Numero, fournisseur, type..."
            />
            <SelectFilter
              label="Statut"
              value={statut}
              onChange={(value) => { setStatut(value); setPage(1); }}
              options={BON_STATUS_OPTIONS}
            />
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          rows={query.data?.items ?? []}
          loading={query.isLoading}
          rowKey={(b) => b.id}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={onSort}
          emptyTitle="Aucun bon de commande"
          emptyDescription="Creez un bon pour generer un stock de tickets."
          actionsWidth="300px"
          rowActions={(b) => (
            <span className="offer-row-actions">
              <Button variant="secondary" size="sm" onClick={() => navigate(`${basePath}/${b.id}`)}>
                <Eye size={14} />
                Detail
              </Button>
              {b.statut === 'brouillon' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => valider.mutate(b.id)}
                  isLoading={valider.isPending && valider.variables === b.id}
                >
                  <CheckCircle2 size={14} />
                  Valider
                </Button>
              )}
              {b.statut === 'brouillon' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadPdf.mutate(b.id)}
                  isLoading={downloadPdf.isPending && downloadPdf.variables === b.id}
                  title="Télécharger le bon de commande (PDF)"
                >
                  <FileDown size={15} />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setEditing(b)} title="Modifier">
                <Pencil size={15} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(b)} title="Supprimer">
                <Trash2 size={15} />
              </Button>
            </span>
          )}
        />

        {query.data && query.data.total > 0 && (
          <div className="data-table-card offers-pagination">
            <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
          </div>
        )}
      </section>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau bon de commande" size="lg">
        <BonCommandeForm
          onCancel={() => setCreating(false)}
          onSubmit={(values) => create.mutateAsync(values)}
          submitting={create.isPending}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le bon de commande" size="lg">
        {editing && (
          <BonCommandeForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(values) => update.mutateAsync({ id: editing.id, v: values })}
            submitting={update.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Supprimer ce bon ?"
        message={`Le bon ${deleting?.numero} et ses tickets libres seront supprimes.`}
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

function StockCell({ bon }: { bon: BonCommande }) {
  const total = bon.quantiteTotale ?? 0;
  const remaining = bon.quantiteRestante ?? 0;
  const assigned = bon.quantiteAttribuee ?? Math.max(0, total - remaining);
  const percent = total > 0 ? Math.min(100, Math.max(0, (assigned / total) * 100)) : 0;

  return (
    <div className="offer-stock-cell">
      <div>
        <strong>{formatNumber(remaining)}</strong>
        <span>/ {formatNumber(total)}</span>
      </div>
      <div className="offer-stock-bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function OfferMetric({
  icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
  loading?: boolean;
}) {
  return (
    <article className={`offer-metric offer-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </article>
  );
}
