/* ============================================
   Treasurer — Prêts sociaux
   ============================================ */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Banknote, Clock, AlertTriangle, CheckCircle2, Calculator, Calendar } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { StatCard } from '../../../components/charts/StatCard';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../components/data/FilterBar';
import { Pagination } from '../../../components/data/Pagination';
import { ConfirmDialog } from '../../../components/data/ConfirmDialog';
import { useToast } from '../../../components/feedback/useToast';
import { formatCurrency, formatDate, formatNumber } from '../../../lib/formatters';
import { treasurerPretsApi } from '../api/treasurerListApi';
import { pretsApi } from '../../adherent/api/pretsApi';
import { RequestDetailModal } from '../components/RequestDetailModal';
import type { PretSocial } from '../../../types/domain';
import '../../../components/layout/CrudPage.css';
import '../../dashboard/pages/OverviewPage.css';

export function TreasurerPretsPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [selected, setSelected] = useState<PretSocial | null>(null);
  const [rejecting, setRejecting] = useState<PretSocial | null>(null);

  const valider = useMutation({
    mutationFn: (id: string) => treasurerPretsApi.valider(id),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'prets'] });
      toast.push({ title: `Prêt ${p.id.toUpperCase()} validé`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const rejeter = useMutation({
    mutationFn: (id: string) => treasurerPretsApi.rejeter(id),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'prets'] });
      setRejecting(null);
      toast.push({ title: `Prêt ${p.id.toUpperCase()} rejeté`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  // KPI uses the unfiltered list
  const all = useQuery({
    queryKey: ['treasurer', 'prets', 'all'],
    queryFn: () => treasurerPretsApi.list({ page: 1, size: 1000 }),
  });

  const query = useQuery({
    queryKey: ['treasurer', 'prets', { page, search, statut }],
    queryFn: () =>
      treasurerPretsApi.list({ page, size: 10, search, filters: { statut } }),
  });

  const stats = useMemo(() => {
    const items = all.data?.items ?? [];
    return {
      total: items.length,
      enAttente: items.filter((p) => p.statut === 'en_attente').length,
      enCours: items.filter((p) => p.statut === 'en_cours').length,
      enRetard: items.filter((p) => p.statut === 'en_retard').length,
      totalEncours: items
        .filter((p) => p.statut === 'en_cours' || p.statut === 'en_retard')
        .reduce((s, p) => s + p.montant, 0),
    };
  }, [all.data]);

  const columns: Column<PretSocial>[] = useMemo(() => [
    {
      key: 'id',
      header: 'Référence',
      cell: (p) => <span className="cell-mono">{p.id.toUpperCase()}</span>,
      width: '120px',
    },
    {
      key: 'adherent',
      header: 'Adhérent',
      cell: (p) => <strong className="cell-strong">{p.adherentNom}</strong>,
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (p) => <strong className="amount">{formatCurrency(p.montant)}</strong>,
      align: 'right',
      width: '140px',
    },
    {
      key: 'duree',
      header: 'Durée',
      cell: (p) => `${p.duree} mois`,
      width: '100px',
    },
    {
      key: 'taux',
      header: 'Taux',
      cell: (p) => `${p.taux.toFixed(1)} %`,
      width: '90px',
    },
    {
      key: 'date',
      header: 'Demande',
      cell: (p) => formatDate(p.dateDemande),
      width: '130px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (p) => <StatusBadge status={p.statut} />,
      width: '120px',
    },
  ], []);

  return (
    <div className="overview-page">
      <PageHeader
        title="Prêts sociaux"
        description="Valider ou rejeter les demandes de prêts sociaux"
        breadcrumb={['Trésorerie', 'Demandes', 'Prêts sociaux']}
      />

      <div className="overview-stats">
        <StatCard
          label="Total des prêts"
          value={formatNumber(stats.total)}
          icon={<Banknote size={22} />}
          tone="primary"
          loading={all.isLoading}
        />
        <StatCard
          label="En attente"
          value={formatNumber(stats.enAttente)}
          icon={<Clock size={22} />}
          tone="warning"
          loading={all.isLoading}
        />
        <StatCard
          label="En cours"
          value={formatNumber(stats.enCours)}
          icon={<CheckCircle2 size={22} />}
          tone="info"
          loading={all.isLoading}
        />
        <StatCard
          label="En retard"
          value={formatNumber(stats.enRetard)}
          icon={<AlertTriangle size={22} />}
          tone="error"
          loading={all.isLoading}
        />
        <StatCard
          label="Encours total"
          value={formatCurrency(stats.totalEncours)}
          icon={<Banknote size={22} />}
          tone="success"
          loading={all.isLoading}
        />
      </div>

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Adhérent, statut…"
          />
          <SelectFilter
            label="Statut"
            value={statut}
            onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'en_attente', label: 'En attente' },
              { value: 'en_cours', label: 'En cours' },
              { value: 'rembourse', label: 'Remboursé' },
              { value: 'en_retard', label: 'En retard' },
              { value: 'rejete', label: 'Rejeté' },
            ]}
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(p) => p.id}
        emptyTitle="Aucun prêt"
        rowActions={(p) => (
          <span className="row-actions" style={{ display: 'inline-flex', gap: 6 }}>
            <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>
              <Eye size={14} />
            </Button>
            {p.statut === 'en_attente' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => valider.mutate(p.id)}
                  disabled={valider.isPending}
                  title="Valider"
                >
                  <Check size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setRejecting(p)}
                  title="Rejeter"
                >
                  <X size={14} />
                </Button>
              </>
            )}
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <RequestDetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détails du prêt social"
        reference={selected?.id ?? ''}
        adherentNom={selected?.adherentNom ?? ''}
        dateDemande={selected?.dateDemande ?? ''}
        statut={selected?.statut ?? ''}
        motif={selected?.motif}
        documentNom={selected?.documentNom}
        documentSize={selected?.documentSize}
        canDecide={selected?.statut === 'en_attente'}
        onValidate={() => { if (selected) { valider.mutate(selected.id); setSelected(null); } }}
        onReject={() => { if (selected) { setRejecting(selected); setSelected(null); } }}
        fields={selected ? [
          { label: 'Montant',     icon: <Banknote size={14} />,  value: <strong>{formatCurrency(selected.montant)}</strong> },
          { label: 'Durée',       icon: <Clock size={14} />,     value: `${selected.duree} mois` },
          { label: 'Taux',        icon: <Calculator size={14} />, value: `${selected.taux.toFixed(1)} %` },
          { label: 'Mensualité',  icon: <Calculator size={14} />, value: <strong>{formatCurrency(pretsApi.calculateMonthlyPayment(selected.montant, selected.duree, selected.taux))}</strong> },
          ...(selected.dateAccord ? [{ label: 'Date d’accord', icon: <Calendar size={14} />, value: new Date(selected.dateAccord).toLocaleDateString('fr-FR') }] : []),
        ] : []}
      />

      <ConfirmDialog
        open={!!rejecting}
        title="Rejeter ce prêt ?"
        message={`La demande de ${rejecting?.adherentNom ?? ''} (${formatCurrency(rejecting?.montant ?? 0)}) sera marquée comme rejetée.`}
        confirmLabel="Rejeter"
        destructive
        loading={rejeter.isPending}
        onCancel={() => setRejecting(null)}
        onConfirm={() => rejecting && rejeter.mutate(rejecting.id)}
      />
    </div>
  );
}
