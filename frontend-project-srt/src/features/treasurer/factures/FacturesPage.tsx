import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, CreditCard, Eye, FileDown, FilePlus2 } from 'lucide-react';
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
import { facturesApi } from './api';
import { suppliersApi } from '../../../shared/api/suppliersApi';
import { formatCurrency, formatDate, daysUntil } from '../../../shared/lib/formatters';
import { getConventionAvantageSummary } from '../../../shared/lib/conventionWorkflow';
import type { Facture, FactureStatus, Fournisseur } from '../../../shared/types/domain';
import type { ConventionDemandeRow } from '../conventions-demande/api';
import '../../../shared/layout/CrudPage.css';
import '../../../shared/ui/FormInput.css';
import './FacturesPage.css';

const STATUT_LABEL: Partial<Record<FactureStatus, string>> = {
  brouillon: 'Brouillon',
  non_payee: 'Non payee',
  impayee: 'Non payee',
  partielle: 'Partielle',
  en_retard: 'En retard',
  payee: 'Payee',
  annulee: 'Annulee',
  GENEREE: 'Generee',
  VALIDEE: 'Validee',
  EN_PAIEMENT: 'En paiement',
  PAYEE: 'Payee',
};

const STATUT_TONE: Partial<Record<FactureStatus, 'success' | 'warning' | 'info' | 'error' | 'neutral'>> = {
  brouillon: 'neutral',
  non_payee: 'warning',
  impayee: 'warning',
  partielle: 'info',
  en_retard: 'error',
  payee: 'success',
  annulee: 'error',
  GENEREE: 'info',
  VALIDEE: 'success',
  EN_PAIEMENT: 'warning',
  PAYEE: 'success',
};

const NOW = new Date();
const MOIS_LABELS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

export function FacturesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const paiementsRoute = '/treasurer/paiements';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [sortBy, setSortBy] = useState('dateEcheance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [cancelling, setCancelling] = useState<Facture | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genFournisseurId, setGenFournisseurId] = useState('');
  const [genMois, setGenMois] = useState(NOW.getMonth() + 1);
  const [genAnnee, setGenAnnee] = useState(NOW.getFullYear());
  const [selectedDemandes, setSelectedDemandes] = useState<string[]>([]);
  const [detailFacture, setDetailFacture] = useState<Facture | null>(null);

  const query = useQuery({
    queryKey: ['factures', { page, search, statut, sortBy, sortDir }],
    queryFn: () => facturesApi.list({ page, size: 10, search, sortBy, sortDir, filters: { statut } }),
  });

  const suppliers = useQuery({
    queryKey: ['suppliers', 'facture-convention-options'],
    queryFn: () => suppliersApi.list({ page: 1, size: 200 }),
    enabled: generating,
  });

  const eligible = useQuery({
    queryKey: ['factures', 'convention-eligible', genFournisseurId, genMois, genAnnee],
    queryFn: () => facturesApi.eligibleConventionDemandes({
      fournisseurId: genFournisseurId,
      mois: genMois,
      annee: genAnnee,
    }),
    enabled: generating && !!genFournisseurId,
  });

  useEffect(() => {
    setSelectedDemandes((eligible.data ?? []).map((d) => d.id));
  }, [eligible.data]);

  const generateConvention = useMutation({
    mutationFn: () => facturesApi.generateConventionFacture({
      fournisseurId: genFournisseurId,
      mois: genMois,
      annee: genAnnee,
      demandeIds: selectedDemandes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'conventions'] });
      qc.invalidateQueries({ queryKey: ['adherent-conventions-demandes'] });
      setGenerating(false);
      setSelectedDemandes([]);
      toast.push({ title: 'Facture convention generee', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const downloadPdf = useMutation({
    mutationFn: (id: string) => facturesApi.downloadPdf(id),
    onError: (e) => toast.push({
      title: 'Telechargement impossible',
      description: e instanceof Error ? e.message : 'Erreur inconnue',
      variant: 'error',
    }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => facturesApi.annuler(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'conventions'] });
      qc.invalidateQueries({ queryKey: ['adherent-conventions-demandes'] });
      setCancelling(null);
      toast.push({ title: 'Facture annulee', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const validateConvention = useMutation({
    mutationFn: (id: string) => facturesApi.validerConvention(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'conventions'] });
      qc.invalidateQueries({ queryKey: ['adherent-conventions-demandes'] });
      toast.push({ title: 'Facture convention validee', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const detailDemandes = useQuery({
    queryKey: ['factures', 'convention-demandes', detailFacture?.id],
    queryFn: () => facturesApi.conventionDemandes(detailFacture!.id),
    enabled: !!detailFacture,
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));
  const handlePay = (f: Facture) => navigate(`${paiementsRoute}?factureId=${f.id}`);

  const columns: Column<Facture>[] = [
    { key: 'numero', header: 'N facture', sortable: true, cell: (f) => <span className="cell-mono">{f.numero}</span> },
    { key: 'fournisseurNom', header: 'Fournisseur', sortable: true, cell: (f) => <strong className="cell-strong">{f.fournisseurNom}</strong> },
    { key: 'dateEmission', header: 'Date', sortable: true, cell: (f) => formatDate(f.dateEmission) },
    { key: 'montant', header: 'Montant', sortable: true, align: 'right', cell: (f) => <strong className="amount">{formatCurrency(f.montant)}</strong> },
    { key: 'description', header: 'Description', cell: (f) => f.description ? <span className="facture-description">{f.description}</span> : <span className="cell-muted">-</span> },
    { key: 'dateEcheance', header: 'Echeance', sortable: true, cell: (f) => {
      const d = daysUntil(f.dateEcheance);
      const paid = f.statut === 'payee' || f.statut === 'PAYEE';
      const overdue = !paid && f.statut !== 'annulee' && d < 0;
      const soon = !paid && f.statut !== 'annulee' && d >= 0 && d < 7;
      return (
        <div className="row-stack">
          <span>{formatDate(f.dateEcheance)}</span>
          {overdue && <span className="facture-delay">{Math.abs(d)} j de retard</span>}
          {soon && <span className="facture-soon">Dans {d} j</span>}
        </div>
      );
    }},
    {
      key: 'statut', header: 'Statut', sortable: true,
      cell: (f) => <StatusBadge status={f.statut} tone={STATUT_TONE[f.statut]} label={STATUT_LABEL[f.statut]} />,
    },
  ];

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatut(value);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Factures"
        description="Factures fournisseurs consolidees depuis les conventions."
        breadcrumb={['Tresorerie', 'Finance', 'Factures']}
        actions={<Button onClick={() => setGenerating(true)}><FilePlus2 size={16} />Generer facture</Button>}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={changeSearch} placeholder="Numero, fournisseur, description..." />
          <SelectFilter label="Statut" value={statut} onChange={changeStatus}
            options={[
              { value: 'brouillon', label: 'Brouillon' },
              { value: 'non_payee', label: 'Non payee' },
              { value: 'impayee', label: 'Non payee (legacy)' },
              { value: 'partielle', label: 'Partielle' },
              { value: 'en_retard', label: 'En retard' },
              { value: 'payee', label: 'Payee' },
              { value: 'annulee', label: 'Annulee' },
              { value: 'GENEREE', label: 'Generee convention' },
              { value: 'VALIDEE', label: 'Validee convention' },
              { value: 'EN_PAIEMENT', label: 'En paiement convention' },
              { value: 'PAYEE', label: 'Payee convention' },
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
        emptyDescription="Cliquez sur Generer facture pour creer une facture convention."
        rowActions={(f) => {
          const paid = f.statut === 'payee' || f.statut === 'PAYEE';
          const cancelled = f.statut === 'annulee';
          const isConvention = f.sourceType === 'CONVENTION';
          const canValidate = isConvention && f.statut === 'GENEREE';
          const canPay = !paid && !cancelled && (!isConvention || f.statut === 'VALIDEE' || f.statut === 'EN_PAIEMENT');
          const canCancel = !paid && !cancelled && (!isConvention || f.statut === 'GENEREE');
          return (
            <span className="row-actions">
              {isConvention && (
                <button className="icon-btn" onClick={() => setDetailFacture(f)} title="Details convention">
                  <Eye size={15} />
                </button>
              )}
              {canValidate && (
                <button className="icon-btn icon-btn--success" onClick={() => validateConvention.mutate(f.id)} title="Valider la facture convention" disabled={validateConvention.isPending}>
                  <CheckCircle2 size={15} />
                </button>
              )}
              {canPay && (
                <button className="icon-btn icon-btn--success" onClick={() => handlePay(f)} title="Payer la facture" aria-label={`Payer la facture ${f.numero}`}>
                  <CreditCard size={15} />
                </button>
              )}
              {paid && (
                <button className="icon-btn" onClick={() => downloadPdf.mutate(f.id)} title="Telecharger le PDF" aria-label={`Telecharger la facture ${f.numero} en PDF`} disabled={downloadPdf.isPending}>
                  <FileDown size={15} />
                </button>
              )}
              {canCancel && (
                <button className="icon-btn" onClick={() => setCancelling(f)} title="Annuler la facture"><Ban size={15} /></button>
              )}
            </span>
          );
        }}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card data-table-pagination">
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={generating} onClose={() => setGenerating(false)} title="Generer facture convention" size="lg">
        <ConventionFactureGenerator
          fournisseurs={suppliers.data?.items ?? []}
          fournisseurId={genFournisseurId}
          mois={genMois}
          annee={genAnnee}
          demandes={eligible.data ?? []}
          selectedIds={selectedDemandes}
          loading={eligible.isLoading}
          submitting={generateConvention.isPending}
          onFournisseurChange={(value) => { setGenFournisseurId(value); setSelectedDemandes([]); }}
          onMoisChange={setGenMois}
          onAnneeChange={setGenAnnee}
          onToggle={(id) => setSelectedDemandes((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id])}
          onSubmit={() => generateConvention.mutate()}
          onCancel={() => setGenerating(false)}
        />
      </Modal>

      <Modal open={!!detailFacture} onClose={() => setDetailFacture(null)} title="Details facture convention" size="lg">
        <ConventionFactureDetails facture={detailFacture} demandes={detailDemandes.data ?? []} loading={detailDemandes.isLoading} />
      </Modal>

      <ConfirmDialog
        open={!!cancelling} title="Annuler cette facture ?"
        message={`La facture ${cancelling?.numero} sera marquee comme annulee.`}
        confirmLabel="Annuler la facture" destructive loading={cancel.isPending}
        onCancel={() => setCancelling(null)} onConfirm={() => cancelling && cancel.mutate(cancelling.id)}
      />
    </div>
  );
}
function ConventionFactureGenerator({
  fournisseurs,
  fournisseurId,
  mois,
  annee,
  demandes,
  selectedIds,
  loading,
  submitting,
  onFournisseurChange,
  onMoisChange,
  onAnneeChange,
  onToggle,
  onSubmit,
  onCancel,
}: {
  fournisseurs: Fournisseur[];
  fournisseurId: string;
  mois: number;
  annee: number;
  demandes: ConventionDemandeRow[];
  selectedIds: string[];
  loading: boolean;
  submitting: boolean;
  onFournisseurChange: (value: string) => void;
  onMoisChange: (value: number) => void;
  onAnneeChange: (value: number) => void;
  onToggle: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const totalAmicale = demandes
    .filter((d) => selectedIds.includes(d.id))
    .reduce((sum, d) => sum + (d.montantAmicale ?? 0), 0);
  const years = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];

  return (
    <div className="form-grid">
      <label>
        <span className="form-input-label">Fournisseur</span>
        <select className="form-input" value={fournisseurId} onChange={(e) => onFournisseurChange(e.target.value)}>
          <option value="">Selectionner un fournisseur</option>
          {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
      </label>
      <label>
        <span className="form-input-label">Mois</span>
        <select className="form-input" value={mois} onChange={(e) => onMoisChange(Number(e.target.value))}>
          {MOIS_LABELS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
        </select>
      </label>
      <label>
        <span className="form-input-label">Annee</span>
        <select className="form-input" value={annee} onChange={(e) => onAnneeChange(Number(e.target.value))}>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>

      <div className="form-grid-full">
        <div className="data-table-card facture-panel">
          <div className="row-stack facture-panel-title">
            <strong className="cell-strong">Demandes approuvees</strong>
            <span>{selectedIds.length} selectionnee(s) - total amicale {formatCurrency(totalAmicale)}</span>
          </div>
          {loading ? (
            <p className="cell-muted">Chargement...</p>
          ) : !fournisseurId ? (
            <p className="cell-muted">Selectionnez un fournisseur pour afficher les demandes approuvees facturables.</p>
          ) : demandes.length === 0 ? (
            <p className="cell-muted">Aucune demande approuvee facturable pour cette selection.</p>
          ) : (
            <div className="facture-list">
              {demandes.map((d) => (
                <label key={d.id} className="facture-select-row">
                  <input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => onToggle(d.id)} />
                  <ConventionDemandeAmountSummary demande={d} />
                  <strong className="amount facture-amount-right">
                    {formatCurrency(d.montantAmicale ?? 0)}
                  </strong>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-grid-full form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="button" onClick={onSubmit} disabled={!fournisseurId || selectedIds.length === 0 || submitting} isLoading={submitting}>
          Generer facture
        </Button>
      </div>
    </div>
  );
}
function ConventionDemandeAmountSummary({ demande }: { demande: ConventionDemandeRow }) {
  const avantage = getConventionAvantageSummary(demande);
  return (
    <span className="row-stack">
      <strong className="cell-strong">{demande.adherentNom}</strong>
      <span>{demande.conventionSnapshot?.fournisseurNom ?? '-'} - {avantage.label}</span>
      <span>
        Total {formatCurrency(demande.montantTotal ?? 0)}
        {' | '}
        Adherent {formatCurrency(demande.montantAdherent ?? 0)}
        {' | '}
        Amicale {formatCurrency(demande.montantAmicale ?? 0)}
      </span>
      {demande.retenueMontantMensuel != null && demande.retenueNombreMois != null && (
        <span>
          Retenue {formatCurrency(demande.retenueMontantMensuel)} / mois pendant {demande.retenueNombreMois} mois
        </span>
      )}
    </span>
  );
}

function ConventionFactureDetails({ facture, demandes, loading }: { facture: Facture | null; demandes: ConventionDemandeRow[]; loading: boolean }) {
  if (!facture) return null;
  return (
    <div className="row-stack facture-detail-layout">
      <div className="data-table-card facture-panel">
        <strong className="cell-strong">{facture.numero}</strong>
        <span>{facture.fournisseurNom} - {formatCurrency(facture.montant)}</span>
      </div>
      {loading ? <p className="cell-muted">Chargement...</p> : demandes.length === 0 ? (
        <p className="cell-muted">Aucune demande rattachee a cette facture convention.</p>
      ) : (
        <div className="facture-list">
          {demandes.map((d) => (
            <div key={d.id} className="facture-detail-row">
              <ConventionDemandeAmountSummary demande={d} />
              <strong className="amount">{formatCurrency(d.montantAmicale ?? 0)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
