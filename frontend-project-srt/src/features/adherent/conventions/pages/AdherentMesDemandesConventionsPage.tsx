import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Ban,
  CalendarX,
  CheckCircle2,
  Clock3,
  Eye,
  FileClock,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { Button } from '../../../../shared/ui/Button';
import { Modal } from '../../../../shared/data/Modal';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { useToast } from '../../../../shared/feedback/useToast';
import { conventionsApi } from '../api';
import {
  CONV_TYPE_LABEL,
  DEMANDE_STATUS_LABEL,
  DEMANDE_STATUS_VARIANT,
} from '../components/conventionHelpers';
import type {
  Convention,
  ConventionDemande,
  ConventionDemandeStatut,
} from '../../../../shared/types/domain';
import './AdherentConventionFollowupPages.css';

type DisplayStatus = ConventionDemandeStatut | 'terminee' | 'expiree';

const DISPLAY_STATUS_LABEL: Record<DisplayStatus, string> = {
  ...DEMANDE_STATUS_LABEL,
  terminee: 'Terminée',
  expiree: 'Expirée',
};

const DISPLAY_STATUS_VARIANT: Record<
  DisplayStatus,
  'success' | 'warning' | 'info' | 'neutral' | 'error'
> = {
  ...DEMANDE_STATUS_VARIANT,
  terminee: 'success',
  expiree: 'warning',
};


function computeDisplayStatus(demande: ConventionDemande, convention?: Convention): DisplayStatus {
  const isConventionExpired = convention ? new Date(convention.dateFin) < new Date() : false;
  if (demande.statut === 'validee' && isConventionExpired) return 'terminee';
  if (demande.statut === 'en_attente' && isConventionExpired) return 'expiree';
  return demande.statut;
}

export function AdherentMesDemandesConventionsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<ConventionDemande | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<ConventionDemande | null>(null);

  const { data: demandes, isLoading } = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });

  const { data: conventions } = useQuery({
    queryKey: ['adherent-conventions'],
    queryFn: () => conventionsApi.getConventions(),
  });

  const cancelMutation = useMutation({
    mutationFn: (demandeId: string) => conventionsApi.cancelDemande(demandeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions-demandes'] });
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions'] });
      toast.push({ title: 'Demande annulée', variant: 'success' });
      setConfirmCancel(null);
    },
    onError: (error) => {
      toast.push({
        title: error instanceof Error ? error.message : 'Échec de l’annulation',
        variant: 'error',
      });
    },
  });

  const conventionMap = useMemo(() => {
    const map = new Map<string, Convention>();
    (conventions ?? []).forEach((convention) => map.set(convention.id, convention));
    return map;
  }, [conventions]);

  const annotatedDemandes = useMemo(() => {
    return (demandes ?? [])
      .map((demande) => ({
        demande,
        displayStatus: computeDisplayStatus(demande, conventionMap.get(demande.conventionId)),
      }))
      .sort((a, b) => new Date(b.demande.dateDemande).getTime() - new Date(a.demande.dateDemande).getTime());
  }, [conventionMap, demandes]);

  const counts = useMemo(() => {
    const next: Record<'all' | DisplayStatus, number> = {
      all: 0,
      en_attente: 0,
      validee: 0,
      refusee: 0,
      annulee: 0,
      terminee: 0,
      expiree: 0,
    };

    annotatedDemandes.forEach(({ displayStatus }) => {
      next.all += 1;
      next[displayStatus] += 1;
    });

    return next;
  }, [annotatedDemandes]);

  const pendingCount = counts.en_attente + counts.expiree;
  const activeCount = counts.validee;
  const historyCount = counts.terminee + counts.expiree + counts.annulee + counts.refusee;

  return (
    <div className="adh-follow-page">
      <PageHeader
        title="Mes demandes"
        description="Suivez les demandes envoyées et l’historique de vos conventions."
      />

      <section className="adh-follow-toolbar">
        <div className="adh-follow-toolbar-main">
          <span className="adh-follow-kicker">Suivi conventions</span>
          <h2>{counts.all} demande{counts.all > 1 ? 's' : ''} de convention</h2>
          <p>
            {pendingCount > 0
              ? `${pendingCount} demande${pendingCount > 1 ? 's' : ''} à surveiller, ${activeCount} convention${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''}.`
              : activeCount > 0
              ? `${activeCount} convention${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''}, aucun dossier en attente.`
              : 'Aucune demande en attente pour le moment.'}
          </p>
        </div>
        <div className="adh-follow-toolbar-actions">
          <div className="adh-follow-toolbar-stat" aria-label="Demandes archivées">
            <Archive size={16} />
            <span>{historyCount}</span>
            <small>archivées</small>
          </div>
          <button
            type="button"
            className="adh-follow-nav"
            onClick={() => navigate('/adherent/conventions')}
          >
            <FileText size={16} />
            Catalogue
          </button>
        </div>
      </section>

      {!isLoading && (
        <section className="adh-follow-metrics" aria-label="Synthèse demandes conventions">
          <MetricCard icon={FileText} label="Total" value={counts.all} tone="info" />
          <MetricCard icon={Clock3} label="En attente" value={counts.en_attente} tone="warning" />
          <MetricCard icon={CheckCircle2} label="Validées" value={counts.validee} tone="success" />
          <MetricCard icon={Archive} label="Historique" value={counts.terminee + counts.expiree + counts.annulee} tone="neutral" />
        </section>
      )}

      {isLoading ? (
        <div className="adh-demandes-list">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="adh-demande-skeleton skeleton" />
          ))}
        </div>
      ) : annotatedDemandes.length === 0 ? (
        <section className="adh-empty-card adh-follow-empty">
          <div className="adh-empty-icon">
            <FileClock size={28} />
          </div>
          <h3>Aucune demande</h3>
          <p>Vos prochaines demandes de conventions apparaîtront ici.</p>
          <Button onClick={() => navigate('/adherent/conventions')}>
            Voir les conventions disponibles
            <ArrowRight size={14} className="adh-follow-btn-icon is-after" />
          </Button>
        </section>
      ) : (
        <div className="adh-demandes-list">
          {annotatedDemandes.map(({ demande, displayStatus }) => (
            <DemandeCard
              key={demande.id}
              demande={demande}
              displayStatus={displayStatus}
              convention={conventionMap.get(demande.conventionId)}
              onView={() => setSelected(demande)}
              onCancel={() => setConfirmCancel(demande)}
              onOpenConvention={() => navigate(`/adherent/conventions/${demande.conventionId}`)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détails de la demande"
        description={selected ? `Demande #${selected.id}` : undefined}
        size="md"
      >
        {selected && (
          <DemandeDetails
            demande={selected}
            displayStatus={computeDisplayStatus(selected, conventionMap.get(selected.conventionId))}
            convention={conventionMap.get(selected.conventionId)}
            onClose={() => setSelected(null)}
            onOpenConvention={() => {
              setSelected(null);
              navigate(`/adherent/conventions/${selected.conventionId}`);
            }}
            onCancel={() => {
              setSelected(null);
              setConfirmCancel(selected);
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        title="Annuler la demande"
        size="sm"
        footer={
          <div className="adh-modal-actions">
            <Button variant="secondary" onClick={() => setConfirmCancel(null)} disabled={cancelMutation.isPending}>
              Conserver
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmCancel && cancelMutation.mutate(confirmCancel.id)}
              isLoading={cancelMutation.isPending}
            >
              <Ban size={16} className="adh-follow-btn-icon" />
              Annuler
            </Button>
          </div>
        }
      >
        <div className="adh-confirm-copy">
          <p>
            Confirmer l’annulation de cette demande
            {confirmCancel?.conventionSnapshot?.fournisseurNom && (
              <strong>{confirmCancel.conventionSnapshot.fournisseurNom}</strong>
            )}
          </p>
          <span>Vous pourrez refaire une demande plus tard si la convention reste disponible.</span>
        </div>
      </Modal>
    </div>
  );
}

interface MetricCardProps {
  icon: typeof FileText;
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'info' | 'neutral';
}

function MetricCard({ icon: Icon, label, value, tone }: MetricCardProps) {
  return (
    <article className={`adh-follow-metric is-${tone}`}>
      <span className="adh-follow-metric-icon">
        <Icon size={18} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

interface DemandeCardProps {
  demande: ConventionDemande;
  displayStatus: DisplayStatus;
  convention?: Convention;
  onView: () => void;
  onCancel: () => void;
  onOpenConvention: () => void;
}

function DemandeCard({
  demande,
  displayStatus,
  convention,
  onView,
  onCancel,
  onOpenConvention,
}: DemandeCardProps) {
  const supplier = getSupplierName(demande, convention);
  const type = convention?.type || demande.conventionSnapshot?.type;
  const canCancel = displayStatus === 'en_attente';

  return (
    <article className={`adh-demande-card status-${displayStatus}`}>
      <header className="adh-demande-card-head">
        <div className="adh-demande-identity">
          <span className="adh-demande-avatar">{getInitials(supplier)}</span>
          <div>
            <span className="adh-demande-reference">Demande #{demande.id}</span>
            <h3>{supplier}</h3>
            <div className="adh-demande-meta">
              {type && <span>{CONV_TYPE_LABEL[type]}</span>}
              <span>Envoyée le {formatDate(demande.dateDemande)}</span>
            </div>
          </div>
        </div>
        <StatusBadge
          status={displayStatus}
          tone={DISPLAY_STATUS_VARIANT[displayStatus]}
          label={DISPLAY_STATUS_LABEL[displayStatus]}
        />
      </header>

      <DemandeStatusMessage demande={demande} displayStatus={displayStatus} convention={convention} />

      <footer className="adh-demande-actions">
        <Button variant="secondary" size="sm" onClick={onView}>
          <Eye size={14} className="adh-follow-btn-icon" />
          Détails
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenConvention}>
          <FileText size={14} className="adh-follow-btn-icon" />
          Convention
        </Button>
        {canCancel && (
          <Button variant="danger" size="sm" onClick={onCancel}>
            <Ban size={14} className="adh-follow-btn-icon" />
            Annuler
          </Button>
        )}
      </footer>
    </article>
  );
}

function DemandeStatusMessage({
  demande,
  displayStatus,
  convention,
}: {
  demande: ConventionDemande;
  displayStatus: DisplayStatus;
  convention?: Convention;
}) {
  if (displayStatus === 'validee') {
    return <ValidatedMessage demande={demande} convention={convention} />;
  }

  const config: Record<Exclude<DisplayStatus, 'validee'>, {
    icon: typeof Clock3;
    tone: 'info' | 'success' | 'warning' | 'error' | 'neutral';
    title: string;
    body?: ReactNode;
  }> = {
    en_attente: {
      icon: Clock3,
      tone: 'info',
      title: 'Demande en cours de traitement.',
    },
    refusee: {
      icon: AlertCircle,
      tone: 'error',
      title: 'Demande refusée.',
      body: demande.motifRefus ? `Motif : ${demande.motifRefus}` : 'Aucun motif précisé.',
    },
    annulee: {
      icon: Ban,
      tone: 'neutral',
      title: 'Demande annulée.',
    },
    terminee: {
      icon: Archive,
      tone: 'success',
      title: 'Convention terminée.',
      body: convention?.dateFin ? `Fin le ${formatDate(convention.dateFin)}.` : undefined,
    },
    expiree: {
      icon: CalendarX,
      tone: 'warning',
      title: 'Convention expirée avant traitement.',
      body: convention?.dateFin ? `Échéance : ${formatDate(convention.dateFin)}.` : undefined,
    },
  };

  const item = config[displayStatus];
  const Icon = item.icon;

  return (
    <div className={`adh-demande-message is-${item.tone}`}>
      <Icon size={16} />
      <div>
        <strong>{item.title}</strong>
        {item.body && <span>{item.body}</span>}
      </div>
    </div>
  );
}

function ValidatedMessage({ demande, convention }: { demande: ConventionDemande; convention?: Convention }) {
  const total = demande.nbTranchesSnapshot ?? convention?.nbTranches;
  const offerAmount = demande.montantOffreSnapshot ?? convention?.montantOffre;
  const paid = demande.tranchesPayees ?? 0;
  const hasSchedule = !!total && !!offerAmount && total > 0;
  const monthly = hasSchedule ? offerAmount / total : 0;
  const remainingCount = hasSchedule ? Math.max(0, total - paid) : 0;
  const remainingAmount = remainingCount * monthly;
  const progress = hasSchedule ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <div className="adh-demande-message is-success">
      <CheckCircle2 size={16} />
      <div>
        <strong>Demande validée.</strong>
        <span>
          Convention active
          {demande.dateDecision ? ` depuis le ${formatDate(demande.dateDecision)}.` : '.'}
        </span>

        {hasSchedule && (
          <div className="adh-demande-schedule">
            <div className="adh-demande-schedule-head">
              <strong>{paid} / {total} tranches payées</strong>
              <span>{remainingCount > 0 ? `Reste ${formatCurrency(remainingAmount)}` : 'Soldée'}</span>
            </div>
            <progress
              className="adh-demande-progress"
              value={progress}
              max={100}
              aria-label="Progression des tranches"
            />
            <small>Mensualité : {formatCurrency(monthly)} prélevée sur la paie</small>
          </div>
        )}
      </div>
    </div>
  );
}

interface DemandeDetailsProps {
  demande: ConventionDemande;
  displayStatus: DisplayStatus;
  convention?: Convention;
  onClose: () => void;
  onOpenConvention: () => void;
  onCancel: () => void;
}

function DemandeDetails({
  demande,
  displayStatus,
  convention,
  onClose,
  onOpenConvention,
  onCancel,
}: DemandeDetailsProps) {
  const type = convention?.type || demande.conventionSnapshot?.type;
  const discount = convention?.remise ?? demande.conventionSnapshot?.remise;
  const startDate = convention?.dateDebut || demande.conventionSnapshot?.dateDebut;
  const endDate = convention?.dateFin || demande.conventionSnapshot?.dateFin;
  const advantage = convention?.avantage || demande.conventionSnapshot?.avantage;

  return (
    <div className="adh-demande-detail">
      <div className="adh-demande-detail-grid">
        <DetailItem label="Fournisseur" value={getSupplierName(demande, convention)} />
        {type && <DetailItem label="Type" value={CONV_TYPE_LABEL[type]} />}
        <DetailItem label="Date de demande" value={formatDate(demande.dateDemande)} />
        {demande.dateDecision && <DetailItem label="Date de décision" value={formatDate(demande.dateDecision)} />}
        {discount != null && <DetailItem label="Avantage" value={advantage || `${discount}% de remise`} highlight />}
        {startDate && endDate && <DetailItem label="Validité" value={`${formatDate(startDate)} - ${formatDate(endDate)}`} />}
        <div className="adh-demande-detail-item">
          <span>Statut</span>
          <strong>
            <StatusBadge
              status={displayStatus}
              tone={DISPLAY_STATUS_VARIANT[displayStatus]}
              label={DISPLAY_STATUS_LABEL[displayStatus]}
            />
          </strong>
        </div>
      </div>

      <DemandeStatusMessage demande={demande} displayStatus={displayStatus} convention={convention} />

      {demande.commentaire && (
        <section className="adh-demande-section">
          <h4>Votre commentaire</h4>
          <p>{demande.commentaire}</p>
        </section>
      )}

      {demande.documentNom && (
        <section className="adh-demande-section">
          <h4>Document fourni</h4>
          <p>
            <FileText size={14} />
            {demande.documentNom}
          </p>
        </section>
      )}

      <div className="adh-modal-actions">
        {displayStatus === 'en_attente' && (
          <Button variant="danger" size="sm" onClick={onCancel}>
            <Ban size={14} className="adh-follow-btn-icon" />
            Annuler
          </Button>
        )}
        {displayStatus === 'refusee' && convention && (
          <Button variant="secondary" size="sm" onClick={onOpenConvention}>
            <RotateCcw size={14} className="adh-follow-btn-icon" />
            Refaire une demande
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onOpenConvention}>
          Voir la convention
        </Button>
        <Button size="sm" onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
}

function DetailItem({ label, value, highlight = false }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div className={`adh-demande-detail-item ${highlight ? 'is-highlight' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getSupplierName(demande: ConventionDemande, convention?: Convention) {
  return convention?.fournisseurNom || demande.conventionSnapshot?.fournisseurNom || 'Fournisseur';
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(value);
}
