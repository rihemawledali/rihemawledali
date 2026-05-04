/* ============================================
   Treasurer - Indemnites
   ============================================ */

import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  HeartHandshake,
  Hash,
  Tag,
  Wallet,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../components/data/FilterBar';
import { Pagination } from '../../../components/data/Pagination';
import { ConfirmDialog } from '../../../components/data/ConfirmDialog';
import { Modal } from '../../../components/data/Modal';
import { useToast } from '../../../components/feedback/useToast';
import { formatCurrency, formatDate, formatNumber } from '../../../lib/formatters';
import { treasurerIndemnitesApi } from '../api/treasurerListApi';
import type { Indemnite, IndemniteType, IndemniteStatus } from '../../../types/domain';
import '../../../components/layout/CrudPage.css';
import './TreasurerIndemnitesPage.css';

const TYPE_LABEL: Record<IndemniteType, string> = {
  maladie: 'Maladie',
  naissance: 'Naissance',
  mariage: 'Mariage',
  deces: 'Décès',
  scolarite: 'Scolarité',
};

const TYPE_TONE: Record<IndemniteType, 'primary' | 'success' | 'info' | 'warning' | 'error'> = {
  maladie: 'error',
  naissance: 'success',
  mariage: 'primary',
  deces: 'warning',
  scolarite: 'info',
};

const STATUT_LABEL: Record<IndemniteStatus, string> = {
  en_attente: 'En attente',
  approuvee: 'Validée',
  validee: 'Validée',
  rejetee: 'Rejetée',
  payee: 'Payée',
  annulee: 'Annulée',
};

const STATUT_TONE: Record<IndemniteStatus, 'success' | 'warning' | 'info' | 'error' | 'neutral'> = {
  en_attente: 'warning',
  approuvee: 'info',
  validee: 'info',
  rejetee: 'error',
  payee: 'success',
  annulee: 'neutral',
};

const STATUT_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'approuvee', label: 'Validée' },
  { value: 'rejetee', label: 'Rejetée' },
  { value: 'payee', label: 'Payée' },
  { value: 'annulee', label: 'Annulée' },
];

function isValidated(s: IndemniteStatus) {
  return s === 'approuvee' || s === 'validee';
}

export function TreasurerIndemnitesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [typeF, setTypeF] = useState('');
  const [selected, setSelected] = useState<Indemnite | null>(null);
  const [rejecting, setRejecting] = useState<Indemnite | null>(null);
  const [cancelling, setCancelling] = useState<Indemnite | null>(null);

  const all = useQuery({
    queryKey: ['treasurer', 'indemnites', 'all'],
    queryFn: () => treasurerIndemnitesApi.list({ page: 1, size: 1000 }),
  });

  const query = useQuery({
    queryKey: ['treasurer', 'indemnites', { page, search, statut, typeF }],
    queryFn: () =>
      treasurerIndemnitesApi.list({
        page, size: 10, search,
        filters: { statut, type: typeF },
      }),
  });

  const valider = useMutation({
    mutationFn: (id: string) => treasurerIndemnitesApi.valider(id),
    onSuccess: (i) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'indemnites'] });
      toast.push({ title: `Indemnité ${i.id.toUpperCase()} validée`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const rejeter = useMutation({
    mutationFn: (id: string) => treasurerIndemnitesApi.rejeter(id),
    onSuccess: (i) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'indemnites'] });
      setRejecting(null);
      toast.push({ title: `Indemnité ${i.id.toUpperCase()} rejetée`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const annuler = useMutation({
    mutationFn: (id: string) => treasurerIndemnitesApi.annuler(id),
    onSuccess: (i) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'indemnites'] });
      setCancelling(null);
      toast.push({ title: `Indemnité ${i.id.toUpperCase()} annulée`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const handlePay = (i: Indemnite) => navigate(`/treasurer/paiements?indemniteId=${i.id}`);

  const stats = useMemo(() => {
    const items = all.data?.items ?? [];
    return {
      total: items.length,
      pending: items.filter((i) => i.statut === 'en_attente').length,
      validated: items.filter((i) => isValidated(i.statut)).length,
      paid: items.filter((i) => i.statut === 'payee').length,
      amountToPay: items.filter((i) => isValidated(i.statut)).reduce((s, i) => s + i.montant, 0),
    };
  }, [all.data]);

  const columns: Column<Indemnite>[] = useMemo(() => [
    {
      key: 'reference',
      header: 'Référence',
      cell: (i) => (
        <div className="indemnity-reference-cell">
          <span className="cell-mono">{i.id.toUpperCase()}</span>
          <span>{formatDate(i.dateDemande)}</span>
        </div>
      ),
      width: '150px',
    },
    {
      key: 'adherent',
      header: 'Adhérent',
      cell: (i) => (
        <div className="indemnity-member-cell">
          <span className="indemnity-avatar" aria-hidden="true">{getInitials(i.adherentNom)}</span>
          <div>
            <strong className="cell-strong">{i.adherentNom}</strong>
            <span>{TYPE_LABEL[i.type]}</span>
          </div>
        </div>
      ),
      width: '260px',
    },
    {
      key: 'type',
      header: 'Type',
      width: '150px',
      cell: (i) => <StatusBadge status={i.type} tone={TYPE_TONE[i.type]} label={TYPE_LABEL[i.type]} />,
    },
    {
      key: 'montant',
      header: 'Montant',
      align: 'right',
      width: '140px',
      cell: (i) => <strong className="amount">{formatCurrency(i.montant)}</strong>,
    },
    {
      key: 'statut',
      header: 'Statut',
      width: '130px',
      cell: (i) => <StatusBadge status={i.statut} tone={STATUT_TONE[i.statut]} label={STATUT_LABEL[i.statut]} />,
    },
  ], []);

  const rows = query.data?.items ?? [];
  const visiblePending = rows.filter((i) => i.statut === 'en_attente').length;

  return (
    <div className="treasurer-indemnities-page">
      <PageHeader
        title="Indemnités"
        description="Valider, rejeter, payer ou annuler les demandes d’indemnités."
        breadcrumb={['Trésorerie', 'Demandes', 'Indemnités']}
      />

      <section className="indemnity-hero-grid">
        <IndemnityPanel stats={stats} loading={all.isLoading} />
      </section>

      <section className="indemnity-metrics-grid">
        <IndemnityMetric icon={<HeartHandshake size={18} />} label="Total demandes" value={formatNumber(stats.total)} loading={all.isLoading} tone="primary" />
        <IndemnityMetric icon={<Clock3 size={18} />} label="En attente" value={formatNumber(stats.pending)} loading={all.isLoading} tone="warning" />
        <IndemnityMetric icon={<CheckCircle2 size={18} />} label="Validées" value={formatNumber(stats.validated)} loading={all.isLoading} tone="info" />
        <IndemnityMetric icon={<CheckCircle2 size={18} />} label="Payées" value={formatNumber(stats.paid)} loading={all.isLoading} tone="success" />
      </section>

      <section className="indemnity-workspace">
        <div className="indemnity-workspace-header">
          <div>
            <h2>Dossiers d’indemnités</h2>
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

        <div className="crud-toolbar indemnity-toolbar">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Rechercher par adhérent, type ou motif..."
            />
            <SelectFilter
              label="Type"
              value={typeF}
              onChange={(v) => { setTypeF(v); setPage(1); }}
              options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))}
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
          rowKey={(i) => i.id}
          emptyTitle="Aucune indemnité"
          emptyDescription="Essayez un autre statut, type ou mot-clé."
          actionsWidth="330px"
          rowActions={(i) => (
            <span className="indemnity-row-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelected(i)}
                aria-label={`Voir l'indemnité de ${i.adherentNom}`}
              >
                <Eye size={14} /> Détails
              </Button>
              {i.statut === 'en_attente' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => valider.mutate(i.id)}
                    disabled={valider.isPending || rejeter.isPending}
                    isLoading={valider.isPending && valider.variables === i.id}
                  >
                    <Check size={14} /> Valider
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setRejecting(i)}
                    disabled={valider.isPending || rejeter.isPending}
                  >
                    <X size={14} /> Rejeter
                  </Button>
                </>
              )}
              {isValidated(i.statut) && (
                <>
                  <Button variant="primary" size="sm" onClick={() => handlePay(i)}>
                    <CreditCard size={14} /> Payer
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCancelling(i)}>
                    <Ban size={14} /> Annuler
                  </Button>
                </>
              )}
            </span>
          )}
        />

        {query.data && query.data.total > 0 && (
          <div className="data-table-card indemnity-pagination">
            <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
          </div>
        )}
      </section>

      <IndemnityDetailModal
        indemnity={selected}
        validating={valider.isPending}
        rejecting={rejeter.isPending}
        onClose={() => setSelected(null)}
        onValidate={() => { if (selected) { valider.mutate(selected.id); setSelected(null); } }}
        onReject={() => { if (selected) { setRejecting(selected); setSelected(null); } }}
      />

      <ConfirmDialog
        open={!!rejecting}
        title="Rejeter cette indemnité ?"
        message={`La demande de ${rejecting?.adherentNom} (${formatCurrency(rejecting?.montant ?? 0)}) sera marquée comme rejetée.`}
        confirmLabel="Rejeter"
        destructive
        loading={rejeter.isPending}
        onCancel={() => setRejecting(null)}
        onConfirm={() => rejecting && rejeter.mutate(rejecting.id)}
      />
      <ConfirmDialog
        open={!!cancelling}
        title="Annuler cette indemnité ?"
        message={`La demande de ${cancelling?.adherentNom} sera marquée comme annulée. Cette action n'a pas d'impact sur la trésorerie.`}
        confirmLabel="Annuler l'indemnité"
        destructive
        loading={annuler.isPending}
        onCancel={() => setCancelling(null)}
        onConfirm={() => cancelling && annuler.mutate(cancelling.id)}
      />
    </div>
  );
}

function IndemnityPanel({
  stats,
  loading,
}: {
  stats: { amountToPay: number };
  loading?: boolean;
}) {
  return (
    <section className="indemnity-panel">
      <div className="indemnity-panel-header">
        <div>
          <span className="indemnity-eyebrow">Paiements à préparer</span>
          <h2>Montant à payer</h2>
        </div>
        <span className="indemnity-panel-icon">
          <Wallet size={22} />
        </span>
      </div>
      <strong className="indemnity-balance-value">
        {loading ? '...' : formatCurrency(stats.amountToPay)}
      </strong>
    </section>
  );
}

function IndemnityMetric({
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
  tone: 'primary' | 'warning' | 'info' | 'success';
}) {
  return (
    <article className={`indemnity-metric indemnity-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </article>
  );
}

function IndemnityDetailModal({
  indemnity,
  validating,
  rejecting,
  onClose,
  onValidate,
  onReject,
}: {
  indemnity: Indemnite | null;
  validating: boolean;
  rejecting: boolean;
  onClose: () => void;
  onValidate: () => void;
  onReject: () => void;
}) {
  const handleDownload = () => {
    if (!indemnity?.documentNom) return;
    const blob = new Blob(
      [`Justificatif indemnité\nRéférence : ${indemnity.id.toUpperCase()}\nAdhérent : ${indemnity.adherentNom}\n`],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = indemnity.documentNom;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={!!indemnity}
      onClose={onClose}
      title={indemnity ? `Dossier indemnité - ${indemnity.adherentNom}` : ''}
      description={indemnity ? `Référence ${indemnity.id.toUpperCase()}` : ''}
      size="lg"
      footer={indemnity?.statut === 'en_attente' ? (
        <div className="indemnity-modal-actions">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          <Button variant="danger" onClick={onReject} disabled={validating || rejecting}>
            <X size={14} /> Rejeter
          </Button>
          <Button
            variant="primary"
            onClick={onValidate}
            disabled={validating || rejecting}
            isLoading={validating}
          >
            <Check size={14} /> Valider
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={onClose}>Fermer</Button>
      )}
    >
      {indemnity && (
        <div className="indemnity-detail">
          <section className="indemnity-detail-header">
            <div className="indemnity-detail-person">
              <span className="indemnity-avatar indemnity-avatar--xl" aria-hidden="true">
                {getInitials(indemnity.adherentNom)}
              </span>
              <div>
                <span className="indemnity-eyebrow">Demande d’indemnité</span>
                <h3>{indemnity.adherentNom}</h3>
                <div className="indemnity-detail-chips">
                  <span><Hash size={13} /> {indemnity.id.toUpperCase()}</span>
                  <span><Tag size={13} /> {TYPE_LABEL[indemnity.type]}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={indemnity.statut} tone={STATUT_TONE[indemnity.statut]} label={STATUT_LABEL[indemnity.statut]} />
          </section>

          <section className="indemnity-detail-metrics">
            <IndemnityDetailMetric icon={<Wallet size={16} />} label="Montant" value={formatCurrency(indemnity.montant)} tone="success" />
            <IndemnityDetailMetric icon={<Tag size={16} />} label="Type" value={TYPE_LABEL[indemnity.type]} tone="primary" />
            <IndemnityDetailMetric icon={<Clock3 size={16} />} label="Date demande" value={formatDate(indemnity.dateDemande)} />
          </section>

          <div className="indemnity-detail-layout">
            <DetailPanel title="Informations du dossier" icon={<FileText size={16} />}>
              <DetailField label="Référence" value={<span className="cell-mono">{indemnity.id.toUpperCase()}</span>} />
              <DetailField label="Adhérent" value={<strong>{indemnity.adherentNom}</strong>} />
              <DetailField label="Type" value={<StatusBadge status={indemnity.type} tone={TYPE_TONE[indemnity.type]} label={TYPE_LABEL[indemnity.type]} />} />
              <DetailField label="Statut" value={<StatusBadge status={indemnity.statut} tone={STATUT_TONE[indemnity.statut]} label={STATUT_LABEL[indemnity.statut]} />} />
            </DetailPanel>

            <DetailPanel title="Traitement financier" icon={<Wallet size={16} />}>
              <DetailField label="Montant demandé" value={<strong>{formatCurrency(indemnity.montant)}</strong>} />
              <DetailField label="Date de demande" value={formatDate(indemnity.dateDemande)} />
              <DetailField label="Décision possible" value={indemnity.statut === 'en_attente' ? 'Oui' : 'Non'} />
            </DetailPanel>
          </div>

          {indemnity.motif && (
            <section className="indemnity-note">
              <h4>Motif / justification</h4>
              <p>{indemnity.motif}</p>
            </section>
          )}

          <section className="indemnity-document-card">
            <h4>Justificatif</h4>
            {indemnity.documentNom ? (
              <div>
                <span className="indemnity-document-icon"><FileText size={20} /></span>
                <div>
                  <strong>{indemnity.documentNom}</strong>
                  {indemnity.documentSize != null && <small>{(indemnity.documentSize / 1024).toFixed(1)} Ko</small>}
                </div>
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                  <Download size={14} /> Télécharger
                </Button>
              </div>
            ) : (
              <p>Aucun justificatif joint à cette demande.</p>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

function IndemnityDetailMetric({
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
    <div className={`indemnity-detail-metric indemnity-detail-metric--${tone}`}>
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
    <section className="indemnity-detail-panel">
      <header>
        <span>{icon}</span>
        <h4>{title}</h4>
      </header>
      <div className="indemnity-detail-list">{children}</div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="indemnity-detail-field">
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
