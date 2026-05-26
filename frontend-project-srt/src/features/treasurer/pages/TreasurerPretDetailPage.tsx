import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Hash,
  Percent,
  Send,
  User,
  WalletCards,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { Button } from '../../../shared/ui/Button';
import { FormTextarea } from '../../../shared/ui/FormTextarea';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { formatCurrency, formatDate } from '../../../shared/lib/formatters';
import { useToast } from '../../../shared/feedback/useToast';
import { treasurerPretsApi } from '../prets/api';
import { pretsApi } from '../../adherent/prets/api';
import type { PretSocial } from '../../../shared/types/domain';
import './TreasurerPretDetailPage.css';

const DEFAULT_AI_QUESTION =
  'Explique clairement la situation de ce pret: statut, montant rembourse, montant restant, mois payes, mois manquants et incoherences eventuelles.';

const PAID_STATUS = 'PRELEVEE';

const AI_PROMPTS = [
  {
    label: 'Situation claire',
    question: DEFAULT_AI_QUESTION,
  },
  {
    label: 'Cohérence',
    question: 'Verifie la coherence des donnees de ce pret et signale uniquement les donnees manquantes ou incoherentes.',
  },
  {
    label: 'Synthese courte',
    question: 'Donne une synthese courte en 3 points maximum pour aider le tresorier a comprendre ce dossier.',
  },
];

export function TreasurerPretDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [aiQuestion, setAiQuestion] = useState(DEFAULT_AI_QUESTION);

  const detail = useQuery({
    queryKey: ['treasurer', 'prets', 'detail', id],
    queryFn: () => treasurerPretsApi.getById(id),
    enabled: !!id,
  });

  const loan = detail.data;
  const repayment = useMemo(() => createRepaymentSummary(loan), [loan]);

  const askAi = useMutation({
    mutationFn: ({ loanId, question }: { loanId: string; question: string }) =>
      treasurerPretsApi.askAi(loanId, question),
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur AI', variant: 'error' }),
  });

  const valider = useMutation({
    mutationFn: (loanId: string) => treasurerPretsApi.valider(loanId),
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'prets'] });
      qc.setQueryData(['treasurer', 'prets', 'detail', id], next);
      toast.push({ title: `Pret ${next.id.toUpperCase()} valide`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const rejeter = useMutation({
    mutationFn: (loanId: string) => treasurerPretsApi.rejeter(loanId),
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'prets'] });
      qc.setQueryData(['treasurer', 'prets', 'detail', id], next);
      toast.push({ title: `Pret ${next.id.toUpperCase()} rejete`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const handleAskAi = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loan) return;
    askAi.mutate({ loanId: loan.id, question: aiQuestion });
  };

  if (detail.isLoading) {
    return (
      <div className="treasurer-loan-detail-page">
        <BackButton onBack={() => navigate('/treasurer/prets')} />
        <div className="pret-detail-skeleton" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="treasurer-loan-detail-page">
        <BackButton onBack={() => navigate('/treasurer/prets')} />
        <section className="pret-detail-empty">
          <AlertTriangle size={28} />
          <strong>Pret introuvable</strong>
          <span>Le dossier demande n'est plus disponible.</span>
        </section>
      </div>
    );
  }

  const monthlyPayment = pretsApi.calculateMonthlyPayment(loan.montant, loan.duree, loan.taux);
  const isPending = loan.statut === 'en_attente';
  const actionBusy = valider.isPending || rejeter.isPending;

  return (
    <div className="treasurer-loan-detail-page">
      <BackButton onBack={() => navigate('/treasurer/prets')} />

      <PageHeader
        title={`Pret social - ${loan.adherentNom}`}
        description={`Reference ${loan.id.toUpperCase()}`}
        breadcrumb={['Tresorerie', 'Demandes', 'Prets sociaux', loan.id.toUpperCase()]}
        actions={isPending ? (
          <div className="pret-detail-actions">
            <Button
              variant="danger"
              onClick={() => rejeter.mutate(loan.id)}
              disabled={actionBusy}
              isLoading={rejeter.isPending}
            >
              <X size={14} /> Rejeter
            </Button>
            <Button
              variant="primary"
              onClick={() => valider.mutate(loan.id)}
              disabled={actionBusy}
              isLoading={valider.isPending}
            >
              <Check size={14} /> Valider
            </Button>
          </div>
        ) : undefined}
      />

      <section className="pret-detail-hero">
        <div className="pret-detail-person">
          <span className="pret-detail-avatar" aria-hidden="true">{getInitials(loan.adherentNom)}</span>
          <div>
            <span className="pret-detail-eyebrow">Dossier pret social</span>
            <h2>{loan.adherentNom}</h2>
            <div className="pret-detail-chips">
              <span><Hash size={13} /> {loan.id.toUpperCase()}</span>
              <span><Calendar size={13} /> {formatDate(loan.dateDemande)}</span>
              {loan.dateAccord && <span><CheckCircle2 size={13} /> Accord {formatDate(loan.dateAccord)}</span>}
            </div>
          </div>
        </div>
        <div className="pret-detail-status-card">
          <StatusBadge status={loan.statut} />
          <strong>{formatCurrency(repayment.remainingAmount)}</strong>
          <span>Restant estime</span>
        </div>
      </section>

      <section className="pret-detail-kpis" aria-label="Synthese du pret">
        <KpiCard icon={<Banknote size={17} />} label="Montant" value={formatCurrency(loan.montant)} tone="primary" />
        <KpiCard icon={<Clock3 size={17} />} label="Duree" value={`${loan.duree} mois`} />
        <KpiCard icon={<Percent size={17} />} label="Taux" value={`${loan.taux.toFixed(1)} %`} />
        <KpiCard icon={<WalletCards size={17} />} label="Retenue mensuelle" value={formatCurrency(monthlyPayment)} tone="success" />
        <KpiCard icon={<CheckCircle2 size={17} />} label="Rembourse" value={formatCurrency(repayment.totalPaid)} tone="success" />
      </section>

      <div className="pret-detail-grid">
        <main className="pret-detail-main">
          <section className="pret-detail-card">
            <SectionHeader title="Informations du dossier" />
            <div className="pret-detail-fields">
              <DetailField icon={<Hash size={15} />} label="Reference" value={loan.id.toUpperCase()} mono />
              <DetailField icon={<User size={15} />} label="Adherent" value={loan.adherentNom} />
              <DetailField icon={<Calendar size={15} />} label="Date demande" value={formatDate(loan.dateDemande)} />
              <DetailField icon={<Calendar size={15} />} label="Date accord" value={loan.dateAccord ? formatDate(loan.dateAccord) : 'Manquante'} />
              <DetailField icon={<FileText size={15} />} label="Justificatif" value={loan.documentNom ?? 'Non fourni'} />
            </div>
          </section>

          {loan.motif && (
            <section className="pret-detail-card">
              <SectionHeader title="Motif / justification" />
              <p className="pret-detail-note">{loan.motif}</p>
            </section>
          )}

        </main>

        <aside className="pret-detail-side">
          <section className="pret-ai-card">
            <header>
              <span><Bot size={18} /></span>
              <div>
                <h3>Ask AI</h3>
                <p>Assistant read-only pour clarifier ce dossier.</p>
              </div>
            </header>
            <div className="pret-ai-status">
              <span className="pret-ai-status-dot" aria-hidden="true" />
              <span>Contexte charge par le backend</span>
            </div>
            <div className="pret-ai-prompts" aria-label="Questions rapides">
              {AI_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => setAiQuestion(prompt.question)}
                  className={aiQuestion === prompt.question ? 'is-active' : undefined}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleAskAi} className="pret-ai-form">
              <FormTextarea
                label="Question"
                value={aiQuestion}
                onChange={(event) => setAiQuestion(event.target.value)}
                rows={5}
                maxLength={1000}
              />
              <Button
                type="submit"
                fullWidth
                disabled={askAi.isPending || !aiQuestion.trim()}
                isLoading={askAi.isPending}
              >
                <Send size={14} /> Analyser ce pret
              </Button>
            </form>
            <div className={`pret-ai-answer ${askAi.isPending ? 'is-loading' : ''}`} aria-live="polite">
              <div className="pret-ai-answer-header">
                <strong>Resultat</strong>
                <span>{askAi.isPending ? 'Analyse en cours' : askAi.data?.answer ? 'Disponible' : 'En attente'}</span>
              </div>
              <div className="pret-ai-answer-body">
                {askAi.isPending ? (
                  <span>Analyse du dossier en cours...</span>
                ) : askAi.data?.answer ? (
                  askAi.data.answer
                ) : (
                  <span>Choisissez une question rapide ou saisissez votre propre question.</span>
                )}
              </div>
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <div className="pret-detail-back">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} /> Retour aux prets
      </Button>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="pret-section-header">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

function KpiCard({ icon, label, value, tone = 'neutral' }: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: 'neutral' | 'primary' | 'success';
}) {
  return (
    <article className={`pret-kpi pret-kpi--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function DetailField({ icon, label, value, mono }: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="pret-detail-field">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong className={mono ? 'is-mono' : undefined}>{value}</strong>
      </div>
    </div>
  );
}

function createRepaymentSummary(loan?: PretSocial) {
  const monthly = loan ? pretsApi.calculateMonthlyPayment(loan.montant, loan.duree, loan.taux) : 0;
  const expectedTotal = loan ? monthly * loan.duree : 0;
  const paid = (loan?.remboursements ?? []).filter((line) => line.statut === PAID_STATUS);
  const totalPaid = paid.reduce((sum, line) => sum + line.montant, 0);
  const remainingAmount = Math.max(0, expectedTotal - totalPaid);

  return {
    totalPaid,
    expectedTotal,
    remainingAmount,
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
