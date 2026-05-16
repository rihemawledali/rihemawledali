import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, CheckCircle2, Ban, Eye, CreditCard,
  Building2, HeartHandshake, MoreHorizontal,
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
import { facturesApi, indemnitesWorkflow, paiementsApi } from './api';
import { PaiementForm } from './PaiementForm';
import { PayFactureForm } from './PayFactureForm';
import { PayIndemniteForm } from './PayIndemniteForm';
import { formatCurrency, formatDateTime } from '../../../shared/lib/formatters';
import type { Facture, Indemnite, Paiement, TypePaiement } from '../../../shared/types/domain';
import type { PaiementFormValues } from '../../../shared/validators';
import '../../../shared/layout/CrudPage.css';

const MODE_LABEL: Record<string, string> = {
  virement: 'Virement', cheque: 'Chèque', especes: 'Espèces', carte: 'Carte',
};

const TYPE_LABEL: Record<TypePaiement, string> = {
  PAIEMENT_FACTURE_FOURNISSEUR: 'Paiement facture fournisseur',
  PAIEMENT_INDEMNITE: 'Paiement indemnité',
  AUTRE_SORTIE: 'Autre sortie',
};

const TYPE_TONE: Record<TypePaiement, 'info' | 'primary' | 'neutral'> = {
  PAIEMENT_FACTURE_FOURNISSEUR: 'info',
  PAIEMENT_INDEMNITE: 'primary',
  AUTRE_SORTIE: 'neutral',
};

const TYPE_ICON: Record<TypePaiement, React.ReactNode> = {
  PAIEMENT_FACTURE_FOURNISSEUR: <Building2 size={12} />,
  PAIEMENT_INDEMNITE: <HeartHandshake size={12} />,
  AUTRE_SORTIE: <MoreHorizontal size={12} />,
};

function inferType(p: Paiement): TypePaiement {
  if (p.typePaiement) return p.typePaiement;
  if (p.factureId || p.factureNumero) return 'PAIEMENT_FACTURE_FOURNISSEUR';
  if (p.indemniteId) return 'PAIEMENT_INDEMNITE';
  return 'AUTRE_SORTIE';
}

export function PaiementsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [mode, setMode] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals.
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Paiement | null>(null);
  const [deleting, setDeleting] = useState<Paiement | null>(null);
  const [cancelling, setCancelling] = useState<Paiement | null>(null);
  const [viewing, setViewing] = useState<Paiement | null>(null);
  const [payingFacture, setPayingFacture] = useState<Facture | null>(null);
  const [payingIndemnite, setPayingIndemnite] = useState<Indemnite | null>(null);

  const query = useQuery({
    queryKey: ['paiements', { page, search, statut, mode, typeFilter, sortBy, sortDir }],
    queryFn: () =>
      paiementsApi.list({
        page, size: 10, search, sortBy, sortDir,
        filters: { statut, mode, typePaiement: typeFilter },
      }),
  });

  // ---- Prefill from query string (?factureId=… or ?indemniteId=…) ----
  useEffect(() => {
    const factureId = searchParams.get('factureId');
    const indemniteId = searchParams.get('indemniteId');
    if (factureId) {
      facturesApi.getById(factureId).then((f) => { if (f) setPayingFacture(f); });
    } else if (indemniteId) {
      indemnitesWorkflow.getById(indemniteId).then((i) => { if (i) setPayingIndemnite(i); });
    }
  }, [searchParams]);

  const closePrefilled = () => {
    setPayingFacture(null);
    setPayingIndemnite(null);
    if (searchParams.has('factureId') || searchParams.has('indemniteId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('factureId');
      next.delete('indemniteId');
      setSearchParams(next, { replace: true });
    }
  };

  // ---- Mutations ----
  const create = useMutation({
    mutationFn: (v: PaiementFormValues) => paiementsApi.create({
      reference: v.reference,
      typePaiement: v.typePaiement,
      beneficiaireType: v.beneficiaireType,
      beneficiaireId: v.beneficiaireId,
      beneficiaire: v.beneficiaire,
      montant: v.montant,
      mode: v.mode,
      statut: v.statut,
      factureId: v.factureId,
      factureNumero: v.factureNumero,
      indemniteId: v.indemniteId,
      description: v.description,
      date: new Date().toISOString(),
      compteBancaireId: v.compteBancaireId,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['historique'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'tresorerie'] });
      setCreating(false);
      toast.push({ title: 'Paiement enregistré', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const update = useMutation({
    mutationFn: ({ id, v }: { id: string; v: PaiementFormValues }) =>
      paiementsApi.update(id, {
        reference: v.reference,
        typePaiement: v.typePaiement,
        beneficiaireType: v.beneficiaireType,
        beneficiaireId: v.beneficiaireId,
        beneficiaire: v.beneficiaire,
        montant: v.montant,
        mode: v.mode,
        statut: v.statut,
        factureId: v.factureId,
        factureNumero: v.factureNumero,
        indemniteId: v.indemniteId,
        description: v.description,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['historique'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'tresorerie'] });
      setEditing(null);
      toast.push({ title: 'Paiement mis à jour', variant: 'success' });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => paiementsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paiements'] }); setDeleting(null); toast.push({ title: 'Supprimé', variant: 'success' }); },
  });

  const valider = useMutation({
    mutationFn: (id: string) => paiementsApi.valider(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['historique'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'tresorerie'] });
      toast.push({ title: 'Paiement validé', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const annuler = useMutation({
    mutationFn: (id: string) => paiementsApi.annuler(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['historique'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'tresorerie'] });
      setCancelling(null);
      toast.push({ title: 'Paiement annulé', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const payFacture = useMutation({
    mutationFn: ({ factureId, payload }: { factureId: string; payload: { reference: string; montant: number; mode: Paiement['mode']; description?: string; compteBancaireId: string } }) =>
      paiementsApi.payFacture(factureId, payload),
    onSuccess: async (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['historique'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'tresorerie'] });
      closePrefilled();
      toast.push({ title: 'Facture payée', variant: 'success' });
      // Best-effort auto-download of the freshly paid facture PDF. A
      // rendering failure must not undo the payment success feedback,
      // so we only surface a secondary toast.
      try {
        await facturesApi.downloadPdf(variables.factureId);
      } catch (e) {
        toast.push({
          title: 'PDF indisponible',
          description: e instanceof Error ? e.message : 'Échec du téléchargement.',
          variant: 'error',
        });
      }
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const payIndemnite = useMutation({
    mutationFn: ({ indemniteId, payload }: { indemniteId: string; payload: { reference: string; montant: number; mode: Paiement['mode']; description?: string; compteBancaireId: string } }) =>
      paiementsApi.payIndemnite(indemniteId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'indemnites'] });
      qc.invalidateQueries({ queryKey: ['historique'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'tresorerie'] });
      closePrefilled();
      toast.push({ title: 'Indemnité payée', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const columns: Column<Paiement>[] = useMemo(() => [
    { key: 'reference', header: 'Référence', sortable: true, cell: (p) => <span className="cell-mono">{p.reference}</span> },
    {
      key: 'typePaiement', header: 'Type', width: '230px',
      cell: (p) => {
        const t = inferType(p);
        return (
          <StatusBadge
            status={t}
            tone={TYPE_TONE[t]}
            label={(<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{TYPE_ICON[t]}{TYPE_LABEL[t]}</span>) as unknown as string}
          />
        );
      },
    },
    {
      key: 'beneficiaire', header: 'Bénéficiaire', sortable: true,
      cell: (p) => (
        <div className="row-stack">
          <strong className="cell-strong">{p.beneficiaire}</strong>
          {p.factureNumero && <span style={{ color: 'var(--color-text-tertiary)' }}>{p.factureNumero}</span>}
        </div>
      ),
    },
    { key: 'montant', header: 'Montant', sortable: true, align: 'right', cell: (p) => <strong className="amount">{formatCurrency(p.montant)}</strong> },
    { key: 'date', header: 'Date paiement', sortable: true, cell: (p) => <span className="cell-muted">{formatDateTime(p.date)}</span> },
    { key: 'mode', header: 'Mode', sortable: true, cell: (p) => <StatusBadge tone="neutral" status={p.mode} label={MODE_LABEL[p.mode]} /> },
    { key: 'statut', header: 'Statut', sortable: true, cell: (p) => <StatusBadge status={p.statut} /> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Paiements"
        description="Suivi des paiements (factures fournisseur, indemnités, autres sorties)"
        breadcrumb={['Trésorerie', 'Finance', 'Paiements']}
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} />Nouveau paiement</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Référence, bénéficiaire..." />
          <SelectFilter label="Type" value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }}
            options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          <SelectFilter label="Statut" value={statut} onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'reussi', label: 'Réussi' },
              { value: 'en_attente', label: 'En attente' },
              { value: 'echoue', label: 'Échoué' },
              { value: 'rembourse', label: 'Remboursé' },
            ]} />
          <SelectFilter label="Mode" value={mode} onChange={(v) => { setMode(v); setPage(1); }}
            options={Object.entries(MODE_LABEL).map(([value, label]) => ({ value, label }))} />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(p) => p.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucun paiement"
        rowActions={(p) => (
          <span className="row-actions">
            <button className="icon-btn" onClick={() => setViewing(p)} title="Voir détails"><Eye size={15} /></button>
            {p.statut === 'en_attente' && (
              <button className="icon-btn icon-btn--success" onClick={() => valider.mutate(p.id)} title="Valider paiement" disabled={valider.isPending}><CheckCircle2 size={15} /></button>
            )}
            <button className="icon-btn icon-btn--primary" onClick={() => setEditing(p)} title="Modifier"><Pencil size={15} /></button>
            {p.statut !== 'rembourse' && (
              <button className="icon-btn" onClick={() => setCancelling(p)} title="Annuler paiement"><Ban size={15} /></button>
            )}
            <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(p)} title="Supprimer"><Trash2 size={15} /></button>
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      {/* Generic create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau paiement">
        <PaiementForm onCancel={() => setCreating(false)} onSubmit={(v) => create.mutateAsync(v)} submitting={create.isPending} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le paiement">
        {editing && <PaiementForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(v) => update.mutateAsync({ id: editing.id, v })} submitting={update.isPending} />}
      </Modal>

      {/* Prefilled flows */}
      <Modal open={!!payingFacture} onClose={closePrefilled} title="Payer une facture fournisseur" size="lg">
        {payingFacture && (
          <PayFactureForm
            facture={payingFacture}
            onCancel={closePrefilled}
            onSubmit={(v) => payFacture.mutateAsync({ factureId: payingFacture.id, payload: v })}
            submitting={payFacture.isPending}
          />
        )}
      </Modal>
      <Modal open={!!payingIndemnite} onClose={closePrefilled} title="Payer une indemnité" size="lg">
        {payingIndemnite && (
          <PayIndemniteForm
            indemnite={payingIndemnite}
            onCancel={closePrefilled}
            onSubmit={(v) => payIndemnite.mutateAsync({ indemniteId: payingIndemnite.id, payload: v })}
            submitting={payIndemnite.isPending}
          />
        )}
      </Modal>

      {/* Detail view modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Détails du paiement" size="md">
        {viewing && <PaiementDetail paiement={viewing} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting} title="Supprimer ce paiement ?"
        message={`Le paiement ${deleting?.reference} sera supprimé.`}
        confirmLabel="Supprimer" destructive loading={remove.isPending}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
      <ConfirmDialog
        open={!!cancelling} title="Annuler ce paiement ?"
        message={`Le paiement ${cancelling?.reference} sera marqué comme remboursé et la trésorerie sera ajustée.`}
        confirmLabel="Annuler le paiement" destructive loading={annuler.isPending}
        onCancel={() => setCancelling(null)} onConfirm={() => cancelling && annuler.mutate(cancelling.id)}
      />
    </div>
  );
}

function PaiementDetail({ paiement: p }: { paiement: Paiement }) {
  const t = inferType(p);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Detail label="Référence" value={<span style={{ fontFamily: 'var(--font-family-mono, monospace)' }}>{p.reference}</span>} icon={<CreditCard size={14} />} />
      <Detail label="Type de paiement" value={TYPE_LABEL[t]} icon={TYPE_ICON[t]} />
      <Detail label="Bénéficiaire" value={p.beneficiaire} />
      {p.factureNumero && <Detail label="Facture liée" value={p.factureNumero} />}
      <Detail label="Montant" value={<strong style={{ fontSize: 16 }}>{formatCurrency(p.montant)}</strong>} />
      <Detail label="Mode" value={MODE_LABEL[p.mode]} />
      <Detail label="Statut" value={<StatusBadge status={p.statut} />} />
      <Detail label="Date paiement" value={formatDateTime(p.date)} />
      {p.compteBancaireBanque && <Detail label="Compte bancaire" value={p.compteBancaireBanque} />}
      {p.description && <Detail label="Description" value={p.description} />}
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
        {icon}{label}
      </span>
      <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
