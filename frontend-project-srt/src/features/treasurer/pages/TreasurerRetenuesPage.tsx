/* ============================================
   Treasurer — Retenues mensuelles
   Default = aggregated view (1 row per adhérent × mois × année).
   Toggle « Vue détaillée » switches to the legacy flat view
   (1 row per RetenueLigne).
   ============================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt, RefreshCw, Wallet, CheckCircle2, Eye, Download, Layers, ListChecks,
  HandCoins, Banknote, Building2, Clock, AlertTriangle, Calendar,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { StatCard } from '../../../components/charts/StatCard';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../components/data/FilterBar';
import { Pagination } from '../../../components/data/Pagination';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import {
  treasurerRetenuesApi,
  type RetenueMensuelle,
  type RetenueMensuelleStatut,
  type RetenueLigneRow,
  type RetenueLigneStatut,
  type RetenueLigneType,
} from '../api/treasurerListApi';
import '../../../components/layout/CrudPage.css';
import '../../dashboard/pages/OverviewPage.css';

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
};

const TYPE_ICON: Record<RetenueLigneType, React.ReactNode> = {
  COTISATION: <HandCoins size={14} />,
  PRET: <Banknote size={14} />,
  CONVENTION: <Building2 size={14} />,
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
    const sansCotisation = items.filter((r) => r.totalCotisation <= 0).length;
    return {
      total: items.length,
      exportees: items.filter((r) => r.statut === 'EXPORTEE').length,
      aExporter: items.filter((r) => r.statut === 'GENEREE').length,
      sansCotisation,
      montantTotal: items.reduce((s, r) => s + r.totalRetenu, 0),
    };
  }, [all.data, periodMois, periodAnnee]);

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
  const openDetail = (id: string) => navigate(`/treasurer/retenues/${id}`);

  // ---- Columns: aggregated view ----
  const groupColumns: Column<RetenueMensuelle>[] = useMemo(() => [
    {
      key: 'adherentNom',
      header: 'Adhérent',
      cell: (r) => (
        <div>
          <strong className="cell-strong">{r.adherentNom}</strong>
          {r.adherentMatricule && (
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              {r.adherentMatricule}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'mois',
      header: 'Mois',
      cell: (r) => formatMonth(r.mois, r.annee),
      width: '160px',
    },
    {
      key: 'totalCotisation',
      header: 'Cotisation',
      align: 'right',
      width: '140px',
      cell: (r) => r.totalCotisation > 0 ? (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(r.totalCotisation)}</span>
      ) : (
        <span
          title="Aucune ligne de cotisation pour cet adhérent — l'adhésion n'est peut-être pas active ce mois-ci. Cliquez sur « Régénérer » pour recalculer."
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 999,
            background: '#fff7ed',
            color: '#c2410c',
            border: '1px solid #fed7aa',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={12} /> Manquante
        </span>
      ),
    },
    {
      key: 'totalPret',
      header: 'Prêt',
      align: 'right',
      width: '120px',
      cell: (r) => r.totalPret > 0 ? formatCurrency(r.totalPret) : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>,
    },
    {
      key: 'totalConvention',
      header: 'Convention',
      align: 'right',
      width: '120px',
      cell: (r) => r.totalConvention > 0 ? formatCurrency(r.totalConvention) : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>,
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
        <div style={{ display: 'inline-flex', gap: 4, justifyContent: 'flex-end' }}>
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {TYPE_ICON[r.typeSource]}
          {TYPE_LABEL[r.typeSource]}
        </span>
      ),
    },
    { key: 'motif', header: 'Motif', cell: (r) => r.motif },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [openDetail]);

  // ---- Filters ----
  const masterStatutOptions = (Object.entries(MASTER_LABEL) as [RetenueMensuelleStatut, string][])
    .map(([value, label]) => ({ value, label }));
  const ligneStatutOptions = (Object.entries(LIGNE_LABEL) as [RetenueLigneStatut, string][])
    .map(([value, label]) => ({ value, label }));

  return (
    <div className="overview-page">
      <PageHeader
        title="Retenues mensuelles"
        description={`Générer et exporter les retenues sur paie — Période sélectionnée : ${MOIS_LABELS[periodMois - 1]} ${periodAnnee}`}
        breadcrumb={['Trésorerie', 'Finance', 'Retenues']}
        actions={(
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => generate.mutate()} isLoading={generate.isPending}>
              <RefreshCw size={16} style={{ marginRight: 6 }} />
              Générer la période
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportCurrent.mutate()}
              isLoading={exportCurrent.isPending}
              disabled={stats.total === 0}
              title={stats.total === 0 ? "Aucune retenue à exporter sur cette période — cliquez d'abord sur « Générer la période »" : undefined}
            >
              <Download size={16} style={{ marginRight: 6 }} />
              Exporter la période (CSV)
            </Button>
          </div>
        )}
      />

      <div className="overview-stats">
        <StatCard
          label="Adhérents avec retenue"
          value={formatNumber(stats.total)}
          icon={<Receipt size={22} />}
          tone="primary"
          loading={all.isLoading}
        />
        <StatCard
          label="Exportées"
          value={formatNumber(stats.exportees)}
          icon={<CheckCircle2 size={22} />}
          tone="success"
          loading={all.isLoading}
        />
        <StatCard
          label="À exporter"
          value={formatNumber(stats.aExporter)}
          icon={<Clock size={22} />}
          tone="warning"
          loading={all.isLoading}
        />
        <StatCard
          label="Cotisations manquantes"
          value={formatNumber(stats.sansCotisation)}
          icon={<AlertTriangle size={22} />}
          tone={stats.sansCotisation > 0 ? 'error' : 'info'}
          loading={all.isLoading}
        />
        <StatCard
          label="Montant total"
          value={formatCurrency(stats.montantTotal)}
          icon={<Wallet size={22} />}
          tone="success"
          loading={all.isLoading}
        />
      </div>

      <div className="crud-toolbar" style={{ flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => { setMode('group'); setPage(1); setStatut(''); }}
            style={{
              padding: '8px 12px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'group' ? 'var(--color-primary-600)' : 'var(--color-surface)',
              color: mode === 'group' ? 'white' : 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Layers size={14} /> Vue agrégée
          </button>
          <button
            type="button"
            onClick={() => { setMode('flat'); setPage(1); setStatut(''); }}
            style={{
              padding: '8px 12px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'flat' ? 'var(--color-primary-600)' : 'var(--color-surface)',
              color: mode === 'flat' ? 'white' : 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              borderLeft: '1px solid var(--color-border)',
            }}
          >
            <ListChecks size={14} /> Vue détaillée
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 8px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              height: 36,
            }}
            title="Période affichée"
          >
            <Calendar size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <select
              value={periodMois}
              onChange={(e) => { setPeriodMois(Number(e.target.value)); setPage(1); }}
              style={{ border: 'none', background: 'transparent', padding: '4px 4px', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
              aria-label="Mois"
            >
              {MOIS_LABELS.map((label, i) => (
                <option key={i + 1} value={i + 1}>{label}</option>
              ))}
            </select>
            <select
              value={periodAnnee}
              onChange={(e) => { setPeriodAnnee(Number(e.target.value)); setPage(1); }}
              style={{ border: 'none', background: 'transparent', padding: '4px 4px', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
              aria-label="Année"
            >
              {anneeOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </FilterBar>
      </div>

      {mode === 'group' ? (
        <>
          <DataTable
            columns={groupColumns}
            rows={groupQuery.data?.items ?? []}
            loading={groupQuery.isLoading}
            rowKey={(r) => r.id}
            emptyTitle={`Aucune retenue pour ${MOIS_LABELS[periodMois - 1]} ${periodAnnee}`}
            emptyDescription="Cliquez sur « Générer la période » pour créer les retenues mensuelles."
          />
          {groupQuery.data && groupQuery.data.total > 0 && (
            <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
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
            <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
              <Pagination page={page} size={10} total={flatQuery.data.total} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, padding: '10px 14px',
            background: 'var(--color-primary-700)', color: 'white',
            borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)',
            fontWeight: 600, boxShadow: 'var(--shadow-md)', zIndex: 1000,
            maxWidth: 360,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
