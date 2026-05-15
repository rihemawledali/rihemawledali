/* ============================================
   Admin - Demandes d'adhesion
   ============================================ */

import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Calendar,
  Check,
  Clock3,
  DollarSign,
  Eye,
  Hash,
  Mail,
  User as UserIcon,
  UserPlus,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { DataTable, type Column } from '../../../shared/data/DataTable';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../shared/data/FilterBar';
import { Pagination } from '../../../shared/data/Pagination';
import { ConfirmDialog } from '../../../shared/data/ConfirmDialog';
import { Modal } from '../../../shared/data/Modal';
import { useToast } from '../../../shared/feedback/useToast';
import { formatCurrency, formatDate, formatNumber } from '../../../shared/lib/formatters';
import { adminAdhesionsApi, type AdhesionRow } from './api';
import '../../../shared/layout/CrudPage.css';
import './AdminDemandesAdhesionPage.css';

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'active', label: 'Active' },
  { value: 'rejetee', label: 'Rejetée' },
  { value: 'expiree', label: 'Expirée' },
  { value: 'suspendue', label: 'Suspendue' },
];

export function AdminDemandesAdhesionPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [rejecting, setRejecting] = useState<AdhesionRow | null>(null);
  const [viewing, setViewing] = useState<AdhesionRow | null>(null);

  const all = useQuery({
    queryKey: ['admin', 'adhesions', 'all'],
    queryFn: () => adminAdhesionsApi.list({ page: 1, size: 1000 }),
  });

  const query = useQuery({
    queryKey: ['admin', 'adhesions', { page, search, statut }],
    queryFn: () =>
      adminAdhesionsApi.list({ page, size: 10, search, filters: { statut } }),
  });

  const valider = useMutation({
    mutationFn: (id: string) => adminAdhesionsApi.valider(id),
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['admin', 'adhesions'] });
      toast.push({ title: `Adhésion ${a.id.toUpperCase()} validée`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const rejeter = useMutation({
    mutationFn: (id: string) => adminAdhesionsApi.rejeter(id),
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['admin', 'adhesions'] });
      setRejecting(null);
      toast.push({ title: `Adhésion ${a.id.toUpperCase()} rejetée`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const stats = useMemo(() => {
    const items = all.data?.items ?? [];
    const active = items.filter((a) => a.statut === 'active');

    return {
      total: items.length,
      pending: items.filter((a) => a.statut === 'en_attente').length,
      active: active.length,
      rejected: items.filter((a) => a.statut === 'rejetee').length,
      monthlyCotisations: active.reduce((sum, a) => sum + a.montantCotisation, 0),
    };
  }, [all.data]);

  const columns: Column<AdhesionRow>[] = useMemo(() => [
    {
      key: 'reference',
      header: 'Référence',
      cell: (a) => (
        <div className="adhesion-reference-cell">
          <span className="cell-mono">{a.id.toUpperCase()}</span>
          <span>{a.createdAt ? formatDate(a.createdAt) : 'Date non renseignée'}</span>
        </div>
      ),
      width: '170px',
    },
    {
      key: 'adherentNom',
      header: 'Adhérent',
      cell: (a) => (
        <div className="adhesion-member-cell">
          <span className="adhesion-member-avatar" aria-hidden="true">
            {getInitials(a.adherentNom)}
          </span>
          <div>
            <strong className="cell-strong">{a.adherentNom}</strong>
            <span>
              {a.adherentMatricule ? `Mat. ${a.adherentMatricule}` : a.adherentEmail ?? 'Contact non renseigné'}
            </span>
          </div>
        </div>
      ),
      width: '260px',
    },
    {
      key: 'periode',
      header: 'Période',
      cell: (a) => (
        <div className="adhesion-period-cell">
          <span>{formatDate(a.dateDebut)}</span>
          <span>au {formatDate(a.dateFin)}</span>
        </div>
      ),
      width: '180px',
    },
    {
      key: 'cotisation',
      header: 'Cotisation',
      cell: (a) => <strong className="amount">{formatCurrency(a.montantCotisation)}</strong>,
      align: 'right',
      width: '140px',
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (a) => <StatusBadge status={a.statut} />,
      width: '130px',
    },
  ], []);

  const rows = query.data?.items ?? [];
  const visiblePending = rows.filter((a) => a.statut === 'en_attente').length;

  return (
    <div className="admin-adhesions-page">
      <PageHeader
        title="Demandes d’adhésion"
        description="Contrôler les nouvelles demandes, activer les comptes et suivre les cotisations."
        breadcrumb={['Administration', 'Demandes', 'Adhésions']}
      />

      <section className="adhesion-stats-grid" aria-label="Résumé des demandes d'adhésion">
        <SummaryCard
          icon={<Clock3 size={20} />}
          label="À traiter"
          value={all.isLoading ? '...' : formatNumber(stats.pending)}
          tone="warning"
        />
        <SummaryCard
          icon={<Users size={20} />}
          label="Adhésions actives"
          value={all.isLoading ? '...' : formatNumber(stats.active)}
          tone="success"
        />
        <SummaryCard
          icon={<WalletCards size={20} />}
          label="Cotisations mensuelles"
          value={all.isLoading ? '...' : formatCurrency(stats.monthlyCotisations)}
          tone="primary"
        />
        <SummaryCard
          icon={<UserPlus size={20} />}
          label="Total demandes"
          value={all.isLoading ? '...' : formatNumber(stats.total)}
          meta={stats.rejected ? `${formatNumber(stats.rejected)} rejetée(s)` : 'Aucun rejet'}
          tone="info"
        />
      </section>

      <section className="adhesion-workspace">
        <div className="adhesion-workspace-header">
          <div>
            <h2>Liste des demandes</h2>
            <p>
              {visiblePending > 0
                ? `${formatNumber(visiblePending)} demande(s) en attente sur cette page.`
                : 'Aucune décision urgente dans la liste affichée.'}
            </p>
          </div>
          <StatusBadge
            status="en_attente"
            tone={visiblePending > 0 ? 'warning' : 'neutral'}
            label={`${formatNumber(visiblePending)} en attente`}
          />
        </div>

        <div className="crud-toolbar adhesion-toolbar">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Rechercher par nom, matricule, email..."
            />
            <SelectFilter
              label="Statut"
              value={statut}
              onChange={(v) => { setStatut(v); setPage(1); }}
              options={STATUS_OPTIONS}
            />
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={query.isLoading}
          rowKey={(a) => a.id}
          emptyTitle="Aucune demande d’adhésion"
          emptyDescription="Essayez un autre statut ou une autre recherche."
          actionsWidth="285px"
          rowActions={(a) => {
            const pending = a.statut === 'en_attente';

            return (
              <span className="adhesion-row-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewing(a)}
                  aria-label={`Voir la demande de ${a.adherentNom}`}
                  title="Voir les détails de l'adhérent et de la demande"
                >
                  <Eye size={14} /> Détails
                </Button>
                {pending && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => valider.mutate(a.id)}
                      disabled={valider.isPending || rejeter.isPending}
                      isLoading={valider.isPending && valider.variables === a.id}
                      aria-label={`Accepter la demande de ${a.adherentNom}`}
                      title="Accepter la demande"
                    >
                      <Check size={14} /> Accepter
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRejecting(a)}
                      disabled={valider.isPending || rejeter.isPending}
                      aria-label={`Rejeter la demande de ${a.adherentNom}`}
                      title="Rejeter la demande"
                    >
                      <X size={14} /> Rejeter
                    </Button>
                  </>
                )}
              </span>
            );
          }}
        />

        {query.data && query.data.total > 0 && (
          <div className="data-table-card adhesion-pagination">
            <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!rejecting}
        title="Rejeter cette demande d’adhésion ?"
        message={`La demande de ${rejecting?.adherentNom ?? ''} (${formatCurrency(rejecting?.montantCotisation ?? 0)}) sera marquée comme rejetée.`}
        confirmLabel="Rejeter"
        destructive
        loading={rejeter.isPending}
        onCancel={() => setRejecting(null)}
        onConfirm={() => rejecting && rejeter.mutate(rejecting.id)}
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Dossier d'adhésion - ${viewing.adherentNom}` : ''}
        description="Vérifier la demande avant de l'accepter ou de la rejeter."
        size="lg"
        footer={viewing && viewing.statut === 'en_attente' ? (
          <div className="adhesion-modal-actions">
            <Button variant="secondary" onClick={() => setViewing(null)}>Fermer</Button>
            <Button
              variant="danger"
              onClick={() => { const a = viewing; setViewing(null); setRejecting(a); }}
              disabled={valider.isPending || rejeter.isPending}
            >
              <X size={14} /> Rejeter
            </Button>
            <Button
              variant="primary"
              onClick={() => { if (viewing) { valider.mutate(viewing.id); setViewing(null); } }}
              disabled={valider.isPending || rejeter.isPending}
              isLoading={valider.isPending && valider.variables === viewing.id}
            >
              <Check size={14} /> Valider et activer le compte
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setViewing(null)}>Fermer</Button>
        )}
      >
        {viewing && (
          <div className="adhesion-detail">
            <section className="adhesion-detail-header">
              <div className="adhesion-detail-person">
                <span className="adhesion-member-avatar adhesion-member-avatar--xl" aria-hidden="true">
                  {getInitials(viewing.adherentNom)}
                </span>
                <div>
                  <span className="adhesion-detail-eyebrow">Demande d'adhésion</span>
                  <h3>{viewing.adherentNom}</h3>
                  <div className="adhesion-detail-chips">
                    <span className="adhesion-soft-chip">
                      <Hash size={13} /> {viewing.id.toUpperCase()}
                    </span>
                    {viewing.adherentMatricule && (
                      <span className="adhesion-soft-chip">
                        <UserIcon size={13} /> Mat. {viewing.adherentMatricule}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <StatusBadge status={viewing.statut} />
            </section>

            <section className="adhesion-detail-metrics" aria-label="Informations principales">
              <DetailMetric icon={<Calendar size={16} />} label="Soumise le" value={viewing.createdAt ? formatDate(viewing.createdAt) : 'Non renseigné'} />
              <DetailMetric icon={<BadgeCheck size={16} />} label="Compte" value={viewing.adherentStatut ?? 'Non renseigné'} tone={viewing.adherentStatut === 'ACTIF' ? 'success' : 'warning'} />
              <DetailMetric icon={<DollarSign size={16} />} label="Cotisation" value={formatCurrency(viewing.montantCotisation)} tone="primary" />
            </section>

            <div className="adhesion-detail-layout">
              <DetailPanel title="Identité adhérent" icon={<UserIcon size={16} />}>
                <DetailField label="Nom complet" value={<strong>{viewing.adherentNom}</strong>} />
                <DetailField label="Matricule" value={viewing.adherentMatricule || 'Non renseigné'} />
                <DetailField
                  label="État du compte"
                  value={
                    <span className={viewing.adherentStatut === 'ACTIF' ? 'adhesion-account-active' : 'adhesion-account-pending'}>
                      {viewing.adherentStatut ?? 'Non renseigné'}
                    </span>
                  }
                />
              </DetailPanel>

              <DetailPanel title="Coordonnées" icon={<Mail size={16} />}>
                <DetailField
                  label="Email"
                  value={viewing.adherentEmail ? <a href={`mailto:${viewing.adherentEmail}`}>{viewing.adherentEmail}</a> : 'Non renseigné'}
                />
                <DetailField
                  label="Téléphone"
                  value={viewing.adherentTelephone ? <a href={`tel:${viewing.adherentTelephone}`}>{viewing.adherentTelephone}</a> : 'Non renseigné'}
                />
              </DetailPanel>

              <DetailPanel title="Adhésion demandée" icon={<BadgeCheck size={16} />} wide>
                <DetailField label="Référence" value={<span className="cell-mono">{viewing.id.toUpperCase()}</span>} />
                <DetailField label="Statut" value={<StatusBadge status={viewing.statut} />} />
                <DetailField label="Date de début" value={formatDate(viewing.dateDebut)} />
                <DetailField label="Date de fin" value={formatDate(viewing.dateFin)} />
                <DetailField label="Cotisation mensuelle" value={<strong>{formatCurrency(viewing.montantCotisation)}</strong>} />
              </DetailPanel>
            </div>

            {viewing.statut === 'en_attente' && (
              <div className="adhesion-decision-note">
                <BadgeCheck size={18} />
                <p>
                  En validant, le compte de l'adhérent passera à <strong>ACTIF</strong>,
                  l'adhésion deviendra <strong>active</strong> et la cotisation mensuelle de{' '}
                  <strong>{formatCurrency(viewing.montantCotisation)}</strong> sera prélevée sur sa paie.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SummaryCard({
  icon,
  label,
  value,
  meta,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  meta?: string;
  tone: 'warning' | 'success' | 'primary' | 'info';
}) {
  return (
    <article className={`adhesion-summary-card adhesion-summary-card--${tone}`}>
      <span className="adhesion-summary-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {meta && <span>{meta}</span>}
      </div>
    </article>
  );
}

function DetailMetric({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'primary';
}) {
  return (
    <div className={`adhesion-detail-metric adhesion-detail-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function DetailPanel({
  title,
  icon,
  children,
  wide = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`adhesion-detail-panel ${wide ? 'adhesion-detail-panel--wide' : ''}`}>
      <header>
        <span>{icon}</span>
        <h4>{title}</h4>
      </header>
      <div className="adhesion-detail-list">{children}</div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="adhesion-detail-field">
      <div className="adhesion-detail-label">{label}</div>
      <div className="adhesion-detail-value">{value}</div>
    </div>
  );
}
