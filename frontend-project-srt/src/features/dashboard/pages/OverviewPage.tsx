import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Users, Banknote, Wallet, ClockAlert, FileSignature, Building2,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { StatCard } from '../../../components/charts/StatCard';
import { ChartCard } from '../../../components/charts/ChartCard';
import { Skeleton } from '../../../components/data/Skeleton';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { dashboardApi } from '../dashboardApi';
import { formatCurrency, formatNumber, formatRelative, formatDate, daysUntil } from '../../../lib/formatters';
import './OverviewPage.css';

export function OverviewPage() {
  const stats = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: dashboardApi.stats });
  const monthly = useQuery({ queryKey: ['dashboard', 'monthly'], queryFn: dashboardApi.monthlyRevenue });
  const ops = useQuery({ queryKey: ['dashboard', 'ops'], queryFn: dashboardApi.operationsByType });
  const prets = useQuery({ queryKey: ['dashboard', 'prets-status'], queryFn: dashboardApi.pretsByStatus });
  const activity = useQuery({ queryKey: ['dashboard', 'activity'], queryFn: dashboardApi.recentActivity });
  const alerts = useQuery({ queryKey: ['dashboard', 'alerts'], queryFn: dashboardApi.alerts });

  return (
    <div className="overview-page">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité du système SRT"
        breadcrumb={['Administration', 'Tableau de bord']}
      />

      <div className="overview-stats">
        <StatCard
          label="Total adhérents"
          value={stats.data ? formatNumber(stats.data.totalAdherents) : '—'}
          icon={<Users size={22} />}
          tone="primary"
          trend={stats.data?.trendAdherents}
          loading={stats.isLoading}
        />
        <StatCard
          label="Prêts actifs"
          value={stats.data ? formatNumber(stats.data.pretsActifs) : '—'}
          icon={<Banknote size={22} />}
          tone="info"
          trend={stats.data?.trendPrets}
          loading={stats.isLoading}
        />
        <StatCard
          label="Revenu total"
          value={stats.data ? formatCurrency(stats.data.revenuTotal) : '—'}
          icon={<Wallet size={22} />}
          tone="success"
          trend={stats.data?.trendRevenu}
          loading={stats.isLoading}
        />
        <StatCard
          label="Demandes en attente"
          value={stats.data ? formatNumber(stats.data.demandesEnAttente) : '—'}
          icon={<ClockAlert size={22} />}
          tone="warning"
          trend={stats.data?.trendDemandes}
          loading={stats.isLoading}
        />
        <StatCard
          label="Conventions actives"
          value={stats.data ? formatNumber(stats.data.conventionsActives) : '—'}
          icon={<FileSignature size={22} />}
          tone="primary"
          loading={stats.isLoading}
        />
        <StatCard
          label="Fournisseurs actifs"
          value={stats.data ? formatNumber(stats.data.fournisseursActifs) : '—'}
          icon={<Building2 size={22} />}
          tone="info"
          loading={stats.isLoading}
        />
      </div>

      <div className="overview-charts-row">
        <ChartCard title="Revenu mensuel" subtitle="Recettes vs dépenses sur les 12 derniers mois">
          {monthly.isLoading ? (
            <Skeleton width="100%" height="100%" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly.data} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line type="monotone" dataKey="revenu" name="Recettes" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="depenses" name="Dépenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Statut des prêts" subtitle="Répartition par état">
          {prets.isLoading ? (
            <Skeleton width="100%" height="100%" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prets.data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {prets.data?.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 13 }} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="overview-bottom-row">
        <ChartCard title="Opérations par type" subtitle="Volume d'opérations enregistrées">
          {ops.isLoading ? (
            <Skeleton width="100%" height="100%" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ops.data} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="type" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <section className="activity-card">
          <header className="activity-card-header">
            <div>
              <h3>Activité récente</h3>
              <p>Dernières opérations financières</p>
            </div>
          </header>
          <ul className="activity-list">
            {activity.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="activity-item"><Skeleton height={36} /></li>
                ))
              : activity.data?.map((op) => {
                  const positive = op.montant >= 0;
                  return (
                    <li key={op.id} className="activity-item">
                      <span className={`activity-icon ${positive ? 'is-up' : 'is-down'}`}>
                        {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </span>
                      <div className="activity-meta">
                        <p>{op.description}</p>
                        <span>{op.reference} • {formatRelative(op.date)}</span>
                      </div>
                      <strong className={positive ? 'is-up' : 'is-down'}>
                        {positive ? '+' : '−'}{formatCurrency(Math.abs(op.montant))}
                      </strong>
                    </li>
                  );
                })}
          </ul>
        </section>
      </div>

      <section className="alerts-card">
        <header className="alerts-card-header">
          <AlertTriangle size={18} className="alerts-icon" />
          <div>
            <h3>Alertes & approbations en attente</h3>
            <p>Éléments nécessitant votre attention</p>
          </div>
        </header>
        <div className="alerts-grid">
          <div className="alerts-col">
            <h4><Calendar size={14} /> Conventions expirantes (&lt; 30 j)</h4>
            {alerts.isLoading ? <Skeleton height={60} /> : alerts.data?.expiringConventions.length === 0 ? (
              <p className="alerts-empty">Aucune convention proche de l'expiration.</p>
            ) : (
              <ul>
                {alerts.data?.expiringConventions.map((c) => (
                  <li key={c.id}>
                    <span>{c.fournisseurNom}</span>
                    <StatusBadge status="en_attente" tone="warning" label={`${daysUntil(c.dateFin)} j`} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="alerts-col">
            <h4>Factures impayées</h4>
            {alerts.isLoading ? <Skeleton height={60} /> : alerts.data?.unpaidFactures.length === 0 ? (
              <p className="alerts-empty">Toutes les factures sont à jour.</p>
            ) : (
              <ul>
                {alerts.data?.unpaidFactures.slice(0, 5).map((f) => (
                  <li key={f.id}>
                    <span>{f.numero} • {f.fournisseurNom}</span>
                    <strong>{formatCurrency(f.montant)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="alerts-col">
            <h4>Prêts en retard</h4>
            {alerts.isLoading ? <Skeleton height={60} /> : alerts.data?.latePrets.length === 0 ? (
              <p className="alerts-empty">Aucun prêt en retard.</p>
            ) : (
              <ul>
                {alerts.data?.latePrets.map((p) => (
                  <li key={p.id}>
                    <span>{p.adherentNom}</span>
                    <strong>{formatCurrency(p.montant)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <p className="overview-footnote">Données mises à jour le {formatDate(new Date().toISOString())}.</p>
    </div>
  );
}
