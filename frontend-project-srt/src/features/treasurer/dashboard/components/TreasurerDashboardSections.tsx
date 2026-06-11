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
import { Button } from '../../../../shared/ui/Button';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { formatCurrency, formatDate, formatNumber } from '../../../../shared/lib/formatters';
import type {
  ExpenseSlice,
  FinancialOperation,
  MonthlyCashflowPoint,
  PendingRequest,
  PendingRequestType,
  TreasurerStats,
} from '../model';

const REQUEST_TYPE_LABEL: Record<PendingRequestType, string> = {
  pret_social: 'Pret social',
  indemnite: 'Indemnite',
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
  entree: 'Entree',
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
  espece: 'Espèces',
};

const QUICK_LINKS = [
  { label: 'Generer retenues', description: 'Preparer les retenues mensuelles', to: '/treasurer/retenues', icon: Receipt },
  { label: 'Nouveau paiement', description: 'Enregistrer un reglement', to: '/treasurer/paiements', icon: CreditCard },
  { label: 'Ajouter facture', description: 'Suivre une facture fournisseur', to: '/treasurer/factures', icon: FileText },
  { label: 'Valider pret', description: 'Traiter les prets sociaux', to: '/treasurer/prets', icon: Banknote },
  { label: 'Valider indemnite', description: 'Traiter les indemnites', to: '/treasurer/indemnites', icon: HeartHandshake },
  { label: 'Tresorerie', description: 'Consulter les comptes', to: '/treasurer/tresorerie', icon: PiggyBank },
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

export function TreasuryHealthPanel({
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
          <span className="td-eyebrow">Sante financiere</span>
          <h2>Solde disponible</h2>
        </div>
        <span className="td-panel-icon td-panel-icon--success">
          <Wallet size={22} />
        </span>
      </div>

      <strong className="td-balance-value">
        {loading ? '...' : stats ? formatCurrency(stats.soldeActuel) : '-'}
      </strong>

      <div className="td-money-grid">
        <MoneyItem icon={<ArrowDownToLine size={16} />} label="Entrees du mois" value={stats ? formatCurrency(stats.entreesMois) : '-'} tone="success" />
        <MoneyItem icon={<ArrowUpFromLine size={16} />} label="Sorties du mois" value={stats ? formatCurrency(stats.sortiesMois) : '-'} tone="error" />
        <MoneyItem icon={<PiggyBank size={16} />} label="Mouvement net" value={stats ? signedCurrency(netMovement) : '-'} tone={netMovement >= 0 ? 'success' : 'error'} />
      </div>
    </section>
  );
}

export function PendingWorkPanel({
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
    { label: 'Prets sociaux', value: stats?.pretsAValider ?? 0, to: '/treasurer/prets', icon: Banknote },
    { label: 'Indemnites', value: stats?.indemnitesATraiter ?? 0, to: '/treasurer/indemnites', icon: HeartHandshake },
    { label: 'Factures', value: stats?.facturesImpayees ?? 0, to: '/treasurer/factures', icon: FileWarning },
  ];

  return (
    <section className="td-panel">
      <div className="td-panel-header">
        <div>
          <span className="td-eyebrow">Travail en attente</span>
          <h2>{loading ? '...' : formatNumber(total)} decisions a suivre</h2>
        </div>
        <StatusBadge status="en_attente" tone={total > 0 ? 'warning' : 'neutral'} label={total > 0 ? 'A traiter' : 'A jour'} />
      </div>

      <div className="td-pending-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button type="button" key={item.label} className="td-pending-item" onClick={() => onNavigate(item.to)}>
              <span className="td-pending-icon"><Icon size={17} /></span>
              <span>{item.label}</span>
              <strong>{loading ? '...' : formatNumber(item.value)}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function MiniMetric({
  icon,
  label,
  value,
  loading,
  tone,
}: any) {
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

export function CashflowLineChart({ data }: { data: MonthlyCashflowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="mois" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatAxisThousands} />
        <Tooltip formatter={formatChartCurrency} wrapperClassName="td-chart-tooltip" />
        <Line type="monotone" dataKey="solde" name="Solde" stroke="#2563eb" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseChart({ data }: { data: MonthlyCashflowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="mois" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatAxisThousands} />
        <Tooltip formatter={formatChartCurrency} wrapperClassName="td-chart-tooltip" />
        <Bar dataKey="entrees" name="Entrees" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="sorties" name="Sorties" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpenseBreakdown({ data, total }: { data: ExpenseSlice[]; total: number }) {
  if (!data.length) {
    return <EmptyBlock title="Aucune depense ce mois-ci" text="Les sorties enregistrees apparaitront ici." />;
  }

  return (
    <div className="td-expense-breakdown">
      <div className="td-donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="montant" nameKey="categorie" cx="50%" cy="50%" outerRadius={92} innerRadius={58} paddingAngle={2}>
              {data.map((slice) => <Cell key={slice.categorie} fill={slice.color} />)}
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
        {data.map((slice, index) => (
          <li key={slice.categorie}>
            <span><i className={`td-expense-dot td-expense-dot--${index + 1}`} />{slice.categorie}</span>
            <strong>{formatCurrency(slice.montant)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuickLinks({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section className="td-card">
      <SectionHeader title="Actions rapides" subtitle="Acces direct aux operations courantes du tresorier." />
      <div className="td-quick-grid">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <button type="button" key={link.to} className="td-quick-link" onClick={() => onNavigate(link.to)}>
              <span className="td-quick-icon"><Icon size={18} /></span>
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

export function PendingRequestsList({
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
      <SectionHeader title="Demandes a traiter" subtitle={`${formatNumber(requests.length)} demande${requests.length > 1 ? 's' : ''} en attente`} />

      {loading ? (
        <ListLoading label="Chargement des demandes..." />
      ) : requests.length ? (
        <div className="td-request-list">
          {requests.slice(0, 6).map((request) => (
            <button type="button" key={request.id} className="td-request-row" onClick={() => onNavigate(REQUEST_TYPE_ROUTE[request.type])}>
              <div>
                <strong>{request.adherent}</strong>
                <span>{request.reference} - {formatDate(request.dateDemande)}</span>
              </div>
              <StatusBadge status={request.type} tone={REQUEST_TYPE_TONE[request.type]} label={REQUEST_TYPE_LABEL[request.type]} />
              <b>{formatCurrency(request.montant)}</b>
            </button>
          ))}
        </div>
      ) : (
        <EmptyBlock title="Aucune demande en attente" text="Toutes les demandes visibles ont ete traitees." />
      )}
    </section>
  );
}

export function RecentOperationsList({
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
        title="Dernieres operations"
        subtitle="Mouvements recents enregistres sur le compte."
        action={<Button variant="ghost" size="sm" onClick={() => onNavigate('/treasurer/historique')}>Voir tout</Button>}
      />

      {loading ? (
        <ListLoading label="Chargement des operations..." />
      ) : operations.length ? (
        <div className="td-operation-list">
          {operations.slice(0, 7).map((operation) => (
            <div className="td-operation-row" key={operation.id}>
              <div>
                <strong>{operation.description || operation.id}</strong>
                <span>{formatDate(operation.date)} - {PAYMENT_LABEL[operation.modePaiement]}</span>
              </div>
              <StatusBadge status={operation.type} tone={OP_TYPE_TONE[operation.type]} label={OP_TYPE_LABEL[operation.type]} />
              <b className={operation.montant >= 0 ? 'is-positive' : 'is-negative'}>
                {signedCurrency(operation.montant)}
              </b>
            </div>
          ))}
        </div>
      ) : (
        <EmptyBlock title="Aucune operation recente" text="Les mouvements enregistres apparaitront ici." />
      )}
    </section>
  );
}

function MoneyItem({
  icon,
  label,
  value,
  tone,
}: any) {
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

function SectionHeader({
  title,
  subtitle,
  action,
}: any) {
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
