import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock3,
  ListChecks,
  Plus,
  WalletCards,
} from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { Button } from '../../../../shared/ui/Button';
import { Modal } from '../../../../shared/data/Modal';
import { DataTable, type Column } from '../../../../shared/data/DataTable';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { useToast } from '../../../../shared/feedback/useToast';
import { uploadFile } from '../../../../shared/api/apiClient';
import { pretsApi } from '../api';
import { PretRequestForm } from '../forms/PretRequestForm';
import type { PretRequestFormValues } from '../../validators';
import type { PretRemboursement, PretSocial } from '../../../../shared/types/domain';
import './AdherentPretsPage.css';

interface ScheduleRow {
  num: number;
  date: string;
  echeance: number;
  capital: number;
  interet: number;
  capitalRestant: number;
  paid: boolean;
  statusClass: 'paid' | 'pending' | 'generated' | 'cancelled';
  statusLabel: string;
}

export function AdherentPretsPage() {
  const [creating, setCreating] = useState(false);
  const [scheduleLoan, setScheduleLoan] = useState<PretSocial | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: prets, isLoading } = useQuery({
    queryKey: ['adherent-prets'],
    queryFn: () => pretsApi.getPrets(),
  });

  const createMutation = useMutation({
    mutationFn: async ({ values, file }: { values: PretRequestFormValues; file?: File }) => {
      const attachmentId = file ? (await uploadFile(file)).id : undefined;

      return pretsApi.createPret({
        montant: values.montant,
        duree: values.duree,
        taux: values.taux,
        motif: values.motif,
        attachmentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adherent-prets'] });
      setCreating(false);
      toast.push({ title: 'Demande de prêt soumise', variant: 'success' });
    },
    onError: (error: unknown) => {
      toast.push({
        title: error instanceof Error ? error.message : 'Échec de la demande',
        variant: 'error',
      });
    },
  });

  const loans = prets ?? [];
  const activeLoan = loans.find((loan) => loan.statut === 'en_cours');
  const pendingCount = loans.filter((loan) => loan.statut === 'en_attente').length;
  const paidTotal = loans
    .filter((loan) => loan.statut === 'rembourse')
    .reduce((sum, loan) => sum + loan.montant, 0);
  const activeMonthly = activeLoan ? getMonthlyPayment(activeLoan) : 0;

  const schedule = useMemo(() => (scheduleLoan ? buildSchedule(scheduleLoan) : []), [scheduleLoan]);
  const paidRows = schedule.filter((row) => row.paid);
  const paidCount = paidRows.length;
  const remainingDue = scheduleLoan
    ? (paidRows.at(-1)?.capitalRestant ?? scheduleLoan.montant)
    : 0;

  const columns: Column<PretSocial>[] = [
    { key: 'id', header: 'Référence', cell: (loan: PretSocial) => loan.id, width: '130px' },
    {
      key: 'dateDemande',
      header: 'Date demande',
      cell: (loan: PretSocial) => formatDate(loan.dateDemande),
      width: '130px',
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (loan: PretSocial) => formatCurrency(loan.montant),
      align: 'right' as const,
      width: '130px',
    },
    {
      key: 'duree',
      header: 'Durée',
      cell: (loan: PretSocial) => `${loan.duree} mois`,
      width: '100px',
    },
    {
      key: 'taux',
      header: 'Taux',
      cell: (loan: PretSocial) => `${loan.taux}%`,
      width: '80px',
    },
    {
      key: 'mensualite',
      header: 'Mensualité',
      cell: (loan: PretSocial) => formatCurrency(getMonthlyPayment(loan)),
      align: 'right' as const,
      width: '130px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (loan: PretSocial) => <StatusBadge status={loan.statut} />,
      width: '130px',
    },
  ];

  const handleCreate = async (values: PretRequestFormValues, file?: File) => {
    await createMutation.mutateAsync({ values, file });
  };

  return (
    <div className="adh-account-page">
      <PageHeader
        title="Mes prêts"
        description="Suivez vos demandes de prêts sociaux et les échéances en cours."
        actions={(
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} className="adh-account-btn-icon" />
            Nouvelle demande
          </Button>
        )}
      />

      {isLoading ? (
        <LoansLoading />
      ) : (
        <>
          <LoanSummary
            activeLoan={activeLoan}
            paidTotal={paidTotal}
            pendingCount={pendingCount}
          />

          {activeLoan && (
            <ActiveLoanCard
              loan={activeLoan}
              monthlyPayment={activeMonthly}
              onOpenSchedule={() => setScheduleLoan(activeLoan)}
            />
          )}

          <LoanHistory
            loans={loans}
            columns={columns}
            onOpenSchedule={setScheduleLoan}
          />
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Demander un prêt">
        <PretRequestForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitting={createMutation.isPending}
        />
      </Modal>

      <ScheduleModal
        loan={scheduleLoan}
        schedule={schedule}
        paidCount={paidCount}
        remainingDue={remainingDue}
        onClose={() => setScheduleLoan(null)}
      />
    </div>
  );
}

function LoansLoading() {
  return (
    <>
      <div className="adh-loan-metrics">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="adh-account-metric-skeleton skeleton" />
        ))}
      </div>
      <div className="adh-account-table-skeleton skeleton" />
    </>
  );
}

function LoanSummary({ activeLoan, paidTotal, pendingCount }: {
  activeLoan?: PretSocial;
  paidTotal: number;
  pendingCount: number;
}) {
  return (
    <section className="adh-loan-metrics" aria-label="Synthèse prêts">
      <LoanMetric
        icon={Banknote}
        label="Prêt actif"
        value={activeLoan ? formatCurrency(activeLoan.montant) : 'Aucun'}
        tone="info"
      />
      <LoanMetric
        icon={Calculator}
        label="Total remboursé"
        value={formatCurrency(paidTotal)}
        tone="success"
      />
      <LoanMetric
        icon={Clock3}
        label="Demandes en attente"
        value={pendingCount}
        tone="warning"
      />
    </section>
  );
}

function ActiveLoanCard({ loan, monthlyPayment, onOpenSchedule }: {
  loan: PretSocial;
  monthlyPayment: number;
  onOpenSchedule: () => void;
}) {
  return (
    <section className="adh-loan-active-card">
      <header className="adh-loan-active-head">
        <div>
          <span className="adh-account-kicker">Prêt en cours</span>
          <h2>{formatCurrency(loan.montant)}</h2>
          <p>Référence {loan.id}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onOpenSchedule}>
          <ListChecks size={15} className="adh-account-btn-icon" />
          Échéancier
        </Button>
      </header>

      <div className="adh-loan-detail-grid">
        <LoanDetail icon={Calendar} label="Date d'accord" value={loan.dateAccord ? formatDate(loan.dateAccord) : 'En attente'} />
        <LoanDetail icon={WalletCards} label="Montant" value={formatCurrency(loan.montant)} />
        <LoanDetail icon={Clock3} label="Durée / taux" value={`${loan.duree} mois à ${loan.taux}%`} />
        <LoanDetail icon={Calculator} label="Mensualité" value={formatCurrency(monthlyPayment)} />
      </div>
    </section>
  );
}

function LoanHistory({ loans, columns, onOpenSchedule }: {
  loans: PretSocial[];
  columns: Column<PretSocial>[];
  onOpenSchedule: (loan: PretSocial) => void;
}) {
  return (
    <section className="adh-account-section-card">
      <header className="adh-account-section-head">
        <div>
          <h3>
            <Banknote size={17} />
            Historique des prêts
          </h3>
          <p>{loans.length} demande{loans.length > 1 ? 's' : ''} enregistrée{loans.length > 1 ? 's' : ''}</p>
        </div>
      </header>

      <DataTable
        columns={columns}
        rows={loans}
        rowKey={(loan) => loan.id}
        emptyTitle="Aucun prêt"
        emptyDescription="Vous n'avez pas encore de demande de prêt."
        rowActions={(loan) => (
          <Button variant="secondary" size="sm" onClick={() => onOpenSchedule(loan)}>
            <ListChecks size={14} className="adh-account-btn-icon" />
            Voir
          </Button>
        )}
        actionsWidth="110px"
      />
    </section>
  );
}

function ScheduleModal({ loan, schedule, paidCount, remainingDue, onClose }: {
  loan: PretSocial | null;
  schedule: ScheduleRow[];
  paidCount: number;
  remainingDue: number;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!loan}
      onClose={onClose}
      title="Échéancier de remboursement"
      description={loan ? `${loan.id} - ${formatCurrency(loan.montant)} sur ${loan.duree} mois (${loan.taux}%)` : undefined}
      size="lg"
    >
      {loan && (
        <div className="adh-loan-schedule-modal">
          <section className="adh-loan-schedule-metrics">
            <LoanMetric
              icon={CheckCircle2}
              label="Mensualités payées"
              value={`${paidCount} / ${schedule.length}`}
              tone="success"
            />
            <LoanMetric
              icon={Calculator}
              label="Mensualité"
              value={formatCurrency(getMonthlyPayment(loan))}
              tone="info"
            />
            <LoanMetric
              icon={Clock3}
              label="Restant dû"
              value={formatCurrency(remainingDue)}
              tone="warning"
            />
          </section>

          <ScheduleTable rows={schedule} />
        </div>
      )}
    </Modal>
  );
}

function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  return (
    <div className="adh-loan-schedule-table">
      <table className="adh-schedule">
        <thead>
          <tr>
            <th>#</th>
            <th>Échéance</th>
            <th>Capital</th>
            <th>Intérêt</th>
            <th>Total</th>
            <th>Restant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.num} className={row.paid ? 'is-paid' : ''}>
              <td>{row.num}</td>
              <td>{formatDate(row.date)}</td>
              <td className="num">{formatCurrency(row.capital)}</td>
              <td className="num">{formatCurrency(row.interet)}</td>
              <td className="num">{formatCurrency(row.echeance)}</td>
              <td className="num">{formatCurrency(row.capitalRestant)}</td>
              <td>
                <span className={`adh-schedule-status ${row.statusClass}`}>
                  {row.statusLabel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoanMetric({ icon: Icon, label, value, tone }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: 'success' | 'warning' | 'info';
}) {
  return (
    <article className={`adh-loan-metric is-${tone}`}>
      <span className="adh-loan-metric-icon">
        <Icon size={18} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function LoanDetail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="adh-loan-detail">
      <span>
        <Icon size={16} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function buildSchedule(loan: PretSocial): ScheduleRow[] {
  const monthly = getMonthlyPayment(loan);
  const monthlyRate = (loan.taux / 100) / 12;
  const start = loan.dateAccord ? new Date(loan.dateAccord) : new Date(loan.dateDemande);
  const today = new Date();
  const reimbursements = [...(loan.remboursements ?? [])].sort(compareRemboursements);
  const hasRetenueHistory = reimbursements.length > 0;
  const rowCount = Math.max(loan.duree, reimbursements.length);
  let remaining = loan.montant;

  return Array.from({ length: rowCount }, (_, index) => {
    const num = index + 1;
    const reimbursement = reimbursements[index];
    const plannedRow = index < loan.duree;
    const interet = plannedRow ? roundCurrency(remaining * monthlyRate) : 0;
    const capital = plannedRow ? roundCurrency(monthly - interet) : 0;

    if (plannedRow) {
      remaining = roundCurrency(remaining - capital);
    }

    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + num);
    const fallbackPaid = !hasRetenueHistory && (loan.statut === 'rembourse' || dueDate <= today);
    const paid = reimbursement?.statut === 'PRELEVEE' || fallbackPaid;

    return {
      num,
      date: reimbursement?.dateRetenue ?? dueDate.toISOString().slice(0, 10),
      echeance: reimbursement?.montant ?? roundCurrency(monthly),
      capital,
      interet,
      capitalRestant: Math.max(0, remaining),
      paid,
      statusClass: scheduleStatusClass(reimbursement, paid),
      statusLabel: scheduleStatusLabel(reimbursement, paid),
    };
  });
}

function compareRemboursements(a: PretRemboursement, b: PretRemboursement) {
  const aPeriod = `${a.annee ?? 0}-${String(a.mois ?? 0).padStart(2, '0')}`;
  const bPeriod = `${b.annee ?? 0}-${String(b.mois ?? 0).padStart(2, '0')}`;
  if (aPeriod !== bPeriod) return aPeriod.localeCompare(bPeriod);
  return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
}

function scheduleStatusClass(reimbursement: PretRemboursement | undefined, paid: boolean): ScheduleRow['statusClass'] {
  if (reimbursement?.statut === 'PRELEVEE') return 'paid';
  if (reimbursement?.statut === 'ANNULEE') return 'cancelled';
  if (reimbursement?.statut === 'GENEREE') return 'generated';
  return paid ? 'paid' : 'pending';
}

function scheduleStatusLabel(reimbursement: PretRemboursement | undefined, paid: boolean) {
  if (reimbursement?.statut === 'PRELEVEE') return 'Prélevée';
  if (reimbursement?.statut === 'GENEREE') return 'Générée';
  if (reimbursement?.statut === 'EN_ATTENTE') return 'En attente';
  if (reimbursement?.statut === 'ANNULEE') return 'Annulée';
  return paid ? 'Payée' : 'À venir';
}

function getMonthlyPayment(loan: PretSocial) {
  return pretsApi.calculateMonthlyPayment(loan.montant, loan.duree, loan.taux);
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(value);
}
