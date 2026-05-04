import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Handshake,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { conventionsApi, getAdherentConventionStatus } from '../api/conventionsApi';
import {
  ADHERENT_STATUS_LABEL,
  ADHERENT_STATUS_VARIANT,
  CONV_TYPE_ICON,
  CONV_TYPE_LABEL,
  CONV_TYPE_TONE,
} from '../conventions/conventionHelpers';
import type {
  Convention,
  ConventionAdherentStatus,
  ConventionType,
} from '../../../types/domain';
import './AdherentConventionsListPage.css';

type ValidityFilter = 'all' | 'in_progress' | 'expiring_soon' | 'expired';

const ALL_TYPES: ConventionType[] = ['sante', 'restauration', 'transport', 'commerce', 'education', 'loisir'];
const ALL_STATUSES: ConventionAdherentStatus[] = [
  'disponible',
  'deja_demandee',
  'active',
  'expiree',
  'non_disponible',
];

const FILTER_LABELS: Record<ValidityFilter, string> = {
  all: 'Toutes les validités',
  in_progress: 'En cours',
  expiring_soon: 'Expire bientôt',
  expired: 'Expirées',
};

export function AdherentConventionsListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConventionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ConventionAdherentStatus | 'all'>('all');
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>('all');

  const { data: conventions, isLoading: conventionsLoading } = useQuery({
    queryKey: ['adherent-conventions'],
    queryFn: () => conventionsApi.getConventions(),
  });

  const { data: demandes, isLoading: demandesLoading } = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });

  const isLoading = conventionsLoading || demandesLoading;

  const decoratedConventions = useMemo(() => {
    const today = new Date();
    return (conventions ?? []).map((convention) => ({
      convention,
      adherentStatus: getAdherentConventionStatus(convention, demandes ?? [], today),
    }));
  }, [conventions, demandes]);

  const summary = useMemo(() => {
    return decoratedConventions.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.adherentStatus === 'disponible') acc.available += 1;
        if (item.adherentStatus === 'deja_demandee') acc.pending += 1;
        if (item.adherentStatus === 'active') acc.active += 1;
        if (isExpiringSoon(item.convention)) acc.expiringSoon += 1;
        return acc;
      },
      { total: 0, available: 0, pending: 0, active: 0, expiringSoon: 0 }
    );
  }, [decoratedConventions]);

  const filteredConventions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return decoratedConventions.filter(({ convention, adherentStatus }) => {
      if (normalizedSearch) {
        const searchable = [
          convention.fournisseurNom,
          convention.avantage,
          convention.descriptionCourte,
          CONV_TYPE_LABEL[convention.type],
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(normalizedSearch)) return false;
      }

      if (typeFilter !== 'all' && convention.type !== typeFilter) return false;
      if (statusFilter !== 'all' && adherentStatus !== statusFilter) return false;

      const daysLeft = getDaysLeft(convention.dateFin);
      if (validityFilter === 'expired' && daysLeft >= 0) return false;
      if (validityFilter === 'expiring_soon' && (daysLeft < 0 || daysLeft > 60)) return false;
      if (validityFilter === 'in_progress' && daysLeft < 0) return false;

      return true;
    });
  }, [decoratedConventions, search, statusFilter, typeFilter, validityFilter]);

  const activeFilterCount =
    (search.trim() ? 1 : 0)
    + (typeFilter !== 'all' ? 1 : 0)
    + (statusFilter !== 'all' ? 1 : 0)
    + (validityFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setValidityFilter('all');
  };

  return (
    <div className="adh-conventions-page">
      <PageHeader
        title="Offres et conventions"
        description="Retrouvez les conventions partenaires disponibles et suivez vos avantages en cours."
      />

      <section className="adh-conventions-hero">
        <div className="adh-conventions-hero-main">
          <span className="adh-conventions-eyebrow">
            <Sparkles size={14} />
            Espace adhérent
          </span>
          <h2>Avantages partenaires</h2>
          <p>Vos conventions disponibles, demandes en cours et avantages actifs au même endroit.</p>
        </div>
        <div className="adh-conventions-hero-actions">
          <button
            type="button"
            className="adh-conventions-nav-btn"
            onClick={() => navigate('/adherent/conventions/mes-demandes')}
          >
            <FileText size={17} />
            <span>Mes demandes</span>
          </button>
        </div>
      </section>

      <section className="adh-conventions-summary" aria-label="Synthese conventions">
        <SummaryCard icon={Handshake} label="Disponibles" value={summary.available} tone="success" />
        <SummaryCard icon={Clock3} label="Demandes en cours" value={summary.pending} tone="warning" />
        <SummaryCard icon={CheckCircle2} label="Actives" value={summary.active} tone="info" />
        <SummaryCard icon={AlertTriangle} label="Bientôt expirées" value={summary.expiringSoon} tone="danger" />
      </section>

      <section className="adh-conventions-filters" aria-label="Filtres conventions">
        <div className="adh-conventions-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher fournisseur, avantage, type..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Rechercher une convention"
          />
          {search.trim() && (
            <button
              type="button"
              className="adh-conventions-clear"
              onClick={() => setSearch('')}
              aria-label="Effacer la recherche"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="adh-conventions-selects">
          <select
            className="adh-conventions-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as ConventionType | 'all')}
            aria-label="Filtrer par type"
          >
            <option value="all">Tous les types</option>
            {ALL_TYPES.map((type) => (
              <option key={type} value={type}>{CONV_TYPE_LABEL[type]}</option>
            ))}
          </select>

          <select
            className="adh-conventions-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ConventionAdherentStatus | 'all')}
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>{ADHERENT_STATUS_LABEL[status]}</option>
            ))}
          </select>

          <select
            className="adh-conventions-select"
            value={validityFilter}
            onChange={(event) => setValidityFilter(event.target.value as ValidityFilter)}
            aria-label="Filtrer par validité"
          >
            {Object.entries(FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {activeFilterCount > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
            <RotateCcw size={14} className="adh-conventions-btn-icon" />
            Réinitialiser ({activeFilterCount})
          </Button>
        )}
      </section>

      <div className="adh-conventions-results-head">
        <div>
          <span className="adh-conventions-results-kicker">Catalogue</span>
          <h3>{filteredConventions.length} convention{filteredConventions.length > 1 ? 's' : ''}</h3>
        </div>
        <span className="adh-conventions-results-total">{summary.total} au total</span>
      </div>

      {isLoading ? (
        <div className="adh-conventions-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="adh-conventions-skeleton skeleton" />
          ))}
        </div>
      ) : filteredConventions.length === 0 ? (
        <section className="adh-empty-card adh-conventions-empty">
          <div className="adh-empty-icon">
            <Filter size={28} />
          </div>
          <h3>{activeFilterCount > 0 ? 'Aucun résultat' : 'Aucune convention disponible'}</h3>
          <p>
            {activeFilterCount > 0
              ? 'Aucune convention ne correspond aux filtres sélectionnés.'
              : 'Les prochaines conventions apparaîtront ici dès leur publication.'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="secondary" onClick={resetFilters}>
              <RotateCcw size={14} className="adh-conventions-btn-icon" />
              Réinitialiser les filtres
            </Button>
          )}
        </section>
      ) : (
        <div className="adh-conventions-grid">
          {filteredConventions.map(({ convention, adherentStatus }) => (
            <ConventionCard
              key={convention.id}
              convention={convention}
              adherentStatus={adherentStatus}
              onView={() => navigate(`/adherent/conventions/${convention.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: typeof Handshake;
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'info' | 'danger';
}

function SummaryCard({ icon: Icon, label, value, tone }: SummaryCardProps) {
  return (
    <article className={`adh-conventions-summary-card is-${tone}`}>
      <span className="adh-conventions-summary-icon">
        <Icon size={18} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

interface ConventionCardProps {
  convention: Convention;
  adherentStatus: ConventionAdherentStatus;
  onView: () => void;
}

function ConventionCard({ convention, adherentStatus, onView }: ConventionCardProps) {
  const Icon = CONV_TYPE_ICON[convention.type];
  const tone = CONV_TYPE_TONE[convention.type];
  const daysLeft = getDaysLeft(convention.dateFin);
  const expiringSoon = daysLeft > 0 && daysLeft <= 60;
  const canRequest = adherentStatus === 'disponible';

  return (
    <article className="adh-convention-card">
      <div className={`adh-convention-cover tone-${tone}`}>
        {convention.imageUrl ? (
          <img
            src={convention.imageUrl}
            alt={convention.fournisseurNom}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.classList.add('is-hidden');
            }}
          />
        ) : null}
        <div className="adh-convention-cover-fallback">
          <Icon size={34} />
        </div>
        <div className="adh-convention-cover-top">
          <span className="adh-convention-type">
            <Icon size={13} />
            {CONV_TYPE_LABEL[convention.type]}
          </span>
          <StatusBadge
            status={adherentStatus}
            tone={ADHERENT_STATUS_VARIANT[adherentStatus]}
            label={ADHERENT_STATUS_LABEL[adherentStatus]}
          />
        </div>
        <span className="adh-convention-discount">-{convention.remise}%</span>
      </div>

      <div className="adh-convention-body">
        <div className="adh-convention-heading">
          <h3>{convention.fournisseurNom}</h3>
          {convention.avantage && <p>{convention.avantage}</p>}
        </div>

        {convention.descriptionCourte && (
          <p className="adh-convention-description">{convention.descriptionCourte}</p>
        )}

        {convention.conditions && (
          <p className="adh-convention-conditions">
            <span>Conditions</span>
            {convention.conditions}
          </p>
        )}

        <div className="adh-convention-meta">
          <Calendar size={14} />
          <span>Valide jusqu'au {formatDate(convention.dateFin)}</span>
          {expiringSoon && <strong>{daysLeft} j restants</strong>}
        </div>

        {expiringSoon && adherentStatus !== 'expiree' && (
          <div className="adh-convention-warning">
            <AlertTriangle size={15} />
            <span>Expire bientôt</span>
          </div>
        )}

        <div className="adh-convention-actions">
          <Button variant="secondary" size="sm" onClick={onView}>
            <FileText size={14} className="adh-conventions-btn-icon" />
            Détails
          </Button>
          {canRequest ? (
            <Button size="sm" onClick={onView}>
              Demander
              <ArrowRight size={14} className="adh-conventions-btn-icon is-after" />
            </Button>
          ) : (
            <Button size="sm" disabled>
              {getUnavailableActionLabel(adherentStatus)}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function getUnavailableActionLabel(status: ConventionAdherentStatus) {
  if (status === 'deja_demandee') return 'Demande en cours';
  if (status === 'active') return 'Active';
  if (status === 'expiree') return 'Expirée';
  return 'Non disponible';
}

function getDaysLeft(date: string) {
  const today = new Date();
  const endDate = new Date(date);
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
}

function isExpiringSoon(convention: Convention) {
  const daysLeft = getDaysLeft(convention.dateFin);
  return daysLeft > 0 && daysLeft <= 60;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}
