import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  Ban,
  CalendarX,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

import { PageHeader } from '../../../../shared/layout/PageHeader';
import { Button } from '../../../../shared/ui/Button';
import { Modal } from '../../../../shared/data/Modal';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { useToast } from '../../../../shared/feedback/useToast';
import { formatDate } from '../../../../shared/lib/formatters';

import { conventionsApi } from '../api';
import {
  CONV_TYPE_LABEL,
  DEMANDE_STATUS_LABEL,
  DEMANDE_STATUS_VARIANT,
} from '../components/conventionHelpers';

import './AdherentMesDemandesConvention.css';

const DISPLAY_STATUS_LABEL: any = {
  ...DEMANDE_STATUS_LABEL,
  terminee: 'Terminée',
  expiree: 'Expirée',
};

const DISPLAY_STATUS_VARIANT: any = {
  ...DEMANDE_STATUS_VARIANT,
  terminee: 'success',
  expiree: 'warning',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'validee', label: 'Validées' },
  { value: 'refusee', label: 'Refusées' },
  { value: 'annulee', label: 'Annulées' },
];

function normalizeStatus(status: string) {
  if (status === 'SOUMISE') return 'en_attente';

  if (
    ['APPROUVEE', 'EN_COURS', 'JUSTIFIEE', 'VALIDEE', 'FACTUREE', 'PAYEE'].includes(status)
  ) {
    return 'validee';
  }

  if (status === 'REFUSEE') return 'refusee';
  if (status === 'ANNULEE') return 'annulee';

  return status;
}

function getDisplayStatus(demande: any, convention: any) {
  const status = normalizeStatus(demande.statut);
  const expired = convention?.dateFin && new Date(convention.dateFin) < new Date();

  if (status === 'validee' && expired) return 'terminee';
  if (status === 'en_attente' && expired) return 'expiree';

  return status;
}

function getSupplierName(demande: any, convention: any) {
  return (
    convention?.fournisseurNom ||
    demande.conventionSnapshot?.fournisseurNom ||
    'Fournisseur'
  );
}

export function AdherentMesDemandesConventionsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState('all');
  const [demandeToCancel, setDemandeToCancel] = useState<any>(null);

  const { data: demandes = [], isLoading } = useQuery<any[]>({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: conventionsApi.getMyDemandes,
  });

  const { data: conventions = [] } = useQuery<any[]>({
    queryKey: ['adherent-conventions'],
    queryFn: conventionsApi.getConventions,
  });

  const conventionMap = useMemo(() => {
    const map = new Map();

    conventions.forEach((convention) => {
      map.set(convention.id, convention);
    });

    return map;
  }, [conventions]);

  const demandesList = useMemo(() => {
    return demandes
      .map((demande) => {
        const convention = conventionMap.get(demande.conventionId);

        return {
          demande,
          convention,
          displayStatus: getDisplayStatus(demande, convention),
        };
      })
      .sort((a, b) => {
        return (
          new Date(b.demande.dateDemande).getTime() -
          new Date(a.demande.dateDemande).getTime()
        );
      });
  }, [demandes, conventionMap]);

  const counts = useMemo(() => {
    const result: any = {
      all: demandesList.length,
      en_attente: 0,
      validee: 0,
      refusee: 0,
      annulee: 0,
    };

    demandesList.forEach((item) => {
      if (result[item.displayStatus] !== undefined) {
        result[item.displayStatus]++;
      }
    });

    return result;
  }, [demandesList]);

  const visibleDemandes =
    activeFilter === 'all'
      ? demandesList
      : demandesList.filter((item) => item.displayStatus === activeFilter);

  const cancelMutation = useMutation({
    mutationFn: conventionsApi.cancelDemande,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions-demandes'] });
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions'] });

      toast.push({
        title: 'Demande annulée',
        variant: 'success',
      });

      setDemandeToCancel(null);
    },

    onError: (error) => {
      toast.push({
        title: error instanceof Error ? error.message : "Échec de l'annulation",
        variant: 'error',
      });
    },
  });

  return (
    <div className="adh-follow-page">
      <PageHeader
        title="Mes demandes"
        description="Suivez les demandes envoyées et l'historique de vos conventions."
      />

      {!isLoading && demandesList.length > 0 && (
        <section className="adh-follow-filters">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={activeFilter === filter.value ? 'is-active' : undefined}
              onClick={() => setActiveFilter(filter.value)}
            >
              <span>{filter.label}</span>
              <strong>{counts[filter.value] ?? 0}</strong>
            </button>
          ))}
        </section>
      )}

      {isLoading ? (
        <div className="adh-demandes-list">
          {[1, 2, 3].map((item) => (
            <div key={item} className="adh-demande-skeleton skeleton" />
          ))}
        </div>
      ) : (
        <div className="adh-demandes-list">
          {visibleDemandes.map(({ demande, convention, displayStatus }) => (
            <DemandeCard
              key={demande.id}
              demande={demande}
              convention={convention}
              displayStatus={displayStatus}
              onCancel={() => setDemandeToCancel(demande)}
              onOpenConvention={() =>
                navigate(`/adherent/conventions/${demande.conventionId}`)
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={!!demandeToCancel}
        onClose={() => setDemandeToCancel(null)}
        title="Annuler la demande"
        size="sm"
        footer={
          <div className="adh-modal-actions">
            <Button
              variant="secondary"
              onClick={() => setDemandeToCancel(null)}
              disabled={cancelMutation.isPending}
            >
              Conserver
            </Button>

            <Button
              variant="danger"
              onClick={() => cancelMutation.mutate(demandeToCancel.id)}
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
            Confirmer l'annulation de cette demande
            {demandeToCancel?.conventionSnapshot?.fournisseurNom && (
              <strong> {demandeToCancel.conventionSnapshot.fournisseurNom}</strong>
            )}
          </p>

          <span>
            Vous pourrez refaire une demande plus tard si la convention reste disponible.
          </span>
        </div>
      </Modal>
    </div>
  );
}

function DemandeCard({
  demande,
  convention,
  displayStatus,
  onCancel,
  onOpenConvention,
}: any) {
  const supplier = getSupplierName(demande, convention);

  const type = convention?.type || demande.conventionSnapshot?.type;
  const startDate = convention?.dateDebut || demande.conventionSnapshot?.dateDebut;
  const endDate = convention?.dateFin || demande.conventionSnapshot?.dateFin;

  const canCancel = displayStatus === 'en_attente';

  return (
    <article className={`adh-demande-card status-${displayStatus}`}>
      <header className="adh-demande-card-head">
        <div className="adh-demande-identity">
          <div className="adh-demande-title-group">
            <div className="adh-demande-title-row">
              <h3>{supplier}</h3>
            </div>

            <div className="adh-demande-meta">
              <span>Demande #{demande.id}</span>

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

      <div className="adh-demande-clean-details">
        {startDate && endDate && (
          <div className="clean-detail-row">
            <span className="clean-detail-label">Période :</span>
            <span className="clean-detail-value">
              {formatDate(startDate)} au {formatDate(endDate)}
            </span>
          </div>
        )}

        <div className="clean-detail-row">
          <span className="clean-detail-label">Suivi :</span>
          <span className="clean-detail-value">
            {demande.dateDecision
              ? `Décision le ${formatDate(demande.dateDecision)}`
              : 'En cours de traitement'}
          </span>
        </div>
      </div>

      <StatusMessage
        demande={demande}
        convention={convention}
        displayStatus={displayStatus}
      />

      <footer className="adh-demande-actions">
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenConvention}
          className="adh-btn-elevated"
        >
          Ouvrir la convention
        </Button>

        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            onClick={onCancel}
            className="adh-btn-elevated-danger"
          >
            Annuler la demande
          </Button>
        )}
      </footer>
    </article>
  );
}

function StatusMessage({ demande, convention, displayStatus }: any) {
  if (displayStatus === 'validee') {
    return (
      <div className="adh-demande-message is-success">
        <CheckCircle2 size={16} />
        <div>
          <strong>Demande validée.</strong>
          <span>
            Convention active
            {demande.dateDecision
              ? ` depuis le ${formatDate(demande.dateDecision)}.`
              : '.'}
          </span>
        </div>
      </div>
    );
  }

  const messages: any = {
    en_attente: {
      Icon: Clock3,
      tone: 'info',
      title: 'Demande en cours de traitement.',
    },
    refusee: {
      Icon: AlertCircle,
      tone: 'error',
      title: 'Demande refusée.',
      body: demande.motifRefus
        ? `Motif : ${demande.motifRefus}`
        : 'Aucun motif précisé.',
    },
    annulee: {
      Icon: Ban,
      tone: 'neutral',
      title: 'Demande annulée.',
    },
    terminee: {
      Icon: Archive,
      tone: 'success',
      title: 'Convention terminée.',
      body: convention?.dateFin ? `Fin le ${formatDate(convention.dateFin)}.` : null,
    },
    expiree: {
      Icon: CalendarX,
      tone: 'warning',
      title: 'Convention expirée avant traitement.',
      body: convention?.dateFin
        ? `Échéance : ${formatDate(convention.dateFin)}.`
        : null,
    },
  };

  const message = messages[displayStatus];

  if (!message) return null;

  const { Icon, tone, title, body } = message;

  return (
    <div className={`adh-demande-message is-${tone}`}>
      <Icon size={16} />
      <div>
        <strong>{title}</strong>
        {body && <span>{body}</span>}
      </div>
    </div>
  );
}