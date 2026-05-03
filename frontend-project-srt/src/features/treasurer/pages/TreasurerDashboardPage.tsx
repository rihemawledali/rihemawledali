/* ============================================
   Treasurer Dashboard — Trésorier
   Reuses shared layout primitives, StatCard, ChartCard, DataTable.
   ============================================ */

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, UserPlus, Banknote,
  HeartHandshake, Receipt, FileWarning, Eye, Check, X,
  PiggyBank, CreditCard, FileText, ShoppingCart, Download,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';

import { PageHeader } from '../../../components/layout/PageHeader';
import { StatCard } from '../../../components/charts/StatCard';
import { ChartCard } from '../../../components/charts/ChartCard';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatNumber, formatDate } from '../../../lib/formatters';

import { treasurerApi } from '../api/treasurerApi';
import type {
  PendingRequest, PendingRequestType, FinancialOperation,
} from '../api/treasurerMockData';
import '../../dashboard/pages/OverviewPage.css';

const REQUEST_TYPE_LABEL: Record<PendingRequestType, string> = {
  adhesion: 'Adhésion',
  pret_social: 'Prêt social',
  indemnite: 'Indemnité',
  bon_commande: 'Bon de commande',
};

const REQUEST_TYPE_TONE: Record<PendingRequestType, 'primary' | 'info' | 'success' | 'warning'> = {
  adhesion: 'primary',
  pret_social: 'info',
  indemnite: 'success',
  bon_commande: 'warning',
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

const PAIEMENT_LABEL: Record<FinancialOperation['modePaiement'], string> = {
  virement: 'Virement',
  cheque: 'Chèque',
  espece: 'Espèce',
  prelevement: 'Prélèvement',
};

export function TreasurerDashboardPage() {
  const navigate = useNavigate();

  const stats = useQuery({ queryKey: ['treasurer', 'stats'], queryFn: treasurerApi.getStats });
  const cashflow = useQuery({ queryKey: ['treasurer', 'cashflow'], queryFn: treasurerApi.getCashflow });
  const breakdown = useQuery({ queryKey: ['treasurer', 'breakdown'], queryFn: treasurerApi.getExpenseBreakdown });
  const requests = useQuery({ queryKey: ['treasurer', 'requests'], queryFn: treasurerApi.getPendingRequests });
  const operations = useQuery({ queryKey: ['treasurer', 'operations'], queryFn: treasurerApi.getRecentOperations });

  const [actionToast, setActionToast] = useState<string | null>(null);
  const fireQuickAction = (label: string) => {
    setActionToast(label);
    window.setTimeout(() => setActionToast(null), 2500);
  };

  // ---- Tables: columns ----
  const requestColumns: Column<PendingRequest>[] = useMemo(() => [
    {
      key: 'reference',
      header: 'Référence',
      cell: (r) => <span style={{ fontFamily: 'var(--font-family-mono, monospace)', fontWeight: 600 }}>{r.reference}</span>,
      width: '160px',
    },
    {
      key: 'adherent',
      header: 'Adhérent',
      cell: (r) => r.adherent,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (r) => (
        <StatusBadge
          status={r.type}
          tone={REQUEST_TYPE_TONE[r.type]}
          label={REQUEST_TYPE_LABEL[r.type]}
        />
      ),
      width: '160px',
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (r) => <strong>{formatCurrency(r.montant)}</strong>,
      align: 'right',
      width: '140px',
    },
    {
      key: 'date',
      header: 'Date',
      cell: (r) => formatDate(r.dateDemande),
      width: '140px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: () => <StatusBadge status="en_attente" />,
      width: '120px',
    },
  ], []);

  const operationColumns: Column<FinancialOperation>[] = useMemo(() => [
    {
      key: 'id',
      header: 'ID',
      cell: (o) => <span style={{ fontFamily: 'var(--font-family-mono, monospace)', fontWeight: 600 }}>{o.id}</span>,
      width: '120px',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (o) => (
        <StatusBadge
          status={o.type}
          tone={OP_TYPE_TONE[o.type]}
          label={OP_TYPE_LABEL[o.type]}
        />
      ),
      width: '120px',
    },
    {
      key: 'description',
      header: 'Description',
      cell: (o) => o.description,
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (o) => (
        <strong style={{ color: o.montant >= 0 ? 'var(--color-success-700)' : 'var(--color-error-700)' }}>
          {o.montant >= 0 ? '+' : '−'}{formatCurrency(Math.abs(o.montant))}
        </strong>
      ),
      align: 'right',
      width: '140px',
    },
    {
      key: 'date',
      header: 'Date',
      cell: (o) => formatDate(o.date),
      width: '130px',
    },
    {
      key: 'mode',
      header: 'Mode de paiement',
      cell: (o) => PAIEMENT_LABEL[o.modePaiement],
      width: '150px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (o) => <StatusBadge status={o.statut} />,
      width: '110px',
    },
  ], []);

  return (
    <div className="overview-page">
      <PageHeader
        title="Dashboard Trésorier"
        description="Suivi de la trésorerie, validation des demandes et opérations financières"
        breadcrumb={['Trésorerie', 'Tableau de bord']}
        actions={(
          <Button variant="secondary" onClick={() => fireQuickAction('Export PDF en préparation…')}>
            <Download size={16} style={{ marginRight: 6 }} />
            Exporter rapport PDF
          </Button>
        )}
      />

      {/* ---------- KPI cards ---------- */}
      <div className="overview-stats">
        <StatCard
          label="Solde actuel"
          value={stats.data ? formatCurrency(stats.data.soldeActuel) : '—'}
          icon={<Wallet size={22} />}
          tone="success"
          trend={stats.data?.trendSolde}
          loading={stats.isLoading}
        />
        <StatCard
          label="Entrées du mois"
          value={stats.data ? formatCurrency(stats.data.entreesMois) : '—'}
          icon={<ArrowDownToLine size={22} />}
          tone="success"
          trend={stats.data?.trendEntrees}
          loading={stats.isLoading}
        />
        <StatCard
          label="Sorties du mois"
          value={stats.data ? formatCurrency(stats.data.sortiesMois) : '—'}
          icon={<ArrowUpFromLine size={22} />}
          tone="error"
          trend={stats.data?.trendSorties}
          loading={stats.isLoading}
        />
        <StatCard
          label="Demandes d'adhésion en attente"
          value={stats.data ? formatNumber(stats.data.demandesAdhesion) : '—'}
          icon={<UserPlus size={22} />}
          tone="warning"
          loading={stats.isLoading}
        />
        <StatCard
          label="Prêts sociaux à valider"
          value={stats.data ? formatNumber(stats.data.pretsAValider) : '—'}
          icon={<Banknote size={22} />}
          tone="warning"
          loading={stats.isLoading}
        />
        <StatCard
          label="Indemnités à traiter"
          value={stats.data ? formatNumber(stats.data.indemnitesATraiter) : '—'}
          icon={<HeartHandshake size={22} />}
          tone="warning"
          loading={stats.isLoading}
        />
        <StatCard
          label="Retenues générées"
          value={stats.data ? formatNumber(stats.data.retenuesGenerees) : '—'}
          icon={<Receipt size={22} />}
          tone="info"
          loading={stats.isLoading}
        />
        <StatCard
          label="Factures impayées"
          value={stats.data ? formatNumber(stats.data.facturesImpayees) : '—'}
          icon={<FileWarning size={22} />}
          tone="error"
          loading={stats.isLoading}
        />
      </div>

      {/* ---------- Charts row 1 ---------- */}
      <div className="overview-charts-row">
        <ChartCard
          title="Évolution de la trésorerie"
          subtitle="Solde mensuel sur les 12 derniers mois"
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashflow.data ?? []} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
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
              <Line
                type="monotone"
                dataKey="solde"
                name="Solde"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Répartition des dépenses"
          subtitle="Mois courant, par catégorie"
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown.data ?? []}
                dataKey="montant"
                nameKey="categorie"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {(breakdown.data ?? []).map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ---------- Charts row 2 ---------- */}
      <ChartCard
        title="Entrées vs sorties mensuelles"
        subtitle="Comparaison sur les 12 derniers mois"
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

      {/* ---------- Quick actions ---------- */}
      <section className="chart-card">
        <header className="chart-card-header">
          <div>
            <h3>Actions rapides</h3>
            <p>Opérations courantes du trésorier</p>
          </div>
        </header>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Button onClick={() => fireQuickAction('Génération des retenues mensuelles…')}>
            <Receipt size={16} style={{ marginRight: 6 }} />
            Générer les retenues mensuelles
          </Button>
          <Button variant="secondary" onClick={() => fireQuickAction('Nouveau paiement enregistré')}>
            <CreditCard size={16} style={{ marginRight: 6 }} />
            Enregistrer un paiement
          </Button>
          <Button variant="secondary" onClick={() => fireQuickAction('Nouvelle facture')}>
            <FileText size={16} style={{ marginRight: 6 }} />
            Ajouter une facture
          </Button>
          <Button variant="secondary" onClick={() => fireQuickAction('Validation prêt social')}>
            <Banknote size={16} style={{ marginRight: 6 }} />
            Valider un prêt social
          </Button>
          <Button variant="secondary" onClick={() => fireQuickAction('Validation indemnité')}>
            <HeartHandshake size={16} style={{ marginRight: 6 }} />
            Valider une indemnité
          </Button>
          <Button variant="ghost" onClick={() => navigate('/treasurer/tresorerie')}>
            <PiggyBank size={16} style={{ marginRight: 6 }} />
            Consulter la trésorerie
          </Button>
          <Button variant="ghost" onClick={() => fireQuickAction('Bon de commande en cours…')}>
            <ShoppingCart size={16} style={{ marginRight: 6 }} />
            Bon de commande
          </Button>
        </div>
        {actionToast && (
          <div
            style={{
              marginTop: 'var(--space-4)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-50)',
              color: 'var(--color-primary-700)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
            }}
          >
            {actionToast}
          </div>
        )}
      </section>

      {/* ---------- Demandes à traiter ---------- */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              Demandes à traiter
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              {requests.data?.length ?? 0} demande{(requests.data?.length ?? 0) > 1 ? 's' : ''} en attente de validation
            </p>
          </div>
        </header>
        <DataTable
          columns={requestColumns}
          rows={requests.data ?? []}
          loading={requests.isLoading}
          rowKey={(r) => r.id}
          emptyTitle="Aucune demande à traiter"
          emptyDescription="Toutes les demandes ont été traitées. Bon travail !"
          rowActions={(r) => (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => fireQuickAction(`Détails ${r.reference}`)}>
                <Eye size={14} />
              </Button>
              <Button variant="primary" size="sm" onClick={() => fireQuickAction(`${r.reference} validé`)}>
                <Check size={14} />
              </Button>
              <Button variant="danger" size="sm" onClick={() => fireQuickAction(`${r.reference} rejeté`)}>
                <X size={14} />
              </Button>
            </div>
          )}
        />
      </section>

      {/* ---------- Dernières opérations financières ---------- */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              Dernières opérations financières
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              Mouvements récents enregistrés sur le compte de l'Amicale
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/treasurer/historique')}>
            Voir l'historique complet
          </Button>
        </header>
        <DataTable
          columns={operationColumns}
          rows={operations.data ?? []}
          loading={operations.isLoading}
          rowKey={(o) => o.id}
          emptyTitle="Aucune opération récente"
          emptyDescription="Les opérations enregistrées apparaîtront ici."
        />
      </section>
    </div>
  );
}
