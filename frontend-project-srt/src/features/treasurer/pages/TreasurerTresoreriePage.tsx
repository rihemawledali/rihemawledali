/* ============================================
   Treasurer — Trésorerie (état des comptes)
   ============================================ */

import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Building2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { StatCard } from '../../../components/charts/StatCard';
import { ChartCard } from '../../../components/charts/ChartCard';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { treasurerTresorerieApi } from '../api/treasurerListApi';
import { treasurerApi } from '../api/treasurerApi';
import type { CompteBancaire } from '../../../types/domain';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import '../../dashboard/pages/OverviewPage.css';

export function TreasurerTresoreriePage() {
  const snap = useQuery({ queryKey: ['treasurer', 'tresorerie'], queryFn: treasurerTresorerieApi.snapshot });
  const cashflow = useQuery({ queryKey: ['treasurer', 'cashflow'], queryFn: treasurerApi.getCashflow });

  const compteColumns: Column<CompteBancaire>[] = [
    {
      key: 'banque',
      header: 'Banque',
      cell: (c) => <strong>{c.banque}</strong>,
    },
    {
      key: 'iban',
      header: 'IBAN',
      cell: (c) => <span style={{ fontFamily: 'var(--font-family-mono, monospace)' }}>{c.iban}</span>,
    },
    {
      key: 'devise',
      header: 'Devise',
      cell: (c) => c.devise,
      width: '80px',
    },
    {
      key: 'solde',
      header: 'Solde',
      cell: (c) => (
        <strong style={{ color: c.solde >= 0 ? 'var(--color-success-700)' : 'var(--color-error-700)' }}>
          {formatCurrency(c.solde)}
        </strong>
      ),
      align: 'right',
      width: '160px',
    },
  ];

  return (
    <div className="overview-page">
      <PageHeader
        title="Trésorerie"
        description="État de la trésorerie en temps réel"
        breadcrumb={['Trésorerie', 'Finance', 'Trésorerie']}
      />

      <div className="overview-stats">
        <StatCard
          label="Solde global"
          value={snap.data ? formatCurrency(snap.data.totalSolde) : '—'}
          icon={<Wallet size={22} />}
          tone="success"
          loading={snap.isLoading}
        />
        <StatCard
          label="Encaissements du mois"
          value={snap.data ? formatCurrency(snap.data.encaissementsMois) : '—'}
          icon={<ArrowDownToLine size={22} />}
          tone="success"
          loading={snap.isLoading}
        />
        <StatCard
          label="Décaissements du mois"
          value={snap.data ? formatCurrency(snap.data.decaissementsMois) : '—'}
          icon={<ArrowUpFromLine size={22} />}
          tone="error"
          loading={snap.isLoading}
        />
        <StatCard
          label="Comptes bancaires"
          value={snap.data?.comptes.length ?? '—'}
          icon={<Building2 size={22} />}
          tone="primary"
          loading={snap.isLoading}
        />
      </div>

      <ChartCard
        title="Mouvements mensuels"
        subtitle="Entrées vs sorties sur les 12 derniers mois"
        height={280}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cashflow.data ?? []} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="mois" stroke="var(--color-text-tertiary)" fontSize={12} />
            <YAxis
              stroke="var(--color-text-tertiary)"
              fontSize={12}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="entrees" name="Entrées" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sorties" name="Sorties" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <header>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Comptes bancaires
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            {snap.data?.derniereOperation
              ? `Dernière opération : ${formatDate(snap.data.derniereOperation)}`
              : 'Aucune opération récente'}
          </p>
        </header>
        <DataTable
          columns={compteColumns}
          rows={snap.data?.comptes ?? []}
          loading={snap.isLoading}
          rowKey={(c) => c.id}
          emptyTitle="Aucun compte enregistré"
        />
      </section>
    </div>
  );
}
