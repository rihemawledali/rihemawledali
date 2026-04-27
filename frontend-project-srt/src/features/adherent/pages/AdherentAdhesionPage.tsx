/* ============================================
   Adherent Adhesion Page
   ============================================ */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Calendar, DollarSign, AlertTriangle, Plus, RefreshCw, History } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/data/Modal';
import { DataTable } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { useToast } from '../../../components/feedback/useToast';
import { adhesionApi } from '../api/adhesionApi';
import { AdhesionRequestForm } from '../forms/AdhesionRequestForm';
import type { AdhesionRequestFormValues } from '../validators';
import type { Adhesion } from '../../../types/domain';

export function AdherentAdhesionPage() {
  const [creating, setCreating] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  const { data: adhesion, isLoading: adhesionLoading } = useQuery({
    queryKey: ['adherent-adhesion'],
    queryFn: () => adhesionApi.getCurrentAdhesion(),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['adherent-adhesion-history'],
    queryFn: () => adhesionApi.getAdhesionHistory(),
  });

  const createMutation = useMutation({
    mutationFn: (values: AdhesionRequestFormValues) => adhesionApi.createAdhesion({
      montantCotisation: values.montantCotisation,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-adhesion'] });
      qc.invalidateQueries({ queryKey: ['adherent-adhesion-history'] });
      setCreating(false);
      toast.push({ title: 'Adhésion créée avec succès', variant: 'success' });
    },
    onError: () => {
      toast.push({ title: 'Échec de la création', variant: 'error' });
    },
  });

  const renewMutation = useMutation({
    mutationFn: () => adhesionApi.renewAdhesion(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-adhesion'] });
      qc.invalidateQueries({ queryKey: ['adherent-adhesion-history'] });
      setRenewing(false);
      toast.push({ title: 'Adhésion renouvelée avec succès', variant: 'success' });
    },
    onError: () => {
      toast.push({ title: 'Échec du renouvellement', variant: 'error' });
    },
  });

  const handleCreate = async (values: AdhesionRequestFormValues) => {
    await createMutation.mutateAsync(values);
  };

  const daysUntilExpiry = adhesion?.dateFin 
    ? Math.ceil((new Date(adhesion.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const historyColumns = [
    { key: 'dateDebut', header: 'Début', cell: (a: Adhesion) => new Date(a.dateDebut).toLocaleDateString('fr-FR') },
    { key: 'dateFin', header: 'Fin', cell: (a: Adhesion) => new Date(a.dateFin).toLocaleDateString('fr-FR') },
    { key: 'montantCotisation', header: 'Cotisation', cell: (a: Adhesion) => `${a.montantCotisation} TND/mois`, align: 'right' as const },
    { key: 'statut', header: 'Statut', cell: (a: Adhesion) => <StatusBadge status={a.statut} /> },
  ];

  return (
    <div>
      <PageHeader 
        title="Mon adhésion"
        description="Gérez votre adhésion à l'Amicale SRT"
      />

      {adhesionLoading ? (
        <div className="adherent-adhesion-card skeleton" style={{ height: 200 }} />
      ) : adhesion?.statut === 'active' ? (
        <div className="adherent-adhesion-card adherent-adhesion-active">
          <div className="adherent-adhesion-header">
            <div className="adherent-adhesion-icon">
              <BadgeCheck size={32} />
            </div>
            <div className="adherent-adhesion-info">
              <h2>Adhésion active</h2>
              <p>Votre adhésion est à jour</p>
            </div>
            {(isExpiringSoon || isExpired) && (
              <div className={`adherent-adhesion-alert ${isExpired ? 'expired' : 'warning'}`}>
                <AlertTriangle size={20} />
                <span>{isExpired ? 'Adhésion expirée' : `Expire dans ${daysUntilExpiry} jours`}</span>
              </div>
            )}
          </div>

          <div className="adherent-adhesion-details">
            <div className="adherent-adhesion-detail">
              <Calendar size={18} />
              <div>
                <span className="label">Date de début</span>
                <span className="value">{new Date(adhesion.dateDebut).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div className="adherent-adhesion-detail">
              <Calendar size={18} />
              <div>
                <span className="label">Date de fin</span>
                <span className="value">{new Date(adhesion.dateFin).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div className="adherent-adhesion-detail">
              <DollarSign size={18} />
              <div>
                <span className="label">Cotisation mensuelle</span>
                <span className="value">{adhesion.montantCotisation} TND</span>
              </div>
            </div>
          </div>

          <div className="adh-alert info" style={{ marginTop: 'var(--space-4)' }}>
            <RefreshCw size={18} className="adh-alert-icon" />
            <div>
              <strong>Prélèvement automatique</strong> — La cotisation de {adhesion.montantCotisation} TND est retenue
              automatiquement chaque mois sur votre salaire. Aucune action n'est requise de votre part.
            </div>
          </div>

          {(isExpiringSoon || isExpired) && (
            <div className="adherent-adhesion-actions">
              <Button onClick={() => setRenewing(true)} isLoading={renewMutation.isPending}>
                <RefreshCw size={16} style={{ marginRight: 8 }} />
                Renouveler l'adhésion
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="adherent-adhesion-card adherent-adhesion-inactive">
          <div className="adherent-adhesion-header">
            <div className="adherent-adhesion-icon" style={{ background: 'var(--color-warning-100)', color: 'var(--color-warning-600)' }}>
              <AlertTriangle size={32} />
            </div>
            <div className="adherent-adhesion-info">
              <h2>Aucune adhésion active</h2>
              <p>Vous n'avez pas d'adhésion en cours</p>
            </div>
          </div>
          <div className="adherent-adhesion-actions">
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} style={{ marginRight: 8 }} />
              Demander une adhésion
            </Button>
          </div>
        </div>
      )}

      <div className="adherent-adhesion-history" style={{ marginTop: 'var(--space-6)' }}>
        <div className="adherent-card-header">
          <h3><History size={18} style={{ marginRight: 8 }} /> Historique des adhésions</h3>
        </div>
        <DataTable 
          columns={historyColumns}
          rows={history || []}
          loading={historyLoading}
          rowKey={(a) => a.id}
          emptyTitle="Aucune adhésion"
          emptyDescription="Votre historique d'adhésions est vide."
        />
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Demander une adhésion">
        <AdhesionRequestForm 
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitting={createMutation.isPending}
        />
      </Modal>

      {renewing && (
        <div className="modal-backdrop" onClick={() => setRenewing(false)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Confirmer le renouvellement</h2>
            </header>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir renouveler votre adhésion pour une année supplémentaire ?</p>
            </div>
            <footer className="modal-footer">
              <Button variant="secondary" onClick={() => setRenewing(false)}>Annuler</Button>
              <Button onClick={() => renewMutation.mutate()} isLoading={renewMutation.isPending}>
                Confirmer
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
