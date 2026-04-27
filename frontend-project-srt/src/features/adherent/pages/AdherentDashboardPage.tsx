/* ============================================
   Adherent Dashboard — Refined design
   ============================================ */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote, BadgeCheck, HeartHandshake, Tag, ArrowUpRight, Wallet,
  HandCoins, ChevronRight, TrendingUp, Handshake,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DataTable } from '../../../components/data/DataTable';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { dashboardApi } from '../api/dashboardApi';
import type { HistoriqueFinanciere } from '../../../types/domain';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

const fmtTND = (v: number) =>
  v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' TND';

export function AdherentDashboardPage() {
  const navigate = useNavigate();
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['adherent-dashboard'],
    queryFn: () => dashboardApi.getDashboard(),
  });

  const handleQuickAction = async (action: string, path: string) => {
    setQuickActionLoading(action);
    await new Promise((r) => setTimeout(r, 150));
    setQuickActionLoading(null);
    navigate(path);
  };

  const historiqueColumns = [
    {
      key: 'date',
      header: 'Date',
      cell: (h: HistoriqueFinanciere) => new Date(h.date).toLocaleDateString('fr-FR'),
      width: '120px',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (h: HistoriqueFinanciere) => <StatusBadge status={h.type} />,
      width: '150px',
    },
    {
      key: 'description',
      header: 'Description',
      cell: (h: HistoriqueFinanciere) => h.description,
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (h: HistoriqueFinanciere) => (
        <span style={{
          color: h.montant > 0 ? '#15803d' : '#b91c1c',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {h.montant > 0 ? '+' : ''}{h.montant.toFixed(2)} TND
        </span>
      ),
      align: 'right' as const,
      width: '140px',
    },
  ];

  if (isLoading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 116, borderRadius: 14, marginBottom: 20 }} />
        <div className="adh-stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))}
        </div>
        <div className="adh-dashboard-grid">
          <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  const profile = dashboard?.profile;
  const adhesion = dashboard?.adhesion;
  const activeLoan = dashboard?.activeLoan;
  const initials = `${profile?.prenom?.[0] || ''}${profile?.nom?.[0] || ''}`.toUpperCase();
  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      {/* ---- Hero (refined: clean card, no blurry blobs) ---- */}
      <section className="adh-hero">
        <div className="adh-hero-grid">
          <div className="adh-hero-text">
            <div className="adh-hero-avatar">{initials || 'A'}</div>
            <div style={{ minWidth: 0 }}>
              <div className="adh-hero-meta">
                <span>{todayLabel}</span>
                <span className="adh-hero-meta-dot" />
                <span>Espace adhérent</span>
              </div>
              <h1 className="adh-hero-title">
                {getGreeting()}, {profile?.prenom || 'Adhérent'}
              </h1>
              <p className="adh-hero-sub">
                Voici un aperçu de votre activité — demandes, paiements et avantages.
              </p>
            </div>
          </div>

          <div className="adh-hero-stats">
            <div className="adh-hero-stat">
              <span className="adh-hero-stat-label">Matricule</span>
              <span className="adh-hero-stat-value">{profile?.matricule || '—'}</span>
            </div>
            <div className="adh-hero-stat">
              <span className="adh-hero-stat-label">Adhésion</span>
              <span className="adh-hero-stat-value">
                {adhesion?.statut === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="adh-hero-stat">
              <span className="adh-hero-stat-label">Salaire</span>
              <span className="adh-hero-stat-value">
                {profile?.salaire ? fmtTND(profile.salaire) : '—'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- KPI tiles ---- */}
      <div className="adh-stats-grid">
        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-primary"><Wallet size={18} /></div>
            <span className="adh-tile-label">Cotisation mensuelle</span>
          </div>
          <div className="adh-tile-value">
            {adhesion?.montantCotisation ? fmtTND(adhesion.montantCotisation) : '—'}
          </div>
          <span className="adh-tile-meta">Retenue automatique sur salaire</span>
        </div>

        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-info"><Banknote size={18} /></div>
            <span className="adh-tile-label">Prêt actif</span>
          </div>
          <div className="adh-tile-value">
            {activeLoan ? fmtTND(activeLoan.montant) : 'Aucun'}
          </div>
          <span className="adh-tile-meta">
            {activeLoan ? `${activeLoan.duree} mois · ${activeLoan.taux}%` : 'Pas de prêt en cours'}
          </span>
        </div>

        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-warning"><HeartHandshake size={18} /></div>
            <span className="adh-tile-label">Indemnités</span>
            {dashboard?.pendingIndemnities ? (
              <span className="adh-tile-trend">{dashboard.pendingIndemnities} en attente</span>
            ) : null}
          </div>
          <div className="adh-tile-value">{dashboard?.pendingIndemnities ?? 0}</div>
          <span className="adh-tile-meta">Demandes à traiter par l'administration</span>
        </div>

        <div className="adh-tile">
          <div className="adh-tile-head">
            <div className="adh-tile-icon tone-violet"><Tag size={18} /></div>
            <span className="adh-tile-label">Offres disponibles</span>
          </div>
          <div className="adh-tile-value">{dashboard?.availableOffers ?? 0}</div>
          <span className="adh-tile-meta">Bons & tickets attribués</span>
        </div>
      </div>

      {/* ---- Two-column: actions + chart ---- */}
      <div className="adh-dashboard-grid">
        <section className="adh-card">
          <div className="adh-card-header">
            <h3 className="adh-card-title">Actions rapides</h3>
            <span className="adh-card-subtitle">Demandes courantes</span>
          </div>
          <div className="adh-actions-list">
            <ActionRow
              icon={<Banknote size={18} />} tone="primary"
              title="Demander un prêt social" subtitle="Financement à taux réduit"
              onClick={() => handleQuickAction('pret', '/adherent/prets')}
              loading={quickActionLoading === 'pret'}
            />
            <ActionRow
              icon={<HeartHandshake size={18} />} tone="success"
              title="Demander une indemnité" subtitle="Maladie, naissance, mariage…"
              onClick={() => handleQuickAction('indemnite', '/adherent/indemnites')}
              loading={quickActionLoading === 'indemnite'}
            />
            <ActionRow
              icon={<Handshake size={18} />} tone="violet"
              title="Adhérer à une convention" subtitle="Partenaires & avantages"
              onClick={() => handleQuickAction('conv', '/adherent/conventions')}
              loading={quickActionLoading === 'conv'}
            />
            <ActionRow
              icon={<HandCoins size={18} />} tone="warning"
              title="Mes bons & tickets" subtitle="Bons et tickets attribués"
              onClick={() => handleQuickAction('offres', '/adherent/offres')}
              loading={quickActionLoading === 'offres'}
            />
            <ActionRow
              icon={<BadgeCheck size={18} />} tone="info"
              title="Renouveler mon adhésion" subtitle="Prolonger pour 12 mois"
              onClick={() => handleQuickAction('adhesion', '/adherent/adhesion')}
              loading={quickActionLoading === 'adhesion'}
            />
          </div>
        </section>

        <section className="adh-card">
          <div className="adh-card-header">
            <h3 className="adh-card-title">
              <TrendingUp size={16} /> Évolution du solde
            </h3>
            <span className="adh-card-subtitle">6 derniers mois</span>
          </div>
          <div style={{ height: 260, width: '100%', marginLeft: -8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dashboard?.financialChart || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="adhSoldeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#e6e9f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8a92a6', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tick={{ fill: '#8a92a6', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e6e9f0',
                    borderRadius: 10,
                    fontSize: 12,
                    boxShadow: '0 6px 16px -8px rgba(15, 23, 42, 0.10)',
                    padding: '8px 12px',
                  }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                  formatter={(v: number) => [`${v.toLocaleString('fr-FR')} TND`, 'Solde']}
                />
                <Area
                  type="monotone"
                  dataKey="solde"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#adhSoldeGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#2563eb', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* ---- Recent activity ---- */}
      <section className="adh-card">
        <div className="adh-card-header">
          <h3 className="adh-card-title">Activité récente</h3>
          <Button variant="secondary" size="sm" onClick={() => navigate('/adherent/historique')}>
            Voir tout <ArrowUpRight size={14} style={{ marginLeft: 4 }} />
          </Button>
        </div>
        <DataTable
          columns={historiqueColumns}
          rows={dashboard?.recentHistory || []}
          rowKey={(h) => h.id}
          emptyTitle="Aucune opération"
          emptyDescription="Votre historique est vide pour le moment."
        />
      </section>
    </div>
  );
}

interface ActionRowProps {
  icon: React.ReactNode;
  tone: 'primary' | 'success' | 'warning' | 'violet' | 'info';
  title: string;
  subtitle: string;
  onClick: () => void;
  loading?: boolean;
}
function ActionRow({ icon, tone, title, subtitle, onClick, loading }: ActionRowProps) {
  return (
    <button className="adh-action-row" onClick={onClick} disabled={loading}>
      <span className={`adh-action-icon tone-${tone}`}>{icon}</span>
      <span className="adh-action-text">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </span>
      <ChevronRight size={16} className="adh-action-arrow" />
    </button>
  );
}
