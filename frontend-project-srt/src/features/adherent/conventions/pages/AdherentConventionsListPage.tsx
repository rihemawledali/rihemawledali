import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  FileText,
  Filter,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';

import { PageHeader } from '../../../../shared/layout/PageHeader';
import { Button } from '../../../../shared/ui/Button';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { formatDate, daysUntil } from '../../../../shared/lib/formatters';
import { getConventionAvantageSummary } from '../../../../shared/lib/conventionWorkflow';
import { conventionsApi, getAdherentConventionStatus } from '../api';

import {
  ADHERENT_STATUS_LABEL,
  ADHERENT_STATUS_VARIANT,
  CONV_TYPE_ICON,
  CONV_TYPE_LABEL,
  CONV_TYPE_TONE,
  getConventionImageUrl,
} from '../components/conventionHelpers';

import './AdherentConventionsListPage.css';

const TYPES = ['sante', 'restauration', 'transport', 'commerce', 'education', 'loisir'];

const STATUSES = [
  'disponible',
  'deja_demandee',
  'active',
  'expiree',
  'non_disponible',
];

const VALIDITY_OPTIONS = [
  { value: 'all', label: 'Toutes les validités' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'expiring_soon', label: 'Expire bientôt' },
  { value: 'expired', label: 'Expirées' },
];

const EXPIRING_SOON_DAYS = 60;

export function AdherentConventionsListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [validityFilter, setValidityFilter] = useState('all');

  const { data: conventions = [], isLoading: conventionsLoading } = useQuery<any[]>({
    queryKey: ['adherent-conventions'],
    queryFn: () => conventionsApi.getConventions(),
  });

  const { data: demandes = [], isLoading: demandesLoading } = useQuery<any[]>({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });

  const isLoading = conventionsLoading || demandesLoading;

  const conventionsWithStatus = useMemo(() => {
    const today = new Date();

    return conventions.map((convention) => ({
      convention,
      status: getAdherentConventionStatus(convention, demandes, today),
    }));
  }, [conventions, demandes]);

  const filteredConventions = useMemo(() => {
    const text = search.trim().toLowerCase();

    return conventionsWithStatus.filter(({ convention, status }) => {
      const daysLeft = daysUntil(convention.dateFin);

      if (text && !conventionMatchesSearch(convention, text)) {
        return false;
      }

      if (typeFilter !== 'all' && convention.type !== typeFilter) {
        return false;
      }

      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      if (validityFilter === 'expired' && daysLeft >= 0) {
        return false;
      }

      if (
        validityFilter === 'expiring_soon' &&
        (daysLeft < 0 || daysLeft > EXPIRING_SOON_DAYS)
      ) {
        return false;
      }

      if (validityFilter === 'in_progress' && daysLeft < 0) {
        return false;
      }

      return true;
    });
  }, [conventionsWithStatus, search, typeFilter, statusFilter, validityFilter]);

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (validityFilter !== 'all' ? 1 : 0);

  function resetFilters() {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setValidityFilter('all');
  }

  return (
    <div className="adh-conventions-page">
      <PageHeader
        title="Offres et conventions"
        description="Retrouvez les conventions partenaires disponibles et suivez vos avantages en cours."
      />

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
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filtrer par type"
          >
            <option value="all">Tous les types</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {CONV_TYPE_LABEL[type]}
              </option>
            ))}
          </select>

          <select
            className="adh-conventions-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {ADHERENT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>

          <select
            className="adh-conventions-select"
            value={validityFilter}
            onChange={(event) => setValidityFilter(event.target.value)}
            aria-label="Filtrer par validité"
          >
            {VALIDITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
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
          <h3>
            {filteredConventions.length} convention
            {filteredConventions.length > 1 ? 's' : ''}
          </h3>
        </div>

        <span className="adh-conventions-results-total">
          {conventionsWithStatus.length} au total
        </span>
      </div>

      {isLoading ? (
        <div className="adh-conventions-grid">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="adh-conventions-skeleton skeleton" />
          ))}
        </div>
      ) : filteredConventions.length === 0 ? (
        <EmptyState
          hasFilters={activeFilterCount > 0}
          onReset={resetFilters}
        />
      ) : (
        <div className="adh-conventions-grid">
          {filteredConventions.map(({ convention, status }) => (
            <ConventionCard
              key={convention.id}
              convention={convention}
              status={status}
              onView={() => navigate(`/adherent/conventions/${convention.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConventionCard({ convention, status, onView }: any) {
  const Icon = CONV_TYPE_ICON[convention.type];
  const tone = CONV_TYPE_TONE[convention.type];
  const avantage = getConventionAvantageSummary(convention);
  const imageUrl = getConventionImageUrl(convention);

  const daysLeft = daysUntil(convention.dateFin);
  const expiringSoon = daysLeft > 0 && daysLeft <= EXPIRING_SOON_DAYS;
  const canRequest = status === 'disponible';
  const description = convention.descriptionCourte || convention.description;

  return (
    <article className="adh-convention-card">
      <div className={`adh-convention-cover tone-${tone}`}>
        <img
          src={imageUrl}
          alt={`${CONV_TYPE_LABEL[convention.type]} - ${convention.fournisseurNom}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.classList.add('is-hidden');
          }}
        />

        <div className="adh-convention-cover-fallback">
          <Icon size={34} />
        </div>

        <div className="adh-convention-cover-top">
          <span className="adh-convention-type">
            <Icon size={13} />
            {CONV_TYPE_LABEL[convention.type]}
          </span>

          <StatusBadge
            status={status}
            tone={ADHERENT_STATUS_VARIANT[status]}
            label={ADHERENT_STATUS_LABEL[status]}
          />
        </div>

        <span className="adh-convention-discount">{avantage.label}</span>
      </div>

      <div className="adh-convention-body">
        <div className="adh-convention-heading">
          <h3>{convention.fournisseurNom}</h3>
          <p>{avantage.title}</p>
        </div>

        {description && (
          <p className="adh-convention-description">{description}</p>
        )}

        {avantage.subtitle && (
          <p className="adh-convention-conditions">
            <span>Avantage</span>
            {avantage.subtitle}
          </p>
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

        {expiringSoon && status !== 'expiree' && (
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
              {getDisabledButtonLabel(status)}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyState({ hasFilters, onReset }: any) {
  return (
    <section className="adh-empty-card adh-conventions-empty">
      <div className="adh-empty-icon">
        <Filter size={28} />
      </div>

      <h3>{hasFilters ? 'Aucun résultat' : 'Aucune convention disponible'}</h3>

      <p>
        {hasFilters
          ? 'Aucune convention ne correspond aux filtres sélectionnés.'
          : 'Les prochaines conventions apparaîtront ici dès leur publication.'}
      </p>

      {hasFilters && (
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw size={14} className="adh-conventions-btn-icon" />
          Réinitialiser les filtres
        </Button>
      )}
    </section>
  );
}

function conventionMatchesSearch(convention: any, search: string) {
  const avantage = getConventionAvantageSummary(convention);

  const text = [
    convention.fournisseurNom,
    convention.avantage,
    convention.descriptionCourte,
    convention.description,
    convention.typeAvantage,
    avantage.label,
    avantage.title,
    avantage.subtitle,
    CONV_TYPE_LABEL[convention.type],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return text.includes(search);
}

function getDisabledButtonLabel(status: string) {
  if (status === 'deja_demandee') return 'Demande en cours';
  if (status === 'active') return 'Active';
  if (status === 'expiree') return 'Expirée';

  return 'Non disponible';
}