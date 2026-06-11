import { useState, type FormEvent } from 'react';
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
import { SectionTitle } from '../../../shared/ui/SectionTitle';
import { FormTextarea } from '../../../shared/ui/FormTextarea';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { formatCurrency, formatDate } from '../../../shared/lib/formatters';
import { useToast } from '../../../shared/feedback/useToast';
import { treasurerPretsApi } from '../prets/api';
import { pretsApi } from '../../adherent/prets/api';
import type { PretSocial } from '../../../shared/types/domain';
import './TreasurerPretDetailPage.css';

const DEFAULT_AI_QUESTION =
  'Prepare une note professionnelle pour le tresorier: resume le dossier, indique la situation de remboursement, les points de vigilance et les elements utiles avant decision.';

const PAID_STATUS = 'PRELEVEE';

const AI_PROMPTS = [
  {
    label: 'Note executive',
    question: DEFAULT_AI_QUESTION,
  },
  {
    label: 'Points de vigilance',
    question: 'Identifie les risques, donnees manquantes ou incoherences a surveiller dans ce dossier de pret.',
  },
  {
    label: 'Avis tresorerie',
    question: 'Redige un avis concis pour le tresorier avec les informations financieres importantes et les controles a faire avant traitement.',
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
  const repayment = createRepaymentSummary(loan);

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
                <h3>Assistant financier</h3>
                <p>Analyse professionnelle du dossier de pret, basee sur les donnees disponibles.</p>
              </div>
            </header>
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
                label="Votre demande"
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
                <strong>Reponse de l'assistant</strong>
                <span>{askAi.isPending ? 'Preparation' : askAi.data?.answer ? 'Pret' : 'Disponible sur demande'}</span>
              </div>
              <div className="pret-ai-answer-body">
                {askAi.isPending ? (
                  <span>Preparation d'une analyse claire et structuree du dossier...</span>
                ) : askAi.data?.answer ? (
                  <AiAnswer text={askAi.data.answer} />
                ) : (
                  <span>Choisissez une suggestion ou formulez une demande precise pour obtenir une note d'analyse exploitable.</span>
                )}
              </div>
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}

function BackButton({ onBack }: any) {
  return (
    <div className="pret-detail-back">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} /> Retour aux prets
      </Button>
    </div>
  );
}

function SectionHeader(props: any) {
  return <SectionTitle {...props} className="pret-section-header" />;
}

function KpiCard({ icon, label, value, tone = 'neutral' }: any) {
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

function DetailField({ icon, label, value, mono }: any) {
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

function AiAnswer({ text }: any) {
  const blocks = createAiAnswerBlocks(text);

  return (
    <div className="pret-ai-response">
      {blocks.map((block: any, index: number) => {
        if (block.type === 'title') {
          return <h4 key={index}>{renderAiText(block.text)}</h4>;
        }
        if (block.type === 'field') {
          return (
            <div key={index} className="pret-ai-field">
              <span>{block.label}</span>
              <strong>{renderAiText(block.value)}</strong>
            </div>
          );
        }
        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={index} className="pret-ai-list">
              {block.items.map((item: string, itemIndex: number) => (
                <li key={itemIndex}>{renderAiText(item)}</li>
              ))}
            </ListTag>
          );
        }
        return <p key={index}>{renderAiText(block.text)}</p>;
      })}
    </div>
  );
}

function createAiAnswerBlocks(text: string) {
  const blocks: any[] = [];
  const paragraph: string[] = [];
  let list: any = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph.length = 0;
  };

  const flushList = () => {
    if (!list) return;
    blocks.push(list);
    list = null;
  };

  for (const rawLine of text.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const title = getAiTitle(line);
    if (title) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'title', text: title });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { type: 'list', ordered, items: [] };
      }
      list.items.push(cleanAiText((bullet?.[1] ?? numbered?.[1] ?? '').trim()));
      continue;
    }

    const field = line.match(/^([^:]{3,42}):\s*(.+)$/);
    if (field) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'field',
        label: cleanAiText(field[1]),
        value: cleanAiText(field[2]),
      });
      continue;
    }

    paragraph.push(cleanAiText(line));
  }

  flushParagraph();
  flushList();

  return blocks.length ? blocks : [{ type: 'paragraph', text }];
}

function getAiTitle(line: string) {
  const markdownTitle = line.match(/^#{1,4}\s+(.+)$/);
  if (markdownTitle) return cleanAiText(markdownTitle[1]);

  const simpleTitle = line.match(/^(.{3,48}):$/);
  if (simpleTitle) return cleanAiText(simpleTitle[1]);

  return '';
}

function cleanAiText(text: string) {
  return text
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

function renderAiText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
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
