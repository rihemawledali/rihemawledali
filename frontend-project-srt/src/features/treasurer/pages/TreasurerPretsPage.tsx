/* ============================================
   Treasurer - Prêts sociaux
   ============================================ */

import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Hash,
  Percent,
  WalletCards,
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
import { treasurerPretsApi } from '../api/treasurerListApi';
import { pretsApi } from '../../adherent/api/pretsApi';
import type { PretSocial } from '../../../types/domain';
import '../../../components/layout/CrudPage.css';
import './TreasurerPretsPage.css';

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'rembourse', label: 'Remboursé' },
  { value: 'en_retard', label: 'En retard' },
  { value: 'rejete', label: 'Rejeté' },
];

export function TreasurerPretsPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [selected, setSelected] = useState<PretSocial | null>(null);
  const [rejecting, setRejecting] = useState<PretSocial | null>(null);

  const all = useQuery({
    queryKey: ['treasurer', 'prets', 'all'],
    queryFn: () => treasurerPretsApi.list({ page: 1, size: 1000 }),
  });

  const query = useQuery({
    queryKey: ['treasurer', 'prets', { page, search, statut }],
    queryFn: () =>
      treasurerPretsApi.list({ page, size: 10, search, filters: { statut } }),
  });

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

  const stats = useMemo(() => {
    const items = all.data?.items ?? [];
    const active = items.filter((p) => p.statut === 'en_cours' || p.statut === 'en_retard');

    return {
      total: items.length,
      active: items.filter((p) => p.statut === 'en_cours').length,
      reimbursed: items.filter((p) => p.statut === 'rembourse').length,
      outstanding: active.reduce((sum, p) => sum + p.montant, 0),
    };
  }, [all.data]);

  const columns: Column<PretSocial>[] = useMemo(() => [
    {
      key: 'reference',
      header: 'Référence',
      cell: (p) => (
        <div className="loan-reference-cell">
          <span className="cell-mono">{p.id.toUpperCase()}</span>
          <span>{formatDate(p.dateDemande)}</span>
        </div>
      ),
      width: '145px',
    },
    {
      key: 'adherent',
      header: 'Adhérent',
      cell: (p) => (
        <div className="loan-member-cell">
          <span className="loan-avatar" aria-hidden="true">{getInitials(p.adherentNom)}</span>
          <div>
            <strong className="cell-strong">{p.adherentNom}</strong>
            <span>Demande de prêt social</span>
          </div>
        </div>
      ),
      width: '260px',
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (p) => <strong className="amount">{formatCurrency(p.montant)}</strong>,
      align: 'right',
      width: '140px',
    },
    {
      key: 'conditions',
      header: 'Conditions',
      cell: (p) => (
        <div className="loan-terms-cell">
          <span>{p.duree} mois</span>
          <span>{p.taux.toFixed(1)} %</span>
        </div>
      ),
      width: '135px',
    },
    {
      key: 'mensualite',
      header: 'Mensualité',
      cell: (p) => (
        <strong className="amount">
          {formatCurrency(pretsApi.calculateMonthlyPayment(p.montant, p.duree, p.taux))}
        </strong>
      ),
      align: 'right',
      width: '140px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (p) => <StatusBadge status={p.statut} />,
      width: '125px',
    },
  ], []);

  const rows = query.data?.items ?? [];
  const visiblePending = rows.filter((p) => p.statut === 'en_attente').length;

  return (
    <div className="treasurer-loans-page">
      <PageHeader
        title="Prêts sociaux"
        description="Analyser, valider et suivre les demandes de prêts sociaux."
        breadcrumb={['Trésorerie', 'Demandes', 'Prêts sociaux']}
      />

      <section className="loan-hero-grid">
        <PortfolioPanel stats={stats} loading={all.isLoading} />
      </section>

      <section className="loan-metrics-grid">
        <LoanMetric icon={<Banknote size={18} />} label="Total prêts" value={formatNumber(stats.total)} loading={all.isLoading} tone="primary" />
        <LoanMetric icon={<CheckCircle2 size={18} />} label="En cours" value={formatNumber(stats.active)} loading={all.isLoading} tone="info" />
        <LoanMetric icon={<WalletCards size={18} />} label="Remboursés" value={formatNumber(stats.reimbursed)} loading={all.isLoading} tone="success" />
      </section>

      <section className="loan-workspace">
        <div className="loan-workspace-header">
          <div>
            <h2>Dossiers de prêts</h2>
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

        <div className="crud-toolbar loan-toolbar">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Rechercher par adhérent ou statut..."
            />
            <SelectFilter
              label="Statut"
              value={statut}
              onChange={(v) => { setStatut(v); setPage(1); }}
              options={STATUS_OPTIONS}
            />
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={query.isLoading}
          rowKey={(p) => p.id}
          emptyTitle="Aucun prêt social"
          emptyDescription="Essayez un autre statut ou une autre recherche."
          actionsWidth="295px"
          rowActions={(p) => (
            <span className="loan-row-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelected(p)}
                aria-label={`Voir le prêt de ${p.adherentNom}`}
              >
                <Eye size={14} /> Détails
              </Button>
              {p.statut === 'en_attente' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => valider.mutate(p.id)}
                    disabled={valider.isPending || rejeter.isPending}
                    isLoading={valider.isPending && valider.variables === p.id}
                    aria-label={`Valider le prêt de ${p.adherentNom}`}
                  >
                    <Check size={14} /> Valider
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setRejecting(p)}
                    disabled={valider.isPending || rejeter.isPending}
                    aria-label={`Rejeter le prêt de ${p.adherentNom}`}
                  >
                    <X size={14} /> Rejeter
                  </Button>
                </>
              )}
            </span>
          )}
        />

        {query.data && query.data.total > 0 && (
          <div className="data-table-card loan-pagination">
            <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
          </div>
        )}
      </section>

      <LoanDetailModal
        loan={selected}
        validating={valider.isPending}
        rejecting={rejeter.isPending}
        onClose={() => setSelected(null)}
        onValidate={() => { if (selected) { valider.mutate(selected.id); setSelected(null); } }}
        onReject={() => { if (selected) { setRejecting(selected); setSelected(null); } }}
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

function PortfolioPanel({
  stats,
  loading,
}: {
  stats: {
    outstanding: number;
  };
  loading?: boolean;
}) {
  return (
    <section className="loan-panel loan-panel--portfolio">
      <div className="loan-panel-header">
        <div>
          <span className="loan-eyebrow">Portefeuille prêts</span>
          <h2>Encours social</h2>
        </div>
        <span className="loan-panel-icon loan-panel-icon--success">
          <Banknote size={22} />
        </span>
      </div>
      <strong className="loan-balance-value">
        {loading ? '...' : formatCurrency(stats.outstanding)}
      </strong>
    </section>
  );
}

function LoanMetric({
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
  tone: 'primary' | 'success' | 'info' | 'error';
}) {
  return (
    <article className={`loan-metric loan-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </article>
  );
}

function LoanDetailModal({
  loan,
  validating,
  rejecting,
  onClose,
  onValidate,
  onReject,
}: {
  loan: PretSocial | null;
  validating: boolean;
  rejecting: boolean;
  onClose: () => void;
  onValidate: () => void;
  onReject: () => void;
}) {
  const monthlyPayment = loan
    ? pretsApi.calculateMonthlyPayment(loan.montant, loan.duree, loan.taux)
    : 0;

  const handleDownload = () => {
    if (!loan?.documentNom) return;
    const blob = new Blob(
      [`Justificatif prêt social\nRéférence : ${loan.id.toUpperCase()}\nAdhérent : ${loan.adherentNom}\n`],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = loan.documentNom;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={!!loan}
      onClose={onClose}
      title={loan ? `Dossier prêt - ${loan.adherentNom}` : ''}
      description={loan ? `Référence ${loan.id.toUpperCase()}` : ''}
      size="lg"
      footer={loan?.statut === 'en_attente' ? (
        <div className="loan-modal-actions">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          <Button variant="danger" onClick={onReject} disabled={validating || rejecting}>
            <X size={14} /> Rejeter
          </Button>
          <Button
            variant="primary"
            onClick={onValidate}
            disabled={validating || rejecting}
            isLoading={validating && loan ? true : false}
          >
            <Check size={14} /> Valider le prêt
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={onClose}>Fermer</Button>
      )}
    >
      {loan && (
        <div className="loan-detail">
          <section className="loan-detail-header">
            <div className="loan-detail-person">
              <span className="loan-avatar loan-avatar--xl" aria-hidden="true">{getInitials(loan.adherentNom)}</span>
              <div>
                <span className="loan-eyebrow">Demande de prêt social</span>
                <h3>{loan.adherentNom}</h3>
                <div className="loan-detail-chips">
                  <span><Hash size={13} /> {loan.id.toUpperCase()}</span>
                  <span><Calendar size={13} /> {formatDate(loan.dateDemande)}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={loan.statut} />
          </section>

          <section className="loan-detail-metrics">
            <LoanDetailMetric icon={<Banknote size={16} />} label="Montant demandé" value={formatCurrency(loan.montant)} tone="primary" />
            <LoanDetailMetric icon={<Clock3 size={16} />} label="Durée" value={`${loan.duree} mois`} />
            <LoanDetailMetric icon={<Percent size={16} />} label="Taux" value={`${loan.taux.toFixed(1)} %`} />
            <LoanDetailMetric icon={<Calculator size={16} />} label="Mensualité estimée" value={formatCurrency(monthlyPayment)} tone="success" />
          </section>

          <div className="loan-detail-layout">
            <DetailPanel title="Informations du dossier" icon={<FileText size={16} />}>
              <DetailField label="Référence" value={<span className="cell-mono">{loan.id.toUpperCase()}</span>} />
              <DetailField label="Adhérent" value={<strong>{loan.adherentNom}</strong>} />
              <DetailField label="Date de demande" value={formatDate(loan.dateDemande)} />
              {loan.dateAccord && <DetailField label="Date d'accord" value={formatDate(loan.dateAccord)} />}
              <DetailField label="Statut" value={<StatusBadge status={loan.statut} />} />
            </DetailPanel>

            <DetailPanel title="Simulation de remboursement" icon={<Calculator size={16} />}>
              <DetailField label="Capital" value={<strong>{formatCurrency(loan.montant)}</strong>} />
              <DetailField label="Durée" value={`${loan.duree} mois`} />
              <DetailField label="Taux appliqué" value={`${loan.taux.toFixed(1)} %`} />
              <DetailField label="Mensualité" value={<strong>{formatCurrency(monthlyPayment)}</strong>} />
            </DetailPanel>
          </div>

          {loan.motif && (
            <section className="loan-note">
              <h4>Motif / justification</h4>
              <p>{loan.motif}</p>
            </section>
          )}

          <section className="loan-document-card">
            <h4>Justificatif</h4>
            {loan.documentNom ? (
              <div>
                <span className="loan-document-icon"><FileText size={20} /></span>
                <div>
                  <strong>{loan.documentNom}</strong>
                  {loan.documentSize != null && <small>{(loan.documentSize / 1024).toFixed(1)} Ko</small>}
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

function LoanDetailMetric({
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
    <div className={`loan-detail-metric loan-detail-metric--${tone}`}>
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
    <section className="loan-detail-panel">
      <header>
        <span>{icon}</span>
        <h4>{title}</h4>
      </header>
      <div className="loan-detail-list">{children}</div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="loan-detail-field">
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
