/* ============================================
   Adherent Prets Page
   ============================================ */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, Plus, Calculator, Calendar, Clock, ListChecks, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/data/Modal';
import { DataTable } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { useToast } from '../../../components/feedback/useToast';
import { pretsApi } from '../api/pretsApi';
import { PretRequestForm } from '../forms/PretRequestForm';
import type { PretRequestFormValues } from '../validators';
import type { PretSocial } from '../../../types/domain';

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
  let remaining = loan.montant;
  const today = new Date();
  const rows: ScheduleRow[] = [];
  for (let i = 1; i <= loan.duree; i++) {
    const interet = +(remaining * monthlyRate).toFixed(2);
    const capital = +(monthly - interet).toFixed(2);
    remaining = +(remaining - capital).toFixed(2);
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    rows.push({
      num: i,
      date: d.toISOString().slice(0, 10),
      echeance: +monthly.toFixed(2),
      capital,
      interet,
      capitalRestant: Math.max(0, remaining),
      paid: d <= today,
    });
  }
  return rows;
}

export function AdherentPretsPage() {
  const [creating, setCreating] = useState(false);
  const [scheduleLoan, setScheduleLoan] = useState<PretSocial | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const schedule = useMemo(
    () => (scheduleLoan ? buildSchedule(scheduleLoan) : []),
    [scheduleLoan]
  );
  const paidCount = schedule.filter((r) => r.paid).length;

  const { data: prets, isLoading } = useQuery({
    queryKey: ['adherent-prets'],
    queryFn: () => pretsApi.getPrets(),
  });

  const createMutation = useMutation({
    mutationFn: (values: PretRequestFormValues) => pretsApi.createPret({
      montant: values.montant,
      duree: values.duree,
      taux: values.taux,
      motif: values.motif,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-prets'] });
      setCreating(false);
      toast.push({ title: 'Demande de prêt soumise', variant: 'success' });
    },
    onError: () => {
      toast.push({ title: 'Échec de la demande', variant: 'error' });
    },
  });

  const handleCreate = async (values: PretRequestFormValues) => {
    await createMutation.mutateAsync(values);
  };

  const activeLoan = prets?.find(p => p.statut === 'en_cours');
  const totalRembourse = prets?.filter(p => p.statut === 'rembourse').reduce((s, p) => s + p.montant, 0) || 0;

  const columns = [
    { key: 'numero', header: 'Référence', cell: (p: PretSocial) => p.id, width: '120px' },
    { 
      key: 'dateDemande', 
      header: 'Date demande', 
      cell: (p: PretSocial) => new Date(p.dateDemande).toLocaleDateString('fr-FR'),
      width: '130px'
    },
    { 
      key: 'montant', 
      header: 'Montant', 
      cell: (p: PretSocial) => `${p.montant.toFixed(0)} TND`,
      align: 'right' as const,
      width: '120px'
    },
    { 
      key: 'duree', 
      header: 'Durée', 
      cell: (p: PretSocial) => `${p.duree} mois`,
      width: '100px'
    },
    { 
      key: 'taux', 
      header: 'Taux', 
      cell: (p: PretSocial) => `${p.taux}%`,
      width: '80px'
    },
    { 
      key: 'mensualite', 
      header: 'Mensualité', 
      cell: (p: PretSocial) => {
        const m = pretsApi.calculateMonthlyPayment(p.montant, p.duree, p.taux);
        return `${m.toFixed(2)} TND`;
      },
      align: 'right' as const,
      width: '120px'
    },
    { key: 'statut', header: 'Statut', cell: (p: PretSocial) => <StatusBadge status={p.statut} />, width: '130px' },
  ];

  return (
    <div>
      <PageHeader 
        title="Mes prêts"
        description="Gérez vos demandes et suivez vos prêts en cours"
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
                <div style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <Banknote size={20} />
                </div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Prêt actif</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {activeLoan ? `${activeLoan.montant.toFixed(0)} TND` : 'Aucun'}
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-success-100)', color: 'var(--color-success-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <Calculator size={20} />
                </div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Total remboursé</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {totalRembourse.toFixed(0)} TND
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-warning-100)', color: 'var(--color-warning-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <Clock size={20} />
                </div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Demandes en attente</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {prets?.filter(p => p.statut === 'en_attente').length || 0}
              </div>
            </div>
          </div>

          {activeLoan && (
            <div className="adherent-adhesion-card adherent-adhesion-active" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="adherent-adhesion-header">
                <div className="adherent-adhesion-icon">
                  <Banknote size={28} />
                </div>
                <div className="adherent-adhesion-info">
                  <h2>Prêt en cours</h2>
                  <p>Référence {activeLoan.id}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <Button variant="secondary" size="sm" onClick={() => setScheduleLoan(activeLoan)}>
                    <ListChecks size={16} style={{ marginRight: 6 }} />
                    Voir l'échéancier
                  </Button>
                </div>
              </div>
              <div className="adherent-adhesion-details">
                <div className="adherent-adhesion-detail">
                  <Calendar size={18} />
                  <div>
                    <span className="label">Date d'accord</span>
                    <span className="value">{activeLoan.dateAccord ? new Date(activeLoan.dateAccord).toLocaleDateString('fr-FR') : 'En attente'}</span>
                  </div>
                </div>
                <div className="adherent-adhesion-detail">
                  <Banknote size={18} />
                  <div>
                    <span className="label">Montant</span>
                    <span className="value">{activeLoan.montant.toFixed(0)} TND</span>
                  </div>
                </div>
                <div className="adherent-adhesion-detail">
                  <Clock size={18} />
                  <div>
                    <span className="label">Durée / Taux</span>
                    <span className="value">{activeLoan.duree} mois à {activeLoan.taux}%</span>
                  </div>
                </div>
                <div className="adherent-adhesion-detail">
                  <Calculator size={18} />
                  <div>
                    <span className="label">Mensualité</span>
                    <span className="value">{pretsApi.calculateMonthlyPayment(activeLoan.montant, activeLoan.duree, activeLoan.taux).toFixed(2)} TND</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="adherent-adhesion-history">
            <div className="adherent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3><Banknote size={18} style={{ marginRight: 8 }} /> Historique des prêts</h3>
              <Button onClick={() => setCreating(true)} size="sm">
                <Plus size={16} style={{ marginRight: 6 }} />
                Nouvelle demande
              </Button>
            </div>
            <DataTable 
              columns={columns}
              rows={prets || []}
              rowKey={(p) => p.id}
              emptyTitle="Aucun prêt"
              emptyDescription="Vous n'avez pas encore de demande de prêt."
            />
          </div>
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
        description={scheduleLoan ? `Prêt ${scheduleLoan.id} — ${scheduleLoan.montant.toFixed(0)} TND sur ${scheduleLoan.duree} mois (${scheduleLoan.taux}%)` : undefined}
        size="lg"
      >
        {scheduleLoan && (
          <>
            <div className="adherent-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 'var(--space-4)' }}>
              <div className="adh-tile">
                <div className="adh-tile-head">
                  <div className="adh-tile-icon tone-success"><CheckCircle2 size={18} /></div>
                  <span className="adh-tile-label">Mensualités payées</span>
                </div>
                <div className="adh-tile-value">{paidCount} / {schedule.length}</div>
              </div>
              <div className="adh-tile">
                <div className="adh-tile-head">
                  <div className="adh-tile-icon tone-info"><Calculator size={18} /></div>
                  <span className="adh-tile-label">Mensualité</span>
                </div>
                <div className="adh-tile-value">
                  {pretsApi.calculateMonthlyPayment(scheduleLoan.montant, scheduleLoan.duree, scheduleLoan.taux).toFixed(2)} TND
                </div>
              </div>
              <div className="adh-tile">
                <div className="adh-tile-head">
                  <div className="adh-tile-icon tone-warning"><Clock size={18} /></div>
                  <span className="adh-tile-label">Restant dû</span>
                </div>
                <div className="adh-tile-value">
                  {(schedule[paidCount - 1]?.capitalRestant ?? scheduleLoan.montant).toFixed(2)} TND
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
              <table className="adh-schedule">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Échéance</th>
                    <th style={{ textAlign: 'right' }}>Capital</th>
                    <th style={{ textAlign: 'right' }}>Intérêt</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Restant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.num} className={row.paid ? 'is-paid' : ''}>
                      <td>{row.num}</td>
                      <td>{new Date(row.date).toLocaleDateString('fr-FR')}</td>
                      <td className="num">{row.capital.toFixed(2)}</td>
                      <td className="num">{row.interet.toFixed(2)}</td>
                      <td className="num">{row.echeance.toFixed(2)}</td>
                      <td className="num">{row.capitalRestant.toFixed(2)}</td>
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
          </>
        )}
      </Modal>
    </div>
  );
}
