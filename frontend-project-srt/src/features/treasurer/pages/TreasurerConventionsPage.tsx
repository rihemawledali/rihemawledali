/* ============================================
   Treasurer - Demandes de conventions
   Workflow: en_attente -> validee | refusee
   ============================================ */

import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Handshake,
  Hash,
  Percent,
  Store,
  Tag,
  User,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { DataTable, type Column } from '../../../shared/data/DataTable';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../shared/data/FilterBar';
import { Pagination } from '../../../shared/data/Pagination';
import { Modal } from '../../../shared/data/Modal';
import { useToast } from '../../../shared/feedback/useToast';
import { formatDate, formatNumber } from '../../../shared/lib/formatters';
import {
  treasurerConventionsApi,
  type ConventionDemandeRow,
  type ConventionDemandeStatutBE,
} from '../conventions-demande/api';
import '../../../shared/layout/CrudPage.css';
import './TreasurerConventionsPage.css';

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

const STATUT_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'validee', label: 'Validée' },
  { value: 'refusee', label: 'Refusée' },
  { value: 'annulee', label: 'Annulée' },
];

const CONV_TYPE_LABEL: Record<string, string> = {
  sante: 'Santé',
  restauration: 'Restauration',
  transport: 'Transport',
  loisir: 'Loisir',
  commerce: 'Commerce',
  education: 'Éducation',
};

const CONV_TYPE_TONE: Record<string, 'primary' | 'success' | 'info' | 'warning' | 'error'> = {
  sante: 'error',
  restauration: 'warning',
  transport: 'info',
  loisir: 'primary',
  commerce: 'success',
  education: 'info',
};

export function TreasurerConventionsPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [viewing, setViewing] = useState<ConventionDemandeRow | null>(null);
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
      pending: items.filter((d) => d.statut === 'en_attente').length,
      validated: items.filter((d) => d.statut === 'validee').length,
      refused: items.filter((d) => d.statut === 'refusee').length,
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
        cell: (d) => (
          <div className="convention-reference-cell">
            <span className="cell-mono">DEM-{d.id.toUpperCase()}</span>
            <span>{formatDate(d.dateDemande)}</span>
          </div>
        ),
        width: '165px',
      },
      {
        key: 'adherent',
        header: 'Adhérent',
        cell: (d) => (
          <div className="convention-member-cell">
            <span className="convention-avatar" aria-hidden="true">{getInitials(d.adherentNom)}</span>
            <div>
              <strong className="cell-strong">{d.adherentNom}</strong>
              <span>Demande de convention</span>
            </div>
          </div>
        ),
        width: '260px',
      },
      {
        key: 'convention',
        header: 'Convention',
        cell: (d) => <ConventionCell row={d} />,
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

  const rows = query.data?.items ?? [];
  const visiblePending = rows.filter((d) => d.statut === 'en_attente').length;

  return (
    <div className="treasurer-conventions-page">
      <PageHeader
        title="Demandes de conventions"
        description="Valider ou refuser les demandes d'adhésion aux conventions."
        breadcrumb={['Trésorerie', 'Demandes', 'Conventions']}
      />

      <section className="convention-metrics-grid">
        <ConventionMetric icon={<Handshake size={18} />} label="Total demandes" value={formatNumber(stats.total)} loading={all.isLoading} tone="primary" />
        <ConventionMetric icon={<Clock3 size={18} />} label="En attente" value={formatNumber(stats.pending)} loading={all.isLoading} tone="warning" />
        <ConventionMetric icon={<CheckCircle2 size={18} />} label="Validées" value={formatNumber(stats.validated)} loading={all.isLoading} tone="success" />
        <ConventionMetric icon={<Ban size={18} />} label="Refusées" value={formatNumber(stats.refused)} loading={all.isLoading} tone="error" />
      </section>

      <section className="convention-workspace">
        <div className="convention-workspace-header">
          <div>
            <h2>Dossiers de conventions</h2>
            <p>
              {visiblePending > 0
                ? `${formatNumber(visiblePending)} demande(s) en attente sur cette page.`
                : 'Aucune décision urgente dans la liste affichée.'}
            </p>
          </div>
          <StatusBadge
            status="en_attente"
            tone={visiblePending > 0 ? 'warning' : 'neutral'}
            label={`${formatNumber(visiblePending)} en attente`}
          />
        </div>

        <div className="crud-toolbar convention-toolbar">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Rechercher par adhérent, statut ou commentaire..."
            />
            <SelectFilter
              label="Statut"
              value={statut}
              onChange={(v) => { setStatut(v); setPage(1); }}
              options={STATUT_OPTIONS}
            />
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={query.isLoading}
          rowKey={(d) => d.id}
          emptyTitle="Aucune demande de convention"
          emptyDescription="Essayez un autre statut ou une autre recherche."
          actionsWidth="280px"
          rowActions={(d) => {
            const pending = d.statut === 'en_attente';
            return (
              <span className="convention-row-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewing(d)}
                  aria-label={`Voir la demande de ${d.adherentNom}`}
                >
                  <Eye size={14} /> Détails
                </Button>
                {pending && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => valider.mutate(d.id)}
                      disabled={valider.isPending || refuser.isPending}
                      isLoading={valider.isPending && valider.variables === d.id}
                    >
                      <Check size={14} /> Valider
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { setRejecting(d); setMotif(''); }}
                      disabled={valider.isPending || refuser.isPending}
                    >
                      <X size={14} /> Refuser
                    </Button>
                  </>
                )}
              </span>
            );
          }}
        />

        {query.data && query.data.total > 0 && (
          <div className="data-table-card convention-pagination">
            <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
          </div>
        )}
      </section>

      <ConventionDetailModal
        row={viewing}
        validating={valider.isPending}
        refusing={refuser.isPending}
        onClose={() => setViewing(null)}
        onValidate={() => { if (viewing) { valider.mutate(viewing.id); setViewing(null); } }}
        onRefuse={() => { if (viewing) { setRejecting(viewing); setMotif(''); setViewing(null); } }}
      />

      <RejectConventionModal
        row={rejecting}
        motif={motif}
        loading={refuser.isPending}
        onMotifChange={setMotif}
        onClose={() => { setRejecting(null); setMotif(''); }}
        onConfirm={() =>
          rejecting &&
          refuser.mutate({ id: rejecting.id, motif: motif.trim() || undefined })
        }
      />
    </div>
  );
}

function ConventionCell({ row }: { row: ConventionDemandeRow }) {
  const snap = row.conventionSnapshot;
  if (!snap) return <span className="convention-muted">Convention non renseignée</span>;

  const typeLabel = snap.type ? CONV_TYPE_LABEL[snap.type] ?? snap.type : 'Type non renseigné';
  const tone = snap.type ? CONV_TYPE_TONE[snap.type] ?? 'primary' : 'primary';

  return (
    <div className="convention-cell">
      <strong>{snap.fournisseurNom ?? 'Fournisseur non renseigné'}</strong>
      <span>
        <StatusBadge status={snap.type ?? 'convention'} tone={tone} label={typeLabel} />
        {snap.remise != null && <small>{snap.remise}% de remise</small>}
      </span>
    </div>
  );
}

function ConventionMetric({
  icon,
  label,
  value,
  loading,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  loading?: boolean;
  tone: 'primary' | 'warning' | 'success' | 'error';
}) {
  return (
    <article className={`convention-metric convention-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </article>
  );
}

function ConventionDetailModal({
  row,
  validating,
  refusing,
  onClose,
  onValidate,
  onRefuse,
}: {
  row: ConventionDemandeRow | null;
  validating: boolean;
  refusing: boolean;
  onClose: () => void;
  onValidate: () => void;
  onRefuse: () => void;
}) {
  const snap = row?.conventionSnapshot;
  const typeLabel = snap?.type ? CONV_TYPE_LABEL[snap.type] ?? snap.type : 'Non renseigné';

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={row ? `Dossier convention - ${row.adherentNom}` : ''}
      description={row ? `Référence DEM-${row.id.toUpperCase()}` : ''}
      size="lg"
      footer={row?.statut === 'en_attente' ? (
        <div className="convention-modal-actions">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          <Button variant="danger" onClick={onRefuse} disabled={validating || refusing}>
            <X size={14} /> Refuser
          </Button>
          <Button variant="primary" onClick={onValidate} disabled={validating || refusing} isLoading={validating}>
            <Check size={14} /> Valider
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={onClose}>Fermer</Button>
      )}
    >
      {row && (
        <div className="convention-detail">
          <section className="convention-detail-header">
            <div className="convention-detail-person">
              <span className="convention-avatar convention-avatar--xl" aria-hidden="true">
                {getInitials(row.adherentNom)}
              </span>
              <div>
                <span className="convention-eyebrow">Demande de convention</span>
                <h3>{row.adherentNom}</h3>
                <div className="convention-detail-chips">
                  <span><Hash size={13} /> DEM-{row.id.toUpperCase()}</span>
                  <span><Calendar size={13} /> {formatDate(row.dateDemande)}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={row.statut} tone={STATUT_TONE[row.statut]} label={STATUT_LABEL[row.statut]} />
          </section>

          <section className="convention-detail-metrics">
            <ConventionDetailMetric icon={<Store size={16} />} label="Fournisseur" value={snap?.fournisseurNom ?? 'Non renseigné'} tone="primary" />
            <ConventionDetailMetric icon={<Tag size={16} />} label="Type" value={typeLabel} />
            <ConventionDetailMetric icon={<Percent size={16} />} label="Remise" value={snap?.remise != null ? `${snap.remise}%` : 'Non renseignée'} tone="success" />
          </section>

          <div className="convention-detail-layout">
            <DetailPanel title="Informations demande" icon={<User size={16} />}>
              <DetailField label="Adhérent" value={<strong>{row.adherentNom}</strong>} />
              <DetailField label="Référence" value={<span className="cell-mono">DEM-{row.id.toUpperCase()}</span>} />
              <DetailField label="Date demande" value={formatDate(row.dateDemande)} />
              <DetailField label="Statut" value={<StatusBadge status={row.statut} tone={STATUT_TONE[row.statut]} label={STATUT_LABEL[row.statut]} />} />
              {row.dateDecision && <DetailField label="Date décision" value={formatDate(row.dateDecision)} />}
            </DetailPanel>

            <DetailPanel title="Convention demandée" icon={<Handshake size={16} />}>
              <DetailField label="Fournisseur" value={snap?.fournisseurNom ?? 'Non renseigné'} />
              <DetailField label="Type" value={typeLabel} />
              <DetailField label="Remise" value={snap?.remise != null ? `${snap.remise}%` : 'Non renseignée'} />
              <DetailField label="Avantage" value={snap?.avantage ?? 'Non renseigné'} />
            </DetailPanel>
          </div>

          {(row.commentaire || row.motifRefus) && (
            <section className="convention-note">
              <h4>{row.motifRefus ? 'Motif / commentaire' : 'Commentaire adhérent'}</h4>
              <p>{row.motifRefus ?? row.commentaire}</p>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

function RejectConventionModal({
  row,
  motif,
  loading,
  onMotifChange,
  onClose,
  onConfirm,
}: {
  row: ConventionDemandeRow | null;
  motif: string;
  loading: boolean;
  onMotifChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title="Refuser cette demande de convention ?"
      size="sm"
      footer={(
        <div className="convention-modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            Refuser
          </Button>
        </div>
      )}
    >
      <div className="convention-reject-body">
        <p>
          La demande de <strong>{row?.adherentNom ?? ''}</strong> sera marquée comme refusée.
        </p>
        <label>
          <span>Motif (optionnel)</span>
          <textarea
            value={motif}
            onChange={(e) => onMotifChange(e.target.value)}
            rows={3}
            placeholder="Ex. Budget insuffisant, convention suspendue..."
          />
        </label>
      </div>
    </Modal>
  );
}

function ConventionDetailMetric({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: 'neutral' | 'primary' | 'success';
}) {
  return (
    <div className={`convention-detail-metric convention-detail-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function DetailPanel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="convention-detail-panel">
      <header>
        <span>{icon}</span>
        <h4>{title}</h4>
      </header>
      <div className="convention-detail-list">{children}</div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="convention-detail-field">
      <span>{label}</span>
      <div>{value}</div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
