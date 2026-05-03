/* ============================================
   Treasurer — Demandes de conventions
   Workflow: en_attente → validee | refusee
   ============================================ */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Handshake, Clock, CheckCircle2, Ban } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { StatCard } from '../../../components/charts/StatCard';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../components/data/FilterBar';
import { Pagination } from '../../../components/data/Pagination';
import { Modal } from '../../../components/data/Modal';
import { useToast } from '../../../components/feedback/useToast';
import { formatDate, formatNumber } from '../../../lib/formatters';
import {
  treasurerConventionsApi,
  type ConventionDemandeRow,
  type ConventionDemandeStatutBE,
} from '../api/treasurerListApi';
import '../../../components/layout/CrudPage.css';
import '../../dashboard/pages/OverviewPage.css';

const STATUT_LABEL: Record<ConventionDemandeStatutBE, string> = {
  en_attente: 'En attente',
  validee: 'Validée',
  refusee: 'Refusée',
  annulee: 'Annulée',
};

const STATUT_TONE: Record<ConventionDemandeStatutBE, 'warning' | 'success' | 'error' | 'neutral'> = {
  en_attente: 'warning',
  validee: 'success',
  refusee: 'error',
  annulee: 'neutral',
};

const CONV_TYPE_LABEL: Record<string, string> = {
  sante: 'Santé',
  restauration: 'Restauration',
  transport: 'Transport',
  loisir: 'Loisir',
  commerce: 'Commerce',
  education: 'Éducation',
};

export function TreasurerConventionsPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [rejecting, setRejecting] = useState<ConventionDemandeRow | null>(null);
  const [motif, setMotif] = useState('');

  const all = useQuery({
    queryKey: ['treasurer', 'conventions', 'all'],
    queryFn: () => treasurerConventionsApi.list({ page: 1, size: 1000 }),
  });

  const query = useQuery({
    queryKey: ['treasurer', 'conventions', { page, search, statut }],
    queryFn: () =>
      treasurerConventionsApi.list({ page, size: 10, search, filters: { statut } }),
  });

  const stats = useMemo(() => {
    const items = all.data?.items ?? [];
    return {
      total: items.length,
      enAttente: items.filter((d) => d.statut === 'en_attente').length,
      validees: items.filter((d) => d.statut === 'validee').length,
      refusees: items.filter((d) => d.statut === 'refusee').length,
    };
  }, [all.data]);

  const valider = useMutation({
    mutationFn: (id: string) => treasurerConventionsApi.valider(id),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'conventions'] });
      toast.push({
        title: `Demande ${d.id.toUpperCase()} validée`,
        variant: 'success',
      });
    },
    onError: (e) =>
      toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const refuser = useMutation({
    mutationFn: ({ id, motif: m }: { id: string; motif?: string }) =>
      treasurerConventionsApi.refuser(id, m),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'conventions'] });
      setRejecting(null);
      setMotif('');
      toast.push({ title: `Demande ${d.id.toUpperCase()} refusée`, variant: 'success' });
    },
    onError: (e) =>
      toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const columns: Column<ConventionDemandeRow>[] = useMemo(
    () => [
      {
        key: 'reference',
        header: 'Référence',
        cell: (d) => <span className="cell-mono">DEM-{d.id.toUpperCase()}</span>,
        width: '140px',
      },
      {
        key: 'adherent',
        header: 'Adhérent',
        cell: (d) => <strong className="cell-strong">{d.adherentNom}</strong>,
      },
      {
        key: 'convention',
        header: 'Convention',
        cell: (d) => {
          const snap = d.conventionSnapshot;
          if (!snap) return <span style={{ color: 'var(--color-text-secondary)' }}>—</span>;
          const typeLabel = snap.type ? CONV_TYPE_LABEL[snap.type] ?? snap.type : '';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <strong>{snap.fournisseurNom ?? '—'}</strong>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                {typeLabel}
                {snap.remise != null ? ` · ${snap.remise}% de remise` : ''}
              </span>
            </div>
          );
        },
      },
      {
        key: 'date',
        header: 'Demande',
        cell: (d) => formatDate(d.dateDemande),
        width: '130px',
      },
      {
        key: 'statut',
        header: 'Statut',
        cell: (d) => (
          <StatusBadge
            status={d.statut}
            tone={STATUT_TONE[d.statut]}
            label={STATUT_LABEL[d.statut]}
          />
        ),
        width: '130px',
      },
    ],
    [],
  );

  return (
    <div className="overview-page">
      <PageHeader
        title="Demandes de conventions"
        description="Valider ou refuser les demandes d'adhésion aux conventions"
        breadcrumb={['Trésorerie', 'Demandes', 'Conventions']}
      />

      <div className="overview-stats">
        <StatCard
          label="Total demandes"
          value={formatNumber(stats.total)}
          icon={<Handshake size={22} />}
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
          label="Validées"
          value={formatNumber(stats.validees)}
          icon={<CheckCircle2 size={22} />}
          tone="success"
          loading={all.isLoading}
        />
        <StatCard
          label="Refusées"
          value={formatNumber(stats.refusees)}
          icon={<Ban size={22} />}
          tone="error"
          loading={all.isLoading}
        />
      </div>

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Adhérent, statut, commentaire…"
          />
          <SelectFilter
            label="Statut"
            value={statut}
            onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'en_attente', label: 'En attente' },
              { value: 'validee', label: 'Validée' },
              { value: 'refusee', label: 'Refusée' },
              { value: 'annulee', label: 'Annulée' },
            ]}
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(d) => d.id}
        emptyTitle="Aucune demande de convention"
        rowActions={(d) => {
          const pending = d.statut === 'en_attente';
          return (
            <span className="row-actions" style={{ display: 'inline-flex', gap: 6 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  toast.push({
                    title: d.commentaire
                      ? `Commentaire : ${d.commentaire}`
                      : `Référence DEM-${d.id.toUpperCase()}`,
                    variant: 'info',
                  })
                }
                title="Détails"
              >
                <Eye size={14} />
              </Button>
              {pending && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => valider.mutate(d.id)}
                    disabled={valider.isPending}
                    title="Valider"
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { setRejecting(d); setMotif(''); }}
                    title="Refuser"
                  >
                    <X size={14} />
                  </Button>
                </>
              )}
            </span>
          );
        }}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <Modal
        open={!!rejecting}
        onClose={() => { setRejecting(null); setMotif(''); }}
        title="Refuser cette demande de convention ?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setRejecting(null); setMotif(''); }}
              disabled={refuser.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                rejecting &&
                refuser.mutate({ id: rejecting.id, motif: motif.trim() || undefined })
              }
              disabled={refuser.isPending}
            >
              Refuser
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            La demande de <strong>{rejecting?.adherentNom ?? ''}</strong> sera marquée
            comme refusée.
          </p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              Motif (optionnel)
            </span>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              placeholder="Ex. Budget insuffisant, convention suspendue…"
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                resize: 'vertical',
              }}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
