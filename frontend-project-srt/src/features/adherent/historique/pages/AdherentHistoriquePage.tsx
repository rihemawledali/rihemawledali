/* ============================================
   Adherent Historique Page
   ============================================ */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Filter, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { DataTable } from '../../../../shared/data/DataTable';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { Button } from '../../../../shared/ui/Button';
import { FormSelect } from '../../../../shared/ui/FormSelect';
import { FormInput } from '../../../../shared/ui/FormInput';
import { historiqueApi } from '../api';
import type { HistoriqueFinanciere, OperationType } from '../../../../shared/types/domain';

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'cotisation', label: 'Cotisation' },
  { value: 'pret', label: 'Prêt' },
  { value: 'remboursement', label: 'Remboursement' },
  { value: 'indemnite', label: 'Indemnité' },
  { value: 'credit', label: 'Crédit' },
  { value: 'debit', label: 'Débit' },
  { value: 'facture', label: 'Facture' },
];

export function AdherentHistoriquePage() {
  const [typeFilter, setTypeFilter] = useState<OperationType | ''>('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const { data: historique, isLoading } = useQuery({
    queryKey: ['adherent-historique', typeFilter, dateDebut, dateFin],
    queryFn: () => historiqueApi.getHistorique({ 
      type: typeFilter || undefined, 
      dateDebut: dateDebut || undefined, 
      dateFin: dateFin || undefined 
    }),
  });

  const filteredData = useMemo(() => historique || [], [historique]);

  const totals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    filteredData.forEach(h => {
      if (h.montant > 0) credits += h.montant;
      else debits += Math.abs(h.montant);
    });
    return { credits, debits, solde: credits - debits };
  }, [filteredData]);

  const columns = [
    { 
      key: 'date', 
      header: 'Date', 
      cell: (h: HistoriqueFinanciere) => new Date(h.date).toLocaleDateString('fr-FR'),
      width: '110px'
    },
    { 
      key: 'type', 
      header: 'Type', 
      cell: (h: HistoriqueFinanciere) => <StatusBadge status={h.type} />,
      width: '130px'
    },
    { key: 'reference', header: 'Référence', cell: (h: HistoriqueFinanciere) => h.reference || '-', width: '140px' },
    { key: 'description', header: 'Description', cell: (h: HistoriqueFinanciere) => h.description },
    { 
      key: 'montant', 
      header: 'Montant', 
      cell: (h: HistoriqueFinanciere) => (
        <span style={{ 
          color: h.montant > 0 ? 'var(--color-success-600)' : 'var(--color-error-600)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          justifyContent: 'flex-end'
        }}>
          {h.montant > 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
          {h.montant > 0 ? '+' : ''}{h.montant.toFixed(2)} TND
        </span>
      ),
      align: 'right' as const,
      width: '150px'
    },
  ];

  const handleReset = () => {
    setTypeFilter('');
    setDateDebut('');
    setDateFin('');
  };

  return (
    <div>
      <PageHeader 
        title="Historique financier"
        description="Consultez l'ensemble de vos opérations financières"
      />

      <div className="adherent-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 'var(--space-6)' }}>
        <div className="stat-card" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{ background: 'var(--color-success-100)', color: 'var(--color-success-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
              <ArrowUpRight size={20} />
            </div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Crédits</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success-600)' }}>
            +{totals.credits.toFixed(2)} TND
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{ background: 'var(--color-error-100)', color: 'var(--color-error-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
              <ArrowDownLeft size={20} />
            </div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Débits</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-error-600)' }}>
            -{totals.debits.toFixed(2)} TND
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{ background: totals.solde >= 0 ? 'var(--color-primary-100)' : 'var(--color-warning-100)', color: totals.solde >= 0 ? 'var(--color-primary-600)' : 'var(--color-warning-600)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
              <History size={20} />
            </div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Solde période</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: totals.solde >= 0 ? 'var(--color-primary-600)' : 'var(--color-warning-600)' }}>
            {totals.solde >= 0 ? '+' : ''}{totals.solde.toFixed(2)} TND
          </div>
        </div>
      </div>

      <div className="adherent-adhesion-history">
        <div className="adherent-card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={18} />
            <h3>Filtres</h3>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <FormSelect
                label="Type d'opération"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as OperationType | '')}
                options={TYPE_OPTIONS}
              />
            </div>
            <div style={{ minWidth: 160, flex: 1 }}>
              <FormInput
                label="Date début"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div style={{ minWidth: 160, flex: 1 }}>
              <FormInput
                label="Date fin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset} style={{ marginBottom: '2px' }}>
              <RotateCcw size={14} style={{ marginRight: 6 }} />
              Réinitialiser
            </Button>
          </div>
        </div>

        <DataTable 
          columns={columns}
          rows={filteredData}
          loading={isLoading}
          rowKey={(h) => h.id}
          emptyTitle="Aucune opération"
          emptyDescription="Aucune opération ne correspond aux critères sélectionnés."
        />
      </div>
    </div>
  );
}
