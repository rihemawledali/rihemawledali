import { useState } from 'react';
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

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'active', label: 'Active' },
  { value: 'rejetee', label: 'Rejetée' },
  { value: 'expiree', label: 'Expirée' },
  { value: 'suspendue', label: 'Suspendue' },
];

export function AdminDemandesAdhesionPage() {
  const queryClient = useQueryClient();
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
    queryFn: () => adminAdhesionsApi.list({ page, size: PAGE_SIZE, search, filters: { statut } }),
  });

  const valider = useMutation({
    mutationFn: (id: string) => adminAdhesionsApi.valider(id),
    onSuccess: (adhesion) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'adhesions'] });
      toast.push({ title: `Adhésion ${adhesion.id.toUpperCase()} validée`, variant: 'success' });
    },
    onError: (error) => toast.push({ title: getErrorMessage(error), variant: 'error' }),
  });

  const rejeter = useMutation({
    mutationFn: (id: string) => adminAdhesionsApi.rejeter(id),
    onSuccess: (adhesion) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'adhesions'] });
      setRejecting(null);
      toast.push({ title: `Adhésion ${adhesion.id.toUpperCase()} rejetée`, variant: 'success' });
    },
    onError: (error) => toast.push({ title: getErrorMessage(error), variant: 'error' }),
  });

  const allItems = all.data?.items ?? [];
  const activeItems = allItems.filter((adhesion) => adhesion.statut === 'active');
  const stats = {
    total: allItems.length,
    pending: allItems.filter((adhesion) => adhesion.statut === 'en_attente').length,
    active: activeItems.length,
    rejected: allItems.filter((adhesion) => adhesion.statut === 'rejetee').length,
    monthlyCotisations: activeItems.reduce((sum, adhesion) => sum + adhesion.montantCotisation, 0),
  };

  const rows = query.data?.items ?? [];
  const visiblePending = rows.filter((adhesion) => adhesion.statut === 'en_attente').length;
  const isLoadingStats = all.isLoading;
  const isBusy = valider.isPending || rejeter.isPending;
  const statCards = [
    { icon: <Clock3 size={20} />, label: 'À traiter', value: isLoadingStats ? '...' : formatNumber(stats.pending), tone: 'warning' },
    { icon: <Users size={20} />, label: 'Adhésions actives', value: isLoadingStats ? '...' : formatNumber(stats.active), tone: 'success' },
    { icon: <WalletCards size={20} />, label: 'Cotisations mensuelles', value: isLoadingStats ? '...' : formatCurrency(stats.monthlyCotisations), tone: 'primary' },
    {
      icon: <UserPlus size={20} />,
      label: 'Total demandes',
      value: isLoadingStats ? '...' : formatNumber(stats.total),
      meta: stats.rejected ? `${formatNumber(stats.rejected)} rejetée(s)` : 'Aucun rejet',
      tone: 'info',
    },
  ];

  const columns: Column<AdhesionRow>[] = [
    {
      key: 'reference',
      header: 'Référence',
      width: '170px',
      cell: (adhesion) => (
        <div className="adhesion-reference-cell">
          <span className="cell-mono">{adhesion.id.toUpperCase()}</span>
          <span>{adhesion.createdAt ? formatDate(adhesion.createdAt) : 'Date non renseignée'}</span>
        </div>
      ),
    },
    {
      key: 'adherentNom',
      header: 'Adhérent',
      width: '260px',
      cell: (adhesion) => (
        <div className="adhesion-member-cell">
          <span className="adhesion-member-avatar" aria-hidden="true">
            {getInitials(adhesion.adherentNom)}
          </span>
          <div>
            <strong className="cell-strong">{adhesion.adherentNom}</strong>
            <span>
              {adhesion.adherentMatricule
                ? `Mat. ${adhesion.adherentMatricule}`
                : adhesion.adherentEmail ?? 'Contact non renseigné'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'periode',
      header: 'Période',
      width: '180px',
      cell: (adhesion) => (
        <div className="adhesion-period-cell">
          <span>{formatDate(adhesion.dateDebut)}</span>
          <span>au {formatDate(adhesion.dateFin)}</span>
        </div>
      ),
    },
    {
      key: 'cotisation',
      header: 'Cotisation',
      align: 'right',
      width: '140px',
      cell: (adhesion) => <strong className="amount">{formatCurrency(adhesion.montantCotisation)}</strong>,
    },
    {
      key: 'statut',
      header: 'Statut',
      width: '130px',
      cell: (adhesion) => <StatusBadge status={adhesion.statut} />,
    },
  ];

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatut(value);
    setPage(1);
  }

  function validateFromModal() {
    if (!viewing) return;
    valider.mutate(viewing.id);
    setViewing(null);
  }

  function rejectFromModal() {
    if (!viewing) return;
    setRejecting(viewing);
    setViewing(null);
  }

  return (
    <div className="admin-adhesions-page">
      <PageHeader
        title="Demandes d’adhésion"
        description="Contrôler les nouvelles demandes, activer les comptes et suivre les cotisations."
        breadcrumb={['Administration', 'Demandes', 'Adhésions']}
      />

      <section className="adhesion-stats-grid" aria-label="Résumé des demandes d'adhésion">
        {statCards.map((card) => <SummaryCard key={card.label} {...card} />)}
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
            <SearchInput value={search} onChange={changeSearch} placeholder="Rechercher par nom, matricule, email..." />
            <SelectFilter label="Statut" value={statut} onChange={changeStatus} options={STATUS_OPTIONS} />
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={query.isLoading}
          rowKey={(adhesion) => adhesion.id}
          emptyTitle="Aucune demande d’adhésion"
          emptyDescription="Essayez un autre statut ou une autre recherche."
          actionsWidth="285px"
          rowActions={(adhesion) => (
            <RequestActions
              adhesion={adhesion}
              isBusy={isBusy}
              isValidating={valider.isPending && valider.variables === adhesion.id}
              onView={() => setViewing(adhesion)}
              onValidate={() => valider.mutate(adhesion.id)}
              onReject={() => setRejecting(adhesion)}
            />
          )}
        />

        {query.data && query.data.total > 0 && (
          <div className="data-table-card adhesion-pagination">
            <Pagination page={page} size={PAGE_SIZE} total={query.data.total} onPageChange={setPage} />
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

      <AdhesionDetailsModal
        adhesion={viewing}
        isBusy={isBusy}
        isValidating={valider.isPending && valider.variables === viewing?.id}
        onClose={() => setViewing(null)}
        onReject={rejectFromModal}
        onValidate={validateFromModal}
      />
    </div>
  );
}

function RequestActions({ adhesion, isBusy, isValidating, onView, onValidate, onReject }: any) {
  const canRequest = adhesion.statut === 'en_attente';

  return (
    <span className="adhesion-row-actions">
      <Button
        variant="secondary"
        size="sm"
        onClick={onView}
        aria-label={`Voir la demande de ${adhesion.adherentNom}`}
        title="Voir les détails de l'adhérent et de la demande"
      >
        <Eye size={14} /> Détails
      </Button>

      {canRequest && (
        <>
          <Button variant="primary" size="sm" onClick={onValidate} disabled={isBusy} isLoading={isValidating} aria-label={`Accepter la demande de ${adhesion.adherentNom}`} title="Accepter la demande">
            <Check size={14} /> Accepter
          </Button>
          <Button variant="danger" size="sm" onClick={onReject} disabled={isBusy} aria-label={`Rejeter la demande de ${adhesion.adherentNom}`} title="Rejeter la demande">
            <X size={14} /> Rejeter
          </Button>
        </>
      )}
    </span>
  );
}

function AdhesionDetailsModal({ adhesion, isBusy, isValidating, onClose, onReject, onValidate }: any) {
  const isPending = adhesion?.statut === 'en_attente';

  return (
    <Modal
      open={!!adhesion}
      onClose={onClose}
      title={adhesion ? `Dossier d'adhésion - ${adhesion.adherentNom}` : ''}
      description="Vérifier la demande avant de l'accepter ou de la rejeter."
      size="lg"
      footer={
        isPending ? (
          <div className="adhesion-modal-actions">
            <Button variant="secondary" onClick={onClose}>Fermer</Button>
            <Button variant="danger" onClick={onReject} disabled={isBusy}>
              <X size={14} /> Rejeter
            </Button>
            <Button variant="primary" onClick={onValidate} disabled={isBusy} isLoading={isValidating}>
              <Check size={14} /> Valider et activer le compte
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        )
      }
    >
      {adhesion && <AdhesionDetails adhesion={adhesion} />}
    </Modal>
  );
}

function AdhesionDetails({ adhesion }: any) {
  const empty = 'Non renseigné';

  return (
    <div className="adhesion-detail">
      <section className="adhesion-detail-header">
        <div className="adhesion-detail-person">
          <span className="adhesion-member-avatar adhesion-member-avatar--xl" aria-hidden="true">
            {getInitials(adhesion.adherentNom)}
          </span>
          <div>
            <span className="adhesion-detail-eyebrow">Demande d'adhésion</span>
            <h3>{adhesion.adherentNom}</h3>
            <div className="adhesion-detail-chips">
              <span className="adhesion-soft-chip">
                <Hash size={13} /> {adhesion.id.toUpperCase()}
              </span>
              {adhesion.adherentMatricule && (
                <span className="adhesion-soft-chip">
                  <UserIcon size={13} /> Mat. {adhesion.adherentMatricule}
                </span>
              )}
            </div>
          </div>
        </div>
        <StatusBadge status={adhesion.statut} />
      </section>

      <section className="adhesion-detail-metrics" aria-label="Informations principales">
        <DetailMetric icon={<Calendar size={16} />} label="Soumise le" value={adhesion.createdAt ? formatDate(adhesion.createdAt) : empty} />
        <DetailMetric icon={<BadgeCheck size={16} />} label="Compte" value={adhesion.adherentStatut ?? empty} tone={adhesion.adherentStatut === 'ACTIF' ? 'success' : 'warning'} />
        <DetailMetric icon={<DollarSign size={16} />} label="Cotisation" value={formatCurrency(adhesion.montantCotisation)} tone="primary" />
      </section>

      <div className="adhesion-detail-layout">
        <DetailPanel title="Identité adhérent" icon={<UserIcon size={16} />}>
          <DetailField label="Nom complet" value={<strong>{adhesion.adherentNom}</strong>} />
          <DetailField label="Matricule" value={adhesion.adherentMatricule || empty} />
          <DetailField
            label="État du compte"
            value={
              <span className={adhesion.adherentStatut === 'ACTIF' ? 'adhesion-account-active' : 'adhesion-account-pending'}>
                {adhesion.adherentStatut ?? empty}
              </span>
            }
          />
        </DetailPanel>

        <DetailPanel title="Coordonnées" icon={<Mail size={16} />}>
          <DetailField label="Email" value={adhesion.adherentEmail ? <a href={`mailto:${adhesion.adherentEmail}`}>{adhesion.adherentEmail}</a> : empty} />
          <DetailField label="Téléphone" value={adhesion.adherentTelephone ? <a href={`tel:${adhesion.adherentTelephone}`}>{adhesion.adherentTelephone}</a> : empty} />
        </DetailPanel>

        <DetailPanel title="Adhésion demandée" icon={<BadgeCheck size={16} />} wide>
          <DetailField label="Référence" value={<span className="cell-mono">{adhesion.id.toUpperCase()}</span>} />
          <DetailField label="Statut" value={<StatusBadge status={adhesion.statut} />} />
          <DetailField label="Date de début" value={formatDate(adhesion.dateDebut)} />
          <DetailField label="Date de fin" value={formatDate(adhesion.dateFin)} />
          <DetailField label="Cotisation mensuelle" value={<strong>{formatCurrency(adhesion.montantCotisation)}</strong>} />
        </DetailPanel>
      </div>

      {adhesion.statut === 'en_attente' && (
        <div className="adhesion-decision-note">
          <BadgeCheck size={18} />
          <p>
            En validant, le compte de l'adhérent passera à <strong>ACTIF</strong>,
            l'adhésion deviendra <strong>active</strong> et la cotisation mensuelle de{' '}
            <strong>{formatCurrency(adhesion.montantCotisation)}</strong> sera prélevée sur sa paie.
          </p>
        </div>
      )}
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erreur';
}

function SummaryCard({ icon, label, value, meta, tone }: any) {
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

function DetailMetric({ icon, label, value, tone = 'neutral' }: any) {
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

function DetailPanel({ title, icon, children, wide = false }: any) {
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

function DetailField({ label, value }: any) {
  return (
    <div className="adhesion-detail-field">
      <div className="adhesion-detail-label">{label}</div>
      <div className="adhesion-detail-value">{value}</div>
    </div>
  );
}
