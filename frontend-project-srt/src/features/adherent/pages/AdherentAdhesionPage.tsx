/* ============================================
   Adherent Adhesion Page
   - Adhesion is automatic (no renewal action).
   - Page shows current adhesion + history only.
   ============================================ */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, Calendar, DollarSign, AlertTriangle, RefreshCw, History, Hash, Ban,
  Clock,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { Modal } from '../../../components/data/Modal';
import { Button } from '../../../components/ui/Button';
import { adhesionApi } from '../api/adhesionApi';
import type { Adhesion } from '../../../types/domain';

export function AdherentAdhesionPage() {
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: adhesion, isLoading: adhesionLoading } = useQuery({
    queryKey: ['adherent-adhesion'],
    queryFn: () => adhesionApi.getCurrentAdhesion(),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['adherent-adhesion-history'],
    queryFn: () => adhesionApi.getAdhesionHistory(),
  });

  const cancelMutation = useMutation({
    mutationFn: () => adhesionApi.cancelAdhesion(),
    onSuccess: () => {
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['adherent-adhesion'] });
      queryClient.invalidateQueries({ queryKey: ['adherent-adhesion-history'] });
    },
  });

  const activeHistory = (history || []).filter((a) => a.statut === 'active');
  const pendingDemande = (history || []).find((a) => a.statut === 'en_attente');

  const daysUntilExpiry = adhesion?.dateFin
    ? Math.ceil((new Date(adhesion.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 5 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const historyColumns = [
    {
      key: 'dateDebut',
      header: 'Début',
      cell: (a: Adhesion) => new Date(a.dateDebut).toLocaleDateString('fr-FR'),
    },
    {
      key: 'dateFin',
      header: 'Fin',
      cell: (a: Adhesion) => new Date(a.dateFin).toLocaleDateString('fr-FR'),
    },
    {
      key: 'montantCotisation',
      header: 'Cotisation',
      cell: (a: Adhesion) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {a.montantCotisation} TND/mois
        </span>
      ),
      align: 'right' as const,
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (a: Adhesion) => <StatusBadge status={a.statut} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Mon adhésion"
        description="Votre adhésion à l'Amicale SRT et son historique."
      />

      {adhesionLoading ? (
        <div className="skeleton" style={{ height: 220, borderRadius: 12, marginBottom: 16 }} />
      ) : adhesion ? (
        <section className="adherent-adhesion-card">
          <div className="adherent-adhesion-header">
            <div className="adherent-adhesion-icon">
              <BadgeCheck size={26} />
            </div>
            <div className="adherent-adhesion-info">
              <h2>Adhésion active</h2>
              <p>Renouvellement automatique chaque mois.</p>
            </div>
            {(isExpiringSoon || isExpired) && (
              <div className={`adherent-adhesion-alert ${isExpired ? 'expired' : 'warning'}`}>
                <AlertTriangle size={16} />
                <span>
                  {isExpired
                    ? 'Adhésion expirée — renouvellement en cours'
                    : `Renouvellement dans ${daysUntilExpiry} j`}
                </span>
              </div>
            )}
          </div>

          <div className="adherent-adhesion-details">
            <div className="adherent-adhesion-detail">
              <Hash size={16} />
              <div>
                <span className="label">Référence</span>
                <span className="value">{adhesion.id}</span>
              </div>
            </div>
            <div className="adherent-adhesion-detail">
              <Calendar size={16} />
              <div>
                <span className="label">Date de début</span>
                <span className="value">
                  {new Date(adhesion.dateDebut).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            <div className="adherent-adhesion-detail">
              <Calendar size={16} />
              <div>
                <span className="label">Date de fin</span>
                <span className="value">
                  {new Date(adhesion.dateFin).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            <div className="adherent-adhesion-detail">
              <DollarSign size={16} />
              <div>
                <span className="label">Cotisation mensuelle</span>
                <span className="value">{adhesion.montantCotisation} TND</span>
              </div>
            </div>
          </div>

          <div className="adh-alert info" style={{ marginTop: 16, marginBottom: 0 }}>
            <RefreshCw size={16} className="adh-alert-icon" />
            <div>
              <strong>Renouvellement automatique chaque mois.</strong> Votre adhésion est
              reconduite chaque mois sans intervention de votre part. La cotisation de{' '}
              <strong>{adhesion.montantCotisation} TND</strong> est prélevée automatiquement sur
              votre salaire en début de mois.
            </div>
          </div>

          {adhesion.statut === 'active' && (
            <div className="adherent-adhesion-actions" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="danger"
                onClick={() => setCancelOpen(true)}
              >
                <Ban size={16} style={{ marginRight: 6 }} /> Annuler mon adhésion
              </Button>
            </div>
          )}
        </section>
      ) : pendingDemande ? (
        <section className="adh-empty-card">
          <div className="adh-empty-icon">
            <Clock size={22} />
          </div>
          <h3>Demande en cours de validation</h3>
          <p>
            Votre demande d'adhésion a bien été soumise le{' '}
            <strong>{new Date(pendingDemande.dateDebut).toLocaleDateString('fr-FR')}</strong>.
            Elle est actuellement <strong>en attente de validation</strong> par le trésorier.
            Dès qu'elle sera acceptée, la cotisation mensuelle de{' '}
            <strong>{pendingDemande.montantCotisation} TND</strong> sera automatiquement
            prélevée sur votre salaire.
          </p>
        </section>
      ) : (
        <section className="adh-empty-card">
          <div className="adh-empty-icon">
            <AlertTriangle size={22} />
          </div>
          <h3>Aucune adhésion enregistrée</h3>
          <p>
            Aucune adhésion n'est associée à votre compte. Pour toute question,
            contactez le trésorier de l'Amicale SRT.
          </p>
        </section>
      )}

      <section className="adh-card" style={{ marginTop: 16 }}>
        <div className="adh-card-header">
          <h3 className="adh-card-title">
            <History size={16} /> Historique des adhésions
          </h3>
          <span className="adh-card-subtitle">
            {activeHistory.length} période{activeHistory.length > 1 ? 's' : ''} active{activeHistory.length > 1 ? 's' : ''}
          </span>
        </div>
        <DataTable
          columns={historyColumns}
          rows={activeHistory}
          loading={historyLoading}
          rowKey={(a) => a.id}
          emptyTitle="Aucune adhésion active"
          emptyDescription="Aucune période active à afficher pour le moment."
        />
      </section>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Annuler mon adhésion"
        description="Cette action met fin à votre adhésion mensuelle. Vous perdrez l'accès aux avantages de l'Amicale."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={cancelMutation.isPending}>
              Garder mon adhésion
            </Button>
            <Button
              variant="danger"
              onClick={() => cancelMutation.mutate()}
              isLoading={cancelMutation.isPending}
            >
              Confirmer l’annulation
            </Button>
          </>
        )}
      >
        <p style={{ margin: 0, color: 'var(--adh-text-2)' }}>
          Êtes-vous sûr de vouloir annuler votre adhésion à l'Amicale SRT&nbsp;? Le prélèvement
          mensuel de <strong>{adhesion?.montantCotisation} TND</strong> sera arrêté au prochain
          cycle.
        </p>
        {cancelMutation.isError && (
          <p style={{ marginTop: 12, color: 'var(--color-error-600, #dc2626)' }}>
            Une erreur est survenue. Veuillez réessayer.
          </p>
        )}
      </Modal>
    </div>
  );
}
