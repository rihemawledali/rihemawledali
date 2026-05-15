/* ============================================
   Treasurer Dashboard - operational cockpit
   ============================================ */

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Banknote,
  CreditCard,
  FileText,
  FileWarning,
  HeartHandshake,
  PiggyBank,
  Receipt,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PageHeader } from '../../../shared/layout/PageHeader';
import { ChartCard } from '../../../shared/charts/ChartCard';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { Button } from '../../../shared/ui/Button';
import { formatCurrency, formatDate, formatNumber } from '../../../shared/lib/formatters';
import { treasurerApi } from '../api/treasurerApi';
import type {
  ExpenseSlice,
  FinancialOperation,
  MonthlyCashflowPoint,
  PendingRequest,
  PendingRequestType,
  TreasurerStats,
} from '../api/treasurerMockData';
import './TreasurerDashboardPage.css';

const REQUEST_TYPE_LABEL: Record<PendingRequestType, string> = {
  pret_social: 'Prêt social',
  indemnite: 'Indemnité',
  bon_commande: 'Bon de commande',
};

const REQUEST_TYPE_TONE: Record<PendingRequestType, 'primary' | 'info' | 'success' | 'warning'> = {
  pret_social: 'info',
  indemnite: 'success',
  bon_commande: 'warning',
};

const REQUEST_TYPE_ROUTE: Record<PendingRequestType, string> = {
  pret_social: '/treasurer/prets',
  indemnite: '/treasurer/indemnites',
  bon_commande: '/treasurer/bons-commande',
};

const OP_TYPE_LABEL: Record<FinancialOperation['type'], string> = {
  entree: 'Entrée',
  sortie: 'Sortie',
  paiement: 'Paiement',
  facture: 'Facture',
  retenue: 'Retenue',
};

const OP_TYPE_TONE: Record<FinancialOperation['type'], 'success' | 'error' | 'info' | 'warning' | 'primary'> = {
  entree: 'success',
  sortie: 'error',
  paiement: 'info',
  facture: 'warning',
  retenue: 'primary',
};

const PAYMENT_LABEL: Record<FinancialOperation['modePaiement'], string> = {
  virement: 'Virement',
  cheque: 'Chèque',
  espece: 'Espèce',
  prelevement: 'Prélèvement',
};

const QUICK_LINKS = [
  { label: 'Générer retenues', description: 'Préparer les retenues mensuelles', to: '/treasurer/retenues', icon: Receipt },
  { label: 'Nouveau paiement', description: 'Enregistrer un règlement', to: '/treasurer/paiements', icon: CreditCard },
  { label: 'Ajouter facture', description: 'Suivre une facture fournisseur', to: '/treasurer/factures', icon: FileText },
  { label: 'Valider prêt', description: 'Traiter les prêts sociaux', to: '/treasurer/prets', icon: Banknote },
  { label: 'Valider indemnité', description: 'Traiter les indemnités', to: '/treasurer/indemnites', icon: HeartHandshake },
  { label: 'Trésorerie', description: 'Consulter les comptes', to: '/treasurer/tresorerie', icon: PiggyBank },
  { label: 'Bons commande', description: 'Suivre les bons de commande', to: '/treasurer/bons-commande', icon: ShoppingCart },
];

function formatChartCurrency(value: unknown) {
  const n = Array.isArray(value) ? Number(value[0]) : Number(value);
  return Number.isFinite(n) ? formatCurrency(n) : String(value ?? '');
}

function formatAxisThousands(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n / 1000)}k` : '';
}

function signedCurrency(amount: number) {
  return `${amount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(amount))}`;
}

export function TreasurerDashboardPage() {
  const navigate = useNavigate();

  const stats = useQuery({ queryKey: ['treasurer', 'stats'], queryFn: treasurerApi.getStats });
  const cashflow = useQuery({ queryKey: ['treasurer', 'cashflow'], queryFn: treasurerApi.getCashflow });
  const breakdown = useQuery({ queryKey: ['treasurer', 'breakdown'], queryFn: treasurerApi.getExpenseBreakdown });
  const requests = useQuery({ queryKey: ['treasurer', 'requests'], queryFn: treasurerApi.getPendingRequests });
  const operations = useQuery({ queryKey: ['treasurer', 'operations'], queryFn: treasurerApi.getRecentOperations });

  const statsData = stats.data;
  const cashflowData = cashflow.data ?? [];
  const breakdownData = breakdown.data ?? [];
  const requestData = requests.data ?? [];
  const operationData = operations.data ?? [];

  const netMovement = (statsData?.entreesMois ?? 0) - (statsData?.sortiesMois ?? 0);
  const pendingTotal = (statsData?.pretsAValider ?? 0)
    + (statsData?.indemnitesATraiter ?? 0)
    + (statsData?.facturesImpayees ?? 0);

  const expenseTotal = breakdownData.reduce((sum, slice) => sum + slice.montant, 0);

  return (
    <div className="treasurer-dashboard">
      <PageHeader
        title="Tableau de bord trésorier"
        description="Pilotage de la trésorerie, des validations et des mouvements récents."
        breadcrumb={['Trésorerie', 'Tableau de bord']}
        actions={(
          <Button variant="secondary" onClick={() => navigate('/treasurer/historique')}>
            Voir l'historique
          </Button>
        )}
      />

      <section className="td-overview-grid">
        <TreasuryHealthPanel
          stats={statsData}
          netMovement={netMovement}
          loading={stats.isLoading}
        />
        <PendingWorkPanel
          stats={statsData}
          total={pendingTotal}
          loading={stats.isLoading}
          onNavigate={navigate}
        />
      </section>

      <section className="td-secondary-grid">
        <MiniMetric
          icon={<Receipt size={18} />}
          label="Retenues générées"
          value={statsData ? formatNumber(statsData.retenuesGenerees) : '—'}
          loading={stats.isLoading}
          tone="info"
        />
        <MiniMetric
          icon={<FileWarning size={18} />}
          label="Factures impayées"
          value={statsData ? formatNumber(statsData.facturesImpayees) : '—'}
          loading={stats.isLoading}
          tone="error"
        />
      </section>

      <section className="td-charts-grid">
        <ChartCard
          title="Évolution de la trésorerie"
          subtitle="Solde mensuel sur les 12 derniers mois"
          height={330}
        >
          <CashflowLineChart data={cashflowData} />
        </ChartCard>

        <ChartCard
          title="Répartition des dépenses"
          subtitle="Mois courant"
          height={330}
        >
          <ExpenseBreakdown data={breakdownData} total={expenseTotal} />
        </ChartCard>
      </section>

      <ChartCard
        title="Entrées vs sorties"
        subtitle="Comparaison mensuelle sur les 12 derniers mois"
        height={300}
      >
        <IncomeExpenseChart data={cashflowData} />
      </ChartCard>

      <QuickLinks onNavigate={navigate} />

      <section className="td-work-grid">
        <PendingRequestsList
          requests={requestData}
          loading={requests.isLoading}
          onNavigate={navigate}
        />
        <RecentOperationsList
          operations={operationData}
          loading={operations.isLoading}
          onNavigate={navigate}
        />
      </section>
    </div>
  );
}

function TreasuryHealthPanel({
  stats,
  netMovement,
  loading,
}: {
  stats?: TreasurerStats;
  netMovement: number;
  loading?: boolean;
}) {
  return (
    <section className="td-panel td-panel--treasury">
      <div className="td-panel-header">
        <div>
          <span className="td-eyebrow">Santé financière</span>
          <h2>Solde disponible</h2>
        </div>
        <span className="td-panel-icon td-panel-icon--success">
          <Wallet size={22} />
        </span>
      </div>

      <strong className="td-balance-value">
        {loading ? '...' : stats ? formatCurrency(stats.soldeActuel) : '—'}
      </strong>

      <div className="td-money-grid">
        <MoneyItem
          icon={<ArrowDownToLine size={16} />}
          label="Entrées du mois"
          value={stats ? formatCurrency(stats.entreesMois) : '—'}
          tone="success"
        />
        <MoneyItem
          icon={<ArrowUpFromLine size={16} />}
          label="Sorties du mois"
          value={stats ? formatCurrency(stats.sortiesMois) : '—'}
          tone="error"
        />
        <MoneyItem
          icon={<PiggyBank size={16} />}
          label="Mouvement net"
          value={stats ? signedCurrency(netMovement) : '—'}
          tone={netMovement >= 0 ? 'success' : 'error'}
        />
      </div>
    </section>
  );
}

function PendingWorkPanel({
  stats,
  total,
  loading,
  onNavigate,
}: {
  stats?: TreasurerStats;
  total: number;
  loading?: boolean;
  onNavigate: (path: string) => void;
}) {
  const items = [
    { label: 'Prêts sociaux', value: stats?.pretsAValider ?? 0, to: '/treasurer/prets', icon: Banknote },
    { label: 'Indemnités', value: stats?.indemnitesATraiter ?? 0, to: '/treasurer/indemnites', icon: HeartHandshake },
    { label: 'Factures', value: stats?.facturesImpayees ?? 0, to: '/treasurer/factures', icon: FileWarning },
  ];

  return (
    <section className="td-panel">
      <div className="td-panel-header">
        <div>
          <span className="td-eyebrow">Travail en attente</span>
          <h2>{loading ? '...' : formatNumber(total)} décisions à suivre</h2>
        </div>
        <StatusBadge
          status="en_attente"
          tone={total > 0 ? 'warning' : 'neutral'}
          label={total > 0 ? 'À traiter' : 'À jour'}
        />
      </div>

      <div className="td-pending-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.label}
              className="td-pending-item"
              onClick={() => onNavigate(item.to)}
            >
              <span className="td-pending-icon">
                <Icon size={17} />
              </span>
              <span>{item.label}</span>
              <strong>{loading ? '...' : formatNumber(item.value)}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MoneyItem({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: 'success' | 'error';
}) {
  return (
    <div className={`td-money-item td-money-item--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
  loading,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  loading?: boolean;
  tone: 'info' | 'error' | 'warning';
}) {
  return (
    <article className={`td-mini-metric td-mini-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </article>
  );
}

function CashflowLineChart({ data }: { data: MonthlyCashflowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="mois" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatAxisThousands} />
        <Tooltip formatter={formatChartCurrency} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)' }} />
        <Line
          type="monotone"
          dataKey="solde"
          name="Solde"
          stroke="#2563eb"
          strokeWidth={3}
          dot={{ r: 3, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function IncomeExpenseChart({ data }: { data: MonthlyCashflowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="mois" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatAxisThousands} />
        <Tooltip formatter={formatChartCurrency} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)' }} />
        <Bar dataKey="entrees" name="Entrées" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="sorties" name="Sorties" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ExpenseBreakdown({ data, total }: { data: ExpenseSlice[]; total: number }) {
  if (!data.length) {
    return (
      <div className="td-empty-chart">
        <strong>Aucune dépense ce mois-ci</strong>
        <span>Les sorties enregistrées apparaîtront ici.</span>
      </div>
    );
  }

  return (
    <div className="td-expense-breakdown">
      <div className="td-donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="montant"
              nameKey="categorie"
              cx="50%"
              cy="50%"
              outerRadius={92}
              innerRadius={58}
              paddingAngle={2}
            >
              {data.map((slice) => (
                <Cell key={slice.categorie} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={formatChartCurrency} />
          </PieChart>
        </ResponsiveContainer>
        <div className="td-donut-total">
          <span>Total</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </div>

      <ul className="td-expense-list">
        {data.map((slice) => (
          <li key={slice.categorie}>
            <span>
              <i style={{ background: slice.color }} />
              {slice.categorie}
            </span>
            <strong>{formatCurrency(slice.montant)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickLinks({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section className="td-card">
      <SectionHeader
        title="Actions rapides"
        subtitle="Accès direct aux opérations courantes du trésorier."
      />
      <div className="td-quick-grid">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <button
              type="button"
              key={link.to}
              className="td-quick-link"
              onClick={() => onNavigate(link.to)}
            >
              <span className="td-quick-icon">
                <Icon size={18} />
              </span>
              <span>
                <strong>{link.label}</strong>
                <small>{link.description}</small>
              </span>
              <ArrowRight size={15} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PendingRequestsList({
  requests,
  loading,
  onNavigate,
}: {
  requests: PendingRequest[];
  loading?: boolean;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="td-card">
      <SectionHeader
        title="Demandes à traiter"
        subtitle={`${formatNumber(requests.length)} demande${requests.length > 1 ? 's' : ''} en attente`}
      />

      {loading ? (
        <ListLoading label="Chargement des demandes..." />
      ) : requests.length ? (
        <div className="td-request-list">
          {requests.slice(0, 6).map((request) => (
            <button
              type="button"
              key={request.id}
              className="td-request-row"
              onClick={() => onNavigate(REQUEST_TYPE_ROUTE[request.type])}
            >
              <div>
                <strong>{request.adherent}</strong>
                <span>{request.reference} · {formatDate(request.dateDemande)}</span>
              </div>
              <StatusBadge
                status={request.type}
                tone={REQUEST_TYPE_TONE[request.type]}
                label={REQUEST_TYPE_LABEL[request.type]}
              />
              <b>{formatCurrency(request.montant)}</b>
            </button>
          ))}
        </div>
      ) : (
        <EmptyBlock title="Aucune demande en attente" text="Toutes les demandes visibles ont été traitées." />
      )}
    </section>
  );
}

function RecentOperationsList({
  operations,
  loading,
  onNavigate,
}: {
  operations: FinancialOperation[];
  loading?: boolean;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="td-card">
      <SectionHeader
        title="Dernières opérations"
        subtitle="Mouvements récents enregistrés sur le compte."
        action={(
          <Button variant="ghost" size="sm" onClick={() => onNavigate('/treasurer/historique')}>
            Voir tout
          </Button>
        )}
      />

      {loading ? (
        <ListLoading label="Chargement des opérations..." />
      ) : operations.length ? (
        <div className="td-operation-list">
          {operations.slice(0, 7).map((operation) => (
            <div className="td-operation-row" key={operation.id}>
              <div>
                <strong>{operation.description || operation.id}</strong>
                <span>{formatDate(operation.date)} · {PAYMENT_LABEL[operation.modePaiement]}</span>
              </div>
              <StatusBadge
                status={operation.type}
                tone={OP_TYPE_TONE[operation.type]}
                label={OP_TYPE_LABEL[operation.type]}
              />
              <b className={operation.montant >= 0 ? 'is-positive' : 'is-negative'}>
                {signedCurrency(operation.montant)}
              </b>
            </div>
          ))}
        </div>
      ) : (
        <EmptyBlock title="Aucune opération récente" text="Les mouvements enregistrés apparaîtront ici." />
      )}
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="td-section-header">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

function ListLoading({ label }: { label: string }) {
  return <div className="td-list-state">{label}</div>;
}

function EmptyBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="td-empty-block">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
