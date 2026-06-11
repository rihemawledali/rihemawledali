import { useNavigate } from 'react-router-dom';
import { FileWarning, Receipt } from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { ChartCard } from '../../../../shared/charts/ChartCard';
import { Button } from '../../../../shared/ui/Button';
import { formatNumber } from '../../../../shared/lib/formatters';
import {
  CashflowLineChart,
  ExpenseBreakdown,
  IncomeExpenseChart,
  MiniMetric,
  PendingRequestsList,
  PendingWorkPanel,
  QuickLinks,
  RecentOperationsList,
  TreasuryHealthPanel,
} from '../components/TreasurerDashboardSections';
import { useTreasurerDashboard } from '../hooks';
import './TreasurerDashboardPage.css';

export function TreasurerDashboardPage() {
  const navigate = useNavigate();
  const dashboard = useTreasurerDashboard();

  return (
    <div className="treasurer-dashboard">
      <PageHeader
        title="Tableau de bord tresorier"
        description="Pilotage de la tresorerie, des validations et des mouvements recents."
        breadcrumb={['Tresorerie', 'Tableau de bord']}
        actions={(
          <Button variant="secondary" onClick={() => navigate('/treasurer/historique')}>
            Voir l'historique
          </Button>
        )}
      />

      <section className="td-overview-grid">
        <TreasuryHealthPanel
          stats={dashboard.statsData}
          netMovement={dashboard.netMovement}
          loading={dashboard.stats.isLoading}
        />
        <PendingWorkPanel
          stats={dashboard.statsData}
          total={dashboard.pendingTotal}
          loading={dashboard.stats.isLoading}
          onNavigate={navigate}
        />
      </section>

      <section className="td-secondary-grid">
        <MiniMetric
          icon={<Receipt size={18} />}
          label="Retenues generees"
          value={dashboard.statsData ? formatNumber(dashboard.statsData.retenuesGenerees) : '-'}
          loading={dashboard.stats.isLoading}
          tone="info"
        />
        <MiniMetric
          icon={<FileWarning size={18} />}
          label="Factures impayees"
          value={dashboard.statsData ? formatNumber(dashboard.statsData.facturesImpayees) : '-'}
          loading={dashboard.stats.isLoading}
          tone="error"
        />
      </section>

      <section className="td-charts-grid">
        <ChartCard title="Evolution de la tresorerie" subtitle="Solde mensuel sur les 12 derniers mois" height={330}>
          <CashflowLineChart data={dashboard.cashflowData} />
        </ChartCard>

        <ChartCard title="Repartition des depenses" subtitle="Mois courant" height={330}>
          <ExpenseBreakdown data={dashboard.breakdownData} total={dashboard.expenseTotal} />
        </ChartCard>
      </section>

      <ChartCard title="Entrees vs sorties" subtitle="Comparaison mensuelle sur les 12 derniers mois" height={300}>
        <IncomeExpenseChart data={dashboard.cashflowData} />
      </ChartCard>

      <QuickLinks onNavigate={navigate} />

      <section className="td-work-grid">
        <PendingRequestsList requests={dashboard.requestData} loading={dashboard.requests.isLoading} onNavigate={navigate} />
        <RecentOperationsList operations={dashboard.operationData} loading={dashboard.operations.isLoading} onNavigate={navigate} />
      </section>
    </div>
  );
}
