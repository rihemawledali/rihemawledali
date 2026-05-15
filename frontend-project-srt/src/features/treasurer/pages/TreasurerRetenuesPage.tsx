/* ============================================
   Treasurer — Retenues mensuelles
   Default = aggregated view (1 row per adhérent × mois × année).
   Toggle « Vue détaillée » switches to the legacy flat view
   (1 row per RetenueLigne).
   ============================================ */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt, RefreshCw, Wallet, CheckCircle2, Eye, Download, Layers, ListChecks,
  HandCoins, Banknote, Building2, Clock, AlertTriangle, Calendar,
  Ticket,
} from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { DataTable, type Column } from '../../../shared/data/DataTable';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../shared/data/FilterBar';
import { Pagination } from '../../../shared/data/Pagination';
import { formatCurrency, formatNumber } from '../../../shared/lib/formatters';
import {
  treasurerRetenuesApi,
  type RetenueMensuelle,
  type RetenueMensuelleStatut,
  type RetenueLigneRow,
  type RetenueLigneStatut,
  type RetenueLigneType,
} from '../retenues/api';
import '../../../shared/layout/CrudPage.css';
import './TreasurerRetenuesPage.css';

// ---- Master statut visuals ----

const MASTER_LABEL: Record<RetenueMensuelleStatut, string> = {
  GENEREE: 'À exporter',
  EXPORTEE: 'Exportée',
};

const MASTER_TONE: Record<RetenueMensuelleStatut, 'info' | 'success'> = {
  GENEREE: 'info',
  EXPORTEE: 'success',
};

// ---- Ligne statut visuals (flat view) ----

const LIGNE_LABEL: Record<RetenueLigneStatut, string> = {
  GENEREE: 'Générée',
  EN_ATTENTE: 'En attente',
  PRELEVEE: 'Prélevée',
  ANNULEE: 'Annulée',
};

const LIGNE_TONE: Record<RetenueLigneStatut, 'info' | 'warning' | 'success' | 'error'> = {
  GENEREE: 'info',
  EN_ATTENTE: 'warning',
  PRELEVEE: 'success',
  ANNULEE: 'error',
};

const TYPE_LABEL: Record<RetenueLigneType, string> = {
  COTISATION: 'Cotisation',
  PRET: 'Prêt',
  CONVENTION: 'Convention',
  TICKET_RESTAURANT: 'Ticket restaurant',
};

const TYPE_ICON: Record<RetenueLigneType, ReactNode> = {
  COTISATION: <HandCoins size={14} />,
  PRET: <Banknote size={14} />,
  CONVENTION: <Building2 size={14} />,
  TICKET_RESTAURANT: <Ticket size={14} />,
};

function formatMonth(mois: number, annee: number): string {
  const d = new Date(annee, mois - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

type ViewMode = 'group' | 'flat';

const NOW = new Date();
const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function TreasurerRetenuesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>('group');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [periodMois, setPeriodMois] = useState<number>(NOW.getMonth() + 1);
  const [periodAnnee, setPeriodAnnee] = useState<number>(NOW.getFullYear());
  const [toast, setToast] = useState<string | null>(null);

  const fire = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  // ---- All masters (used for the année list + cross-period stats) ----
  const all = useQuery({
    queryKey: ['treasurer', 'retenues', 'all'],
    queryFn: () => treasurerRetenuesApi.list({ page: 1, size: 1000 }),
  });

  // Build the année dropdown from existing masters + current year.
  const anneeOptions = useMemo(() => {
    const years = new Set<number>();
    years.add(NOW.getFullYear());
    (all.data?.items ?? []).forEach((r) => years.add(r.annee));
    return [...years].sort((a, b) => b - a);
  }, [all.data]);

  // ---- Stats scoped to the selected period ----
  const stats = useMemo(() => {
    const items = (all.data?.items ?? []).filter(
      (r) => r.mois === periodMois && r.annee === periodAnnee,
    );
    const lignes = items.flatMap((r) => r.lignes ?? []);
    const lignesActives = lignes.filter((l) => l.statut !== 'ANNULEE');
    const sansCotisation = items.filter((r) => r.totalCotisation <= 0).length;
    const exportees = items.filter((r) => r.statut === 'EXPORTEE').length;
    const montantTotal = items.reduce((s, r) => s + r.totalRetenu, 0);
    return {
      total: items.length,
      exportees,
      aExporter: items.filter((r) => r.statut === 'GENEREE').length,
      sansCotisation,
      montantTotal,
      lignesActives: lignesActives.length,
      lignesEnAttente: lignes.filter((l) => l.statut === 'EN_ATTENTE').length,
      lignesPrelevees: lignes.filter((l) => l.statut === 'PRELEVEE').length,
      lignesAnnulees: lignes.filter((l) => l.statut === 'ANNULEE').length,
    };
  }, [all.data, periodMois, periodAnnee]);

  const currentPeriodLabel = `${MOIS_LABELS[periodMois - 1]} ${periodAnnee}`;

  // ---- Period-scoped client-side filtering ----
  const filterByPeriod = <T extends { mois: number; annee: number }>(rows: T[]): T[] =>
    rows.filter((r) => r.mois === periodMois && r.annee === periodAnnee);

  // ---- Master view query ----
  const groupQuery = useQuery({
    queryKey: ['treasurer', 'retenues', 'group', { page, search, statut, periodMois, periodAnnee }],
    queryFn: async () => {
      const res = await treasurerRetenuesApi.list({ page: 1, size: 1000, search, filters: { statut } });
      const scoped = filterByPeriod(res.items);
      const start = (page - 1) * 10;
      return { items: scoped.slice(start, start + 10), total: scoped.length };
    },
    enabled: mode === 'group',
  });

  // ---- Flat view query ----
  const flatQuery = useQuery({
    queryKey: ['treasurer', 'retenues', 'flat', { page, search, statut, periodMois, periodAnnee }],
    queryFn: async () => {
      const res = await treasurerRetenuesApi.listFlat({ page: 1, size: 5000, search, filters: { statut } });
      const scoped = filterByPeriod(res.items);
      const start = (page - 1) * 10;
      return { items: scoped.slice(start, start + 10), total: scoped.length };
    },
    enabled: mode === 'flat',
  });

  const displayedTotal = mode === 'group'
    ? (groupQuery.data?.total ?? 0)
    : (flatQuery.data?.total ?? 0);

  // ---- Generate (idempotent) for the selected period ----
  const generate = useMutation({
    mutationFn: () => treasurerRetenuesApi.generate({ mois: periodMois, annee: periodAnnee }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      qc.invalidateQueries({ queryKey: ['treasurer', 'tresorerie'] });
      fire(
        `Mois ${String(res.mois).padStart(2, '0')}/${res.annee} — ${res.created} créées · ${res.updated} mises à jour`,
      );
    },
    onError: (err) => fire(err instanceof Error ? err.message : 'Échec de la génération'),
  });

  // ---- Export the selected period (CSV, backend-generated) ----
  const exportCurrent = useMutation({
    mutationFn: () => treasurerRetenuesApi.exportPeriod(periodMois, periodAnnee),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      fire(`Export CSV prêt : ${res.filename}`);
    },
    onError: (err) => fire(err instanceof Error ? err.message : "Échec de l'export"),
  });

  // ---- Per-row regenerate (recompute lignes from live adhésion + prêts) ----
  const regenerateRow = useMutation({
    mutationFn: (id: string) => treasurerRetenuesApi.regenerate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      fire('Lignes recalculées avec succès.');
    },
    onError: (err) => fire(err instanceof Error ? err.message : 'Échec de la régénération'),
  });

  // ---- Per-row export ----
  const exportRow = useMutation({
    mutationFn: (id: string) => treasurerRetenuesApi.exportOne(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      fire(`Export CSV prêt : ${res.filename}`);
    },
    onError: (err) => fire(err instanceof Error ? err.message : "Échec de l'export"),
  });

  // ---- Navigation to the detail page ----
  const openDetail = useCallback((id: string) => {
    navigate(`/treasurer/retenues/${id}`);
  }, [navigate]);

  // ---- Columns: aggregated view ----
  const groupColumns: Column<RetenueMensuelle>[] = useMemo(() => [
    {
      key: 'adherentNom',
      header: 'Adhérent',
      width: '230px',
      cell: (r) => (
        <div>
          <strong className="cell-strong">{r.adherentNom}</strong>
          <div className="retenue-member-meta">
            {r.adherentMatricule ? r.adherentMatricule : 'Sans matricule'}
            <span>{formatNumber(r.lignes?.length ?? 0)} ligne{(r.lignes?.length ?? 0) > 1 ? 's' : ''}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'ventilation',
      header: 'Détails retenue',
      width: '360px',
      cell: (r) => r.totalCotisation > 0 ? (
        <div className="retenue-breakdown-cell">
          <BreakdownMini label="Cot." value={formatCurrency(r.totalCotisation)} tone="info" />
          <BreakdownMini label="Prêt" value={r.totalPret > 0 ? formatCurrency(r.totalPret) : '—'} tone="warning" muted={r.totalPret <= 0} />
          <BreakdownMini label="Conv." value={r.totalConvention > 0 ? formatCurrency(r.totalConvention) : '—'} tone="primary" muted={r.totalConvention <= 0} />
        </div>
      ) : (
        <div className="retenue-breakdown-cell">
          <span
            title="Aucune ligne de cotisation pour cet adhérent — l'adhésion n'est peut-être pas active ce mois-ci. Cliquez sur « Régénérer » pour recalculer."
            className="retenue-missing-badge"
          >
            <AlertTriangle size={12} /> Cotisation manquante
          </span>
          <BreakdownMini label="Prêt" value={r.totalPret > 0 ? formatCurrency(r.totalPret) : '—'} tone="warning" muted={r.totalPret <= 0} />
          <BreakdownMini label="Conv." value={r.totalConvention > 0 ? formatCurrency(r.totalConvention) : '—'} tone="primary" muted={r.totalConvention <= 0} />
        </div>
      ),
    },
    {
      key: 'totalRetenu',
      header: 'Total',
      align: 'right',
      width: '130px',
      cell: (r) => <strong className="amount">{formatCurrency(r.totalRetenu)}</strong>,
    },
    {
      key: 'statut',
      header: 'Statut',
      width: '140px',
      cell: (r) => (
        <StatusBadge status={r.statut} tone={MASTER_TONE[r.statut]} label={MASTER_LABEL[r.statut]} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '170px',
      cell: (r) => (
        <div className="retenue-row-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => regenerateRow.mutate(r.id)}
            disabled={regenerateRow.isPending}
            aria-label={`Régénérer ${r.adherentNom}`}
            title="Recalculer les lignes (cotisation + prêts)"
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportRow.mutate(r.id)}
            disabled={exportRow.isPending}
            aria-label={`Exporter ${r.adherentNom}`}
            title="Exporter (CSV)"
          >
            <Download size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDetail(r.id)}
            aria-label={`Voir le détail de ${r.id}`}
            title="Voir le détail"
          >
            <Eye size={16} />
          </Button>
        </div>
      ),
    },
  ], [openDetail, regenerateRow, exportRow]);

  // ---- Columns: flat view ----
  const flatColumns: Column<RetenueLigneRow>[] = useMemo(() => [
    {
      key: 'adherentNom',
      header: 'Adhérent',
      cell: (r) => <strong className="cell-strong">{r.adherentNom}</strong>,
    },
    {
      key: 'mois',
      header: 'Mois',
      cell: (r) => formatMonth(r.mois, r.annee),
      width: '150px',
    },
    {
      key: 'typeSource',
      header: 'Type',
      width: '130px',
      cell: (r) => (
        <span className="retenue-type-pill">
          {TYPE_ICON[r.typeSource]}
          {TYPE_LABEL[r.typeSource]}
        </span>
      ),
    },
    {
      key: 'motif',
      header: 'Motif',
      cell: (r) => (
        <div className="retenue-line-copy">
          <strong>{r.motif || 'Retenue sans motif'}</strong>
          {r.sourceRefId && <span>Source {r.sourceRefId}</span>}
        </div>
      ),
    },
    {
      key: 'montant',
      header: 'Montant',
      align: 'right',
      width: '130px',
      cell: (r) => <strong className="amount">{formatCurrency(r.montant)}</strong>,
    },
    {
      key: 'statut',
      header: 'Statut',
      width: '130px',
      cell: (r) => (
        <StatusBadge status={r.statut} tone={LIGNE_TONE[r.statut]} label={LIGNE_LABEL[r.statut]} />
      ),
    },
    {
      key: 'masterStatut',
      header: 'Workflow',
      width: '140px',
      cell: (r) => (
        <StatusBadge status={r.masterStatut} tone={MASTER_TONE[r.masterStatut]} label={MASTER_LABEL[r.masterStatut]} />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openDetail(r.retenueMensuelleId)}
          aria-label={`Voir la retenue ${r.retenueMensuelleId}`}
          title="Voir la retenue (master)"
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ], [openDetail]);

  // ---- Filters ----
  const masterStatutOptions = (Object.entries(MASTER_LABEL) as [RetenueMensuelleStatut, string][])
    .map(([value, label]) => ({ value, label }));
  const ligneStatutOptions = (Object.entries(LIGNE_LABEL) as [RetenueLigneStatut, string][])
    .map(([value, label]) => ({ value, label }));

  return (
    <div className="treasurer-retenues-page">
      <PageHeader
        title="Retenues mensuelles"
        description={`Générer, contrôler et exporter les retenues sur paie — période sélectionnée : ${currentPeriodLabel}`}
        breadcrumb={['Trésorerie', 'Finance', 'Retenues']}
        actions={(
          <div className="retenue-header-actions">
            <Button onClick={() => generate.mutate()} isLoading={generate.isPending}>
              <RefreshCw size={16} />
              Générer la période
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportCurrent.mutate()}
              isLoading={exportCurrent.isPending}
              disabled={stats.total === 0}
              title={stats.total === 0 ? "Aucune retenue à exporter sur cette période — cliquez d'abord sur « Générer la période »" : undefined}
            >
              <Download size={16} />
              Exporter la période (CSV)
            </Button>
          </div>
        )}
      />

      <section className="retenue-stats-grid">
        <RetenueMetric
          label="Adhérents avec retenue"
          value={formatNumber(stats.total)}
          icon={<Receipt size={22} />}
          tone="primary"
          loading={all.isLoading}
        />
        <RetenueMetric
          label="Exportées"
          value={formatNumber(stats.exportees)}
          icon={<CheckCircle2 size={22} />}
          tone="success"
          loading={all.isLoading}
        />
        <RetenueMetric
          label="À exporter"
          value={formatNumber(stats.aExporter)}
          icon={<Clock size={22} />}
          tone="warning"
          loading={all.isLoading}
        />
        <RetenueMetric
          label="Cotisations manquantes"
          value={formatNumber(stats.sansCotisation)}
          icon={<AlertTriangle size={22} />}
          tone={stats.sansCotisation > 0 ? 'error' : 'info'}
          loading={all.isLoading}
        />
        <RetenueMetric
          label="Montant total"
          value={formatCurrency(stats.montantTotal)}
          icon={<Wallet size={22} />}
          tone="success"
          loading={all.isLoading}
        />
      </section>

      <section className="retenue-workspace">
        <div className="crud-toolbar retenue-toolbar">
          <div className="retenue-view-switch" role="group" aria-label="Mode d'affichage">
            <button
              type="button"
              onClick={() => { setMode('group'); setPage(1); setStatut(''); }}
              className={mode === 'group' ? 'is-active' : undefined}
            >
              <Layers size={14} />
              <span>Vue agrégée</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('flat'); setPage(1); setStatut(''); }}
              className={mode === 'flat' ? 'is-active' : undefined}
            >
              <ListChecks size={14} />
              <span>Vue détaillée</span>
            </button>
          </div>
          <FilterBar>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder={mode === 'group' ? 'Adhérent, mois…' : 'Adhérent, motif, type…'}
            />
            <SelectFilter
              label="Statut"
              value={statut}
              onChange={(v) => { setStatut(v); setPage(1); }}
              options={mode === 'group' ? masterStatutOptions : ligneStatutOptions}
            />
            <div
              className="retenue-period-picker"
              title="Période affichée"
            >
              <Calendar size={14} />
              <select
                value={periodMois}
                onChange={(e) => { setPeriodMois(Number(e.target.value)); setPage(1); }}
                aria-label="Mois"
              >
                {MOIS_LABELS.map((label, i) => (
                  <option key={i + 1} value={i + 1}>{label}</option>
                ))}
              </select>
              <select
                value={periodAnnee}
                onChange={(e) => { setPeriodAnnee(Number(e.target.value)); setPage(1); }}
                aria-label="Année"
              >
                {anneeOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </FilterBar>
        </div>

        <div className="retenue-table-context">
          <div>
            <strong>{loadingText(mode, displayedTotal, all.isLoading || groupQuery.isLoading || flatQuery.isLoading)}</strong>
            <span>{mode === 'group' ? 'retenues adhérents' : 'lignes de détail'} pour {currentPeriodLabel}</span>
          </div>
          <span>
            {stats.lignesActives} lignes actives · {stats.lignesPrelevees} prélevées · {stats.lignesEnAttente} en attente
          </span>
        </div>

      {mode === 'group' ? (
        <>
          <DataTable
            columns={groupColumns}
            rows={groupQuery.data?.items ?? []}
            loading={groupQuery.isLoading}
            rowKey={(r) => r.id}
            emptyTitle={`Aucune retenue pour ${currentPeriodLabel}`}
            emptyDescription="Cliquez sur « Générer la période » pour créer les retenues mensuelles."
          />
          {groupQuery.data && groupQuery.data.total > 0 && (
            <div className="data-table-card retenue-pagination">
              <Pagination page={page} size={10} total={groupQuery.data.total} onPageChange={setPage} />
            </div>
          )}
        </>
      ) : (
        <>
          <DataTable
            columns={flatColumns}
            rows={flatQuery.data?.items ?? []}
            loading={flatQuery.isLoading}
            rowKey={(r) => r.id}
            emptyTitle="Aucune ligne"
            emptyDescription="Aucune ligne correspondante. Essayez d'autres filtres."
          />
          {flatQuery.data && flatQuery.data.total > 0 && (
            <div className="data-table-card retenue-pagination">
              <Pagination page={page} size={10} total={flatQuery.data.total} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
      </section>

      {toast && (
        <div className="retenue-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

function loadingText(mode: ViewMode, total: number, loading?: boolean) {
  if (loading) return 'Chargement...';
  const label = mode === 'group' ? 'retenue' : 'ligne';
  return `${formatNumber(total)} ${label}${total > 1 ? 's' : ''}`;
}

function BreakdownMini({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone: 'info' | 'warning' | 'primary';
  muted?: boolean;
}) {
  return (
    <span className={`retenue-breakdown-mini retenue-breakdown-mini--${tone} ${muted ? 'is-muted' : ''}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

function RetenueMetric({
  icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
}) {
  return (
    <article className={`retenue-metric retenue-metric--${tone}`}>
      <span className="retenue-metric-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </article>
  );
}
