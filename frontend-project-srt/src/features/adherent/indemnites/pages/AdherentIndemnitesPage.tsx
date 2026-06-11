
import { useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HeartHandshake, Plus, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { Button } from '../../../../shared/ui/Button';
import { Modal } from '../../../../shared/data/Modal';
import { DataTable } from '../../../../shared/data/DataTable';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { useToast } from '../../../../shared/feedback/useToast';
import { uploadFile } from '../../../../shared/api/apiClient';
import { indemnitesApi } from '../api';
import { IndemniteRequestForm } from '../forms/IndemniteRequestForm';
import type { IndemniteRequestFormValues } from '../../validators';
import type { Indemnite } from '../../../../shared/types/domain';
import './AdherentIndemnitesPage.css';

const TYPE_LABELS: Record<string, string> = {
  maladie: 'Maladie',
  naissance: 'Naissance',
  mariage: 'Mariage',
  deces: 'Décès',
  scolarite: 'Scolarité',
};

export function AdherentIndemnitesPage() {
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['adherent-indemnites'],
    queryFn: () => indemnitesApi.getIndemnites(),
  });

  const indemnites = data ?? [];
  const totalApprouve = getTotal(indemnites, ['approuvee', 'payee']);
  const totalEnAttente = getTotal(indemnites, ['en_attente']);

  const createMutation = useMutation({
    mutationFn: async ({ values, file }: { values: IndemniteRequestFormValues; file?: File }) => {
      const attachmentId = file ? (await uploadFile(file)).id : undefined;

      return indemnitesApi.createIndemnite({
        type: values.type,
        montant: values.montant,
        motif: values.motif,
        attachmentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adherent-indemnites'] });
      setCreating(false);
      toast.push({ title: "Demande d'indemnité soumise", variant: 'success' });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Échec de la demande';
      toast.push({ title: message, variant: 'error' });
    },
  });

  const columns = [
    {
      key: 'dateDemande',
      header: 'Date',
      cell: (item: Indemnite) => new Date(item.dateDemande).toLocaleDateString('fr-FR'),
      width: '120px',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (item: Indemnite) => TYPE_LABELS[item.type] || item.type,
      width: '120px',
    },
    { key: 'motif', header: 'Motif', cell: (item: Indemnite) => item.motif || '-' },
    {
      key: 'montant',
      header: 'Montant',
      cell: (item: Indemnite) => `${item.montant.toFixed(2)} TND`,
      align: 'right' as const,
      width: '120px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (item: Indemnite) => <StatusBadge status={item.statut} />,
      width: '130px',
    },
  ];

  const handleCreate = (values: IndemniteRequestFormValues, file?: File) => {
    return createMutation.mutateAsync({ values, file });
  };

  return (
    <div className="adherent-indemnites-page">
      <PageHeader
        title="Mes indemnités"
        description="Consultez et demandez vos indemnités sociales"
      />

      {isLoading ? (
        <IndemnitesLoading />
      ) : (
        <>
          <div className="adherent-stats-grid indemnites-stats-grid">
            <StatCard
              icon={<CheckCircle size={20} />}
              label="Total approuvé"
              value={`${totalApprouve.toFixed(2)} TND`}
              tone="success"
            />
            <StatCard
              icon={<Clock size={20} />}
              label="En attente"
              value={`${totalEnAttente.toFixed(2)} TND`}
              tone="warning"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Nombre de demandes"
              value={indemnites.length}
              tone="primary"
            />
          </div>

          <div className="adherent-adhesion-history indemnites-history">
            <div className="adherent-card-header indemnites-history-header">
              <h3 className="indemnites-history-title">
                <HeartHandshake size={18} className="indemnites-title-icon" />
                Historique des indemnités
              </h3>
              <Button onClick={() => setCreating(true)} size="sm">
                <Plus size={16} className="indemnites-button-icon" />
                Nouvelle demande
              </Button>
            </div>

            <DataTable
              columns={columns}
              rows={indemnites}
              rowKey={(item) => item.id}
              emptyTitle="Aucune indemnité"
              emptyDescription="Vous n'avez pas encore de demande d'indemnité."
            />
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Demander une indemnité">
        <IndemniteRequestForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitting={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}

function IndemnitesLoading() {
  return (
    <div className="adherent-dashboard">
      <div className="adherent-stats-grid indemnites-stats-grid">
        {[0, 1, 2].map((item) => (
          <div key={item} className="stat-card skeleton indemnites-stat-skeleton" />
        ))}
      </div>
      <div className="skeleton indemnites-table-skeleton" />
    </div>
  );
}

function StatCard({ icon, label, value, tone }: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: 'success' | 'warning' | 'primary';
}) {
  return (
    <div className="stat-card indemnites-stat-card">
      <div className="indemnites-stat-header">
        <div className={`indemnites-stat-icon is-${tone}`}>{icon}</div>
        <span className="indemnites-stat-label">{label}</span>
      </div>
      <div className="indemnites-stat-value">{value}</div>
    </div>
  );
}

function getTotal(items: Indemnite[], statuses: string[]) {
  return items
    .filter((item) => statuses.includes(item.statut))
    .reduce((sum, item) => sum + item.montant, 0);
}
