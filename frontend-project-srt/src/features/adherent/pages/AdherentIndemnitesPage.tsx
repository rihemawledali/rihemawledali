/* ============================================
   Adherent Indemnites Page
   ============================================ */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HeartHandshake, Plus, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/data/Modal';
import { DataTable } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { useToast } from '../../../components/feedback/useToast';
import { indemnitesApi } from '../api/indemnitesApi';
import { IndemniteRequestForm } from '../forms/IndemniteRequestForm';
import type { IndemniteRequestFormValues } from '../validators';
import type { Indemnite } from '../../../types/domain';

const TYPE_LABELS: Record<string, string> = {
  maladie: 'Maladie',
  naissance: 'Naissance',
  mariage: 'Mariage',
  deces: 'Décès',
  scolarite: 'Scolarité',
};

export function AdherentIndemnitesPage() {
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  const { data: indemnites, isLoading } = useQuery({
    queryKey: ['adherent-indemnites'],
    queryFn: () => indemnitesApi.getIndemnites(),
  });

  const createMutation = useMutation({
    mutationFn: (values: IndemniteRequestFormValues) => indemnitesApi.createIndemnite({
      type: values.type,
      montant: values.montant,
      motif: values.motif,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-indemnites'] });
      setCreating(false);
      toast.push({ title: 'Demande d\'indemnité soumise', variant: 'success' });
    },
    onError: () => {
      toast.push({ title: 'Échec de la demande', variant: 'error' });
    },
  });

  const handleCreate = async (values: IndemniteRequestFormValues) => {
    await createMutation.mutateAsync(values);
  };

  const totalApprouve = indemnites?.filter(i => i.statut === 'approuvee' || i.statut === 'payee').reduce((s, i) => s + i.montant, 0) || 0;
  const totalEnAttente = indemnites?.filter(i => i.statut === 'en_attente').reduce((s, i) => s + i.montant, 0) || 0;

  const columns = [
    { 
      key: 'dateDemande', 
      header: 'Date', 
      cell: (i: Indemnite) => new Date(i.dateDemande).toLocaleDateString('fr-FR'),
      width: '120px'
    },
    { 
      key: 'type', 
      header: 'Type', 
      cell: (i: Indemnite) => TYPE_LABELS[i.type] || i.type,
      width: '120px'
    },
    { key: 'motif', header: 'Motif', cell: (i: Indemnite) => i.motif || '-' },
    { 
      key: 'montant', 
      header: 'Montant', 
      cell: (i: Indemnite) => `${i.montant.toFixed(2)} TND`,
      align: 'right' as const,
      width: '120px'
    },
    { key: 'statut', header: 'Statut', cell: (i: Indemnite) => <StatusBadge status={i.statut} />, width: '130px' },
  ];

  return (
    <div>
      <PageHeader 
        title="Mes indemnités"
        description="Consultez et demandez vos indemnités sociales"
      />

      {isLoading ? (
        <div className="adherent-dashboard">
          <div className="adherent-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--space-6)' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="stat-card skeleton" style={{ height: 100 }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      ) : (
        <>
          <div className="adherent-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--space-6)' }}>
            <div className="stat-card" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-success-100)', color: 'var(--color-success-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <CheckCircle size={20} />
                </div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Total approuvé</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {totalApprouve.toFixed(2)} TND
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-warning-100)', color: 'var(--color-warning-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <Clock size={20} />
                </div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>En attente</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {totalEnAttente.toFixed(2)} TND
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <TrendingUp size={20} />
                </div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Nombre de demandes</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {indemnites?.length || 0}
              </div>
            </div>
          </div>

          <div className="adherent-adhesion-history">
            <div className="adherent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3><HeartHandshake size={18} style={{ marginRight: 8 }} /> Historique des indemnités</h3>
              <Button onClick={() => setCreating(true)} size="sm">
                <Plus size={16} style={{ marginRight: 6 }} />
                Nouvelle demande
              </Button>
            </div>
            <DataTable 
              columns={columns}
              rows={indemnites || []}
              rowKey={(i) => i.id}
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
