import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, CreditCard, Ban, FileDown } from 'lucide-react';
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
import { facturesApi } from './financeApi';
import { suppliersApi } from '../suppliers/suppliersApi';
import { FactureForm } from './FactureForm';
import { formatCurrency, formatDate, daysUntil } from '../../lib/formatters';
import type { Facture, FactureStatus } from '../../types/domain';
import type { FactureFormValues } from '../../lib/validators';
import '../../components/layout/CrudPage.css';

const STATUT_LABEL: Record<FactureStatus, string> = {
  brouillon: 'Brouillon',
  non_payee: 'Non payée',
  impayee: 'Non payée',
  partielle: 'Partielle',
  en_retard: 'En retard',
  payee: 'Payée',
  annulee: 'Annulée',
};

const STATUT_TONE: Record<FactureStatus, 'success' | 'warning' | 'info' | 'error' | 'neutral'> = {
  brouillon: 'neutral',
  non_payee: 'warning',
  impayee: 'warning',
  partielle: 'info',
  en_retard: 'error',
  payee: 'success',
  annulee: 'error',
};

export function FacturesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isTreasurerScope = location.pathname.startsWith('/treasurer');
  const paiementsRoute = isTreasurerScope ? '/treasurer/paiements' : '/admin/finance/paiements';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [sortBy, setSortBy] = useState('dateEcheance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Facture | null>(null);
  const [deleting, setDeleting] = useState<Facture | null>(null);
  const [cancelling, setCancelling] = useState<Facture | null>(null);

  const query = useQuery({
    queryKey: ['factures', { page, search, statut, sortBy, sortDir }],
    queryFn: () => facturesApi.list({ page, size: 10, search, sortBy, sortDir, filters: { statut } }),
  });

  const buildPayload = async (v: FactureFormValues): Promise<Omit<Facture, 'id'>> => {
    const all = await suppliersApi.list({ page: 1, size: 200 });
    const f = all.items.find((s) => s.id === v.fournisseurId);
    return {
      numero: v.numero, fournisseurId: v.fournisseurId, fournisseurNom: f?.nom ?? '—',
      montant: v.montant, statut: v.statut,
      dateEmission: new Date(v.dateEmission).toISOString(),
      dateEcheance: new Date(v.dateEcheance).toISOString(),
      description: v.description,
      dateFacture: new Date(v.dateEmission).toISOString(),
    };
  };

  const create = useMutation({
    mutationFn: async (v: FactureFormValues) => facturesApi.create(await buildPayload(v)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setCreating(false);
      toast.push({ title: 'Facture créée', variant: 'success' });
    },
  });
  const downloadPdf = useMutation({
    mutationFn: (id: string) => facturesApi.downloadPdf(id),
    onError: (e) => toast.push({
      title: 'Téléchargement impossible',
      description: e instanceof Error ? e.message : 'Erreur inconnue',
      variant: 'error',
    }),
  });
  const update = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: FactureFormValues }) => facturesApi.update(id, await buildPayload(v)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['factures'] }); setEditing(null); toast.push({ title: 'Facture mise à jour', variant: 'success' }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => facturesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['factures'] }); setDeleting(null); toast.push({ title: 'Supprimée', variant: 'success' }); },
  });
  const cancel = useMutation({
    mutationFn: (id: string) => facturesApi.annuler(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['factures'] }); setCancelling(null); toast.push({ title: 'Facture annulée', variant: 'success' }); },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const handlePay = (f: Facture) => navigate(`${paiementsRoute}?factureId=${f.id}`);

  const columns: Column<Facture>[] = useMemo(() => [
    { key: 'numero', header: 'N° facture', sortable: true, cell: (f) => <span className="cell-mono">{f.numero}</span> },
    { key: 'fournisseurNom', header: 'Fournisseur', sortable: true, cell: (f) => <strong className="cell-strong">{f.fournisseurNom}</strong> },
    { key: 'dateEmission', header: 'Date', sortable: true, cell: (f) => formatDate(f.dateEmission) },
    { key: 'montant', header: 'Montant', sortable: true, align: 'right', cell: (f) => <strong className="amount">{formatCurrency(f.montant)}</strong> },
    { key: 'description', header: 'Description', cell: (f) => f.description ? <span style={{ color: 'var(--color-text-secondary)' }}>{f.description}</span> : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span> },
    { key: 'dateEcheance', header: 'Échéance', sortable: true, cell: (f) => {
      const d = daysUntil(f.dateEcheance);
      const overdue = f.statut !== 'payee' && f.statut !== 'annulee' && d < 0;
      const soon = f.statut !== 'payee' && f.statut !== 'annulee' && d >= 0 && d < 7;
      return (
        <div className="row-stack">
          <span>{formatDate(f.dateEcheance)}</span>
          {overdue && <span style={{ color: 'var(--color-error-600)' }}>{Math.abs(d)} j de retard</span>}
          {soon && <span style={{ color: 'var(--color-warning-600)' }}>Dans {d} j</span>}
        </div>
      );
    }},
    {
      key: 'statut', header: 'Statut', sortable: true,
      cell: (f) => <StatusBadge status={f.statut} tone={STATUT_TONE[f.statut]} label={STATUT_LABEL[f.statut]} />,
    },
  ], []);

  return (
    <div>
      <PageHeader
        title="Factures"
        description="Factures émises par les fournisseurs"
        breadcrumb={[isTreasurerScope ? 'Trésorerie' : 'Administration', 'Finance', 'Factures']}
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} />Nouvelle facture</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Numéro, fournisseur, description..." />
          <SelectFilter label="Statut" value={statut} onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'brouillon', label: 'Brouillon' },
              { value: 'non_payee', label: 'Non payée' },
              { value: 'impayee', label: 'Non payée (legacy)' },
              { value: 'partielle', label: 'Partielle' },
              { value: 'en_retard', label: 'En retard' },
              { value: 'payee', label: 'Payée' },
              { value: 'annulee', label: 'Annulée' },
            ]} />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(f) => f.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucune facture"
        emptyDescription="Cliquez sur « Nouvelle facture » pour commencer."
        rowActions={(f) => {
          const canPay = f.statut !== 'payee' && f.statut !== 'annulee';
          const canCancel = f.statut !== 'payee' && f.statut !== 'annulee';
          return (
            <span className="row-actions">
              {canPay && (
                <button
                  className="icon-btn icon-btn--success"
                  onClick={() => handlePay(f)}
                  title="Payer la facture"
                  aria-label={`Payer la facture ${f.numero}`}
                >
                  <CreditCard size={15} />
                </button>
              )}
              <button className="icon-btn icon-btn--primary" onClick={() => setEditing(f)} title="Modifier"><Pencil size={15} /></button>
              {f.statut === 'payee' && (
                <button
                  className="icon-btn"
                  onClick={() => downloadPdf.mutate(f.id)}
                  title="Télécharger le PDF"
                  aria-label={`Télécharger la facture ${f.numero} en PDF`}
                  disabled={downloadPdf.isPending}
                >
                  <FileDown size={15} />
                </button>
              )}
              {canCancel && (
                <button className="icon-btn" onClick={() => setCancelling(f)} title="Annuler la facture"><Ban size={15} /></button>
              )}
              <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(f)} title="Supprimer"><Trash2 size={15} /></button>
            </span>
          );
        }}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouvelle facture">
        <FactureForm onCancel={() => setCreating(false)} onSubmit={(v) => create.mutateAsync(v)} submitting={create.isPending} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier la facture">
        {editing && <FactureForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(v) => update.mutateAsync({ id: editing.id, v })} submitting={update.isPending} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting} title="Supprimer cette facture ?"
        message={`La facture ${deleting?.numero} sera supprimée.`}
        confirmLabel="Supprimer" destructive loading={remove.isPending}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
      <ConfirmDialog
        open={!!cancelling} title="Annuler cette facture ?"
        message={`La facture ${cancelling?.numero} sera marquée comme annulée. Cette action est réversible via une mise à jour manuelle.`}
        confirmLabel="Annuler la facture" destructive loading={cancel.isPending}
        onCancel={() => setCancelling(null)} onConfirm={() => cancelling && cancel.mutate(cancelling.id)}
      />
    </div>
  );
}
