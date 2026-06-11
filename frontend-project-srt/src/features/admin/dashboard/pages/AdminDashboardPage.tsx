import { PageHeader } from '../../../../shared/layout/PageHeader';
import {
  AdminDashboardMetrics,
  AdminPriorityPanel,
  AdminTrendPanel,
} from '../components/AdminDashboardSections';
import { useAdminDashboardStats } from '../hooks';
import '../../AdminManagementPages.css';
import './AdminDashboardPage.css';

export function AdminDashboardPage() {
  const stats = useAdminDashboardStats();
  const data = stats.data;

  return (
    <div className="admin-surface overview-page">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activite du systeme SRT"
        breadcrumb={['Administration', 'Tableau de bord']}
      />

      <section className="admin-hero">
        <div>
          <span className="admin-hero-kicker">Pilotage administratif</span>
          <h2>Vue operationnelle</h2>
          <p>Suivi des adherents, des flux financiers, des prets et des dossiers en attente.</p>
        </div>
      </section>

      <AdminDashboardMetrics data={data} loading={stats.isLoading} />

      <section className="admin-dashboard-grid">
        <AdminTrendPanel data={data} />
        <AdminPriorityPanel data={data} />
      </section>
    </div>
  );
}
