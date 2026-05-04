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
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/data/Modal';
import { DataTable } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { useToast } from '../../../components/feedback/useToast';
import { uploadFile } from '../../../lib/apiClient';
import { pretsApi } from '../api/pretsApi';
import { PretRequestForm } from '../forms/PretRequestForm';
import type { PretRequestFormValues } from '../validators';
import type { PretSocial } from '../../../types/domain';
import './AdherentAccountPages.css';

interface ScheduleRow {
  num: number;
  date: string;
  echeance: number;
  capital: number;
  interet: number;
  capitalRestant: number;
  paid: boolean;
}

function buildSchedule(loan: PretSocial): ScheduleRow[] {
  const monthly = pretsApi.calculateMonthlyPayment(loan.montant, loan.duree, loan.taux);
  const monthlyRate = (loan.taux / 100) / 12;
  const start = loan.dateAccord ? new Date(loan.dateAccord) : new Date(loan.dateDemande);
  const today = new Date();
  let remaining = loan.montant;

  return Array.from({ length: loan.duree }, (_, index) => {
    const num = index + 1;
    const interet = roundCurrency(remaining * monthlyRate);
    const capital = roundCurrency(monthly - interet);
    remaining = roundCurrency(remaining - capital);

    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + num);

    return {
      num,
      date: dueDate.toISOString().slice(0, 10),
      echeance: roundCurrency(monthly),
      capital,
      interet,
      capitalRestant: Math.max(0, remaining),
      paid: dueDate <= today,
    };
  });
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
      let attachmentId: string | undefined;
      if (file) {
        const attachment = await uploadFile(file);
        attachmentId = attachment.id;
      }

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
  const activeMonthly = activeLoan
    ? pretsApi.calculateMonthlyPayment(activeLoan.montant, activeLoan.duree, activeLoan.taux)
    : 0;

  const schedule = useMemo(() => (scheduleLoan ? buildSchedule(scheduleLoan) : []), [scheduleLoan]);
  const paidCount = schedule.filter((row) => row.paid).length;
  const remainingDue = scheduleLoan
    ? (schedule.find((row) => !row.paid)?.capitalRestant ?? 0)
    : 0;

  const columns = [
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
      cell: (loan: PretSocial) => formatCurrency(pretsApi.calculateMonthlyPayment(loan.montant, loan.duree, loan.taux)),
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
        <>
          <div className="adh-loan-metrics">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="adh-account-metric-skeleton skeleton" />
            ))}
          </div>
          <div className="adh-account-table-skeleton skeleton" />
        </>
      ) : (
        <>
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

          {activeLoan && (
            <section className="adh-loan-active-card">
              <header className="adh-loan-active-head">
                <div>
                  <span className="adh-account-kicker">Prêt en cours</span>
                  <h2>{formatCurrency(activeLoan.montant)}</h2>
                  <p>Référence {activeLoan.id}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setScheduleLoan(activeLoan)}>
                  <ListChecks size={15} className="adh-account-btn-icon" />
                  Échéancier
                </Button>
              </header>

              <div className="adh-loan-detail-grid">
                <LoanDetail icon={Calendar} label="Date d’accord" value={activeLoan.dateAccord ? formatDate(activeLoan.dateAccord) : 'En attente'} />
                <LoanDetail icon={WalletCards} label="Montant" value={formatCurrency(activeLoan.montant)} />
                <LoanDetail icon={Clock3} label="Durée / taux" value={`${activeLoan.duree} mois à ${activeLoan.taux}%`} />
                <LoanDetail icon={Calculator} label="Mensualité" value={formatCurrency(activeMonthly)} />
              </div>
            </section>
          )}

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
                <Button variant="secondary" size="sm" onClick={() => setScheduleLoan(loan)}>
                  <ListChecks size={14} className="adh-account-btn-icon" />
                  Voir
                </Button>
              )}
              actionsWidth="110px"
            />
          </section>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Demander un prêt">
        <PretRequestForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitting={createMutation.isPending}
        />
      </Modal>

      <Modal
        open={!!scheduleLoan}
        onClose={() => setScheduleLoan(null)}
        title="Échéancier de remboursement"
        description={
          scheduleLoan
            ? `${scheduleLoan.id} - ${formatCurrency(scheduleLoan.montant)} sur ${scheduleLoan.duree} mois (${scheduleLoan.taux}%)`
            : undefined
        }
        size="lg"
      >
        {scheduleLoan && (
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
                value={formatCurrency(pretsApi.calculateMonthlyPayment(scheduleLoan.montant, scheduleLoan.duree, scheduleLoan.taux))}
                tone="info"
              />
              <LoanMetric
                icon={Clock3}
                label="Restant dû"
                value={formatCurrency(remainingDue)}
                tone="warning"
              />
            </section>

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
                  {schedule.map((row) => (
                    <tr key={row.num} className={row.paid ? 'is-paid' : ''}>
                      <td>{row.num}</td>
                      <td>{formatDate(row.date)}</td>
                      <td className="num">{formatCurrency(row.capital)}</td>
                      <td className="num">{formatCurrency(row.interet)}</td>
                      <td className="num">{formatCurrency(row.echeance)}</td>
                      <td className="num">{formatCurrency(row.capitalRestant)}</td>
                      <td>
                        <span className={`adh-schedule-status ${row.paid ? 'paid' : 'pending'}`}>
                          {row.paid ? 'Payée' : 'À venir'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function LoanMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
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
