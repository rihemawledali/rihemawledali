/* ============================================
   Offres et conventions — Discovery page
   ============================================ */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, Calendar, ArrowRight, AlertTriangle, Filter, X, Handshake, FileText, RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { conventionsApi, getAdherentConventionStatus } from '../api/conventionsApi';
import {
  CONV_TYPE_LABEL, CONV_TYPE_ICON, CONV_TYPE_TONE,
  ADHERENT_STATUS_LABEL, ADHERENT_STATUS_VARIANT,
} from '../conventions/conventionHelpers';
import type {
  Convention, ConventionType, ConventionAdherentStatus,
} from '../../../types/domain';

type ValidityFilter = 'all' | 'in_progress' | 'expiring_soon' | 'expired';

const ALL_TYPES: ConventionType[] = ['sante', 'restauration', 'transport', 'commerce', 'education', 'loisir'];
const ALL_STATUSES: ConventionAdherentStatus[] = ['disponible', 'deja_demandee', 'active', 'expiree', 'non_disponible'];

export function AdherentConventionsListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConventionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ConventionAdherentStatus | 'all'>('all');
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>('all');

  const { data: conventions, isLoading: convLoading } = useQuery({
    queryKey: ['adherent-conventions'],
    queryFn: () => conventionsApi.getConventions(),
  });

  const { data: demandes, isLoading: demandesLoading } = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });

  const isLoading = convLoading || demandesLoading;

  const decoratedConventions = useMemo(() => {
    if (!conventions) return [];
    const today = new Date();
    return conventions.map((c) => ({
      convention: c,
      adherentStatus: getAdherentConventionStatus(c, demandes || [], today),
    }));
  }, [conventions, demandes]);

  const filtered = useMemo(() => {
    const today = new Date();
    return decoratedConventions.filter(({ convention: c, adherentStatus }) => {
      // Search by supplier name
      if (search.trim() && !c.fournisseurNom.toLowerCase().includes(search.trim().toLowerCase())) return false;
      // Type
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      // Adherent-facing status
      if (statusFilter !== 'all' && adherentStatus !== statusFilter) return false;
      // Validity
      if (validityFilter !== 'all') {
        const fin = new Date(c.dateFin);
        const days = (fin.getTime() - today.getTime()) / 86400000;
        if (validityFilter === 'expired' && days >= 0) return false;
        if (validityFilter === 'expiring_soon' && (days < 0 || days > 60)) return false;
        if (validityFilter === 'in_progress' && days < 0) return false;
      }
      return true;
    });
  }, [decoratedConventions, search, typeFilter, statusFilter, validityFilter]);

  const activeFilterCount =
    (search.trim() ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0)
    + (statusFilter !== 'all' ? 1 : 0) + (validityFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setValidityFilter('all');
  };

  return (
    <div>
      <PageHeader
        title="Offres et conventions"
        description="Consultez les conventions disponibles et demandez à bénéficier des avantages proposés par l'amicale."
      />

      {/* Filters */}
      <div className="adh-filters-card">
        <div className="adh-filters-row">
          <div className="adh-search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher un fournisseur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher par nom de fournisseur"
            />
            {search && (
              <button
                type="button"
                className="adh-search-clear"
                onClick={() => setSearch('')}
                aria-label="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="adh-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ConventionType | 'all')}
            aria-label="Filtrer par type"
          >
            <option value="all">Tous les types</option>
            {ALL_TYPES.map((t) => <option key={t} value={t}>{CONV_TYPE_LABEL[t]}</option>)}
          </select>

          <select
            className="adh-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ConventionAdherentStatus | 'all')}
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{ADHERENT_STATUS_LABEL[s]}</option>)}
          </select>

          <select
            className="adh-select"
            value={validityFilter}
            onChange={(e) => setValidityFilter(e.target.value as ValidityFilter)}
            aria-label="Filtrer par validité"
          >
            <option value="all">Toutes les validités</option>
            <option value="in_progress">En cours de validité</option>
            <option value="expiring_soon">Expire bientôt (&lt; 60 j)</option>
            <option value="expired">Expirée</option>
          </select>

          {activeFilterCount > 0 && (
            <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
              <RotateCcw size={14} style={{ marginRight: 6 }} />
              Réinitialiser ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="adh-quicklinks">
        <button className="adh-quicklink" onClick={() => navigate('/adherent/conventions/mes-demandes')}>
          <FileText size={16} />
          <span>Mes demandes</span>
        </button>
        <button className="adh-quicklink" onClick={() => navigate('/adherent/conventions/actives')}>
          <Handshake size={16} />
          <span>Mes conventions actives</span>
        </button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="adh-offer-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="adh-empty-card">
          <div className="adh-empty-icon"><Filter size={28} /></div>
          <h3>{activeFilterCount > 0 ? 'Aucun résultat' : 'Aucune convention disponible pour le moment.'}</h3>
          <p>
            {activeFilterCount > 0
              ? 'Aucune convention ne correspond à vos critères. Essayez d\u2019élargir votre recherche.'
              : 'Revenez plus tard pour consulter les nouvelles offres.'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="secondary" onClick={resetFilters} style={{ marginTop: 'var(--space-3)' }}>
              <RotateCcw size={14} style={{ marginRight: 6 }} /> Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="adh-offer-grid">
          {filtered.map(({ convention: c, adherentStatus }) => (
            <ConventionCard
              key={c.id}
              convention={c}
              adherentStatus={adherentStatus}
              onView={() => navigate(`/adherent/conventions/${c.id}`)}
            />
          ))}
        </div>
      )}

      <style>{INLINE_STYLES}</style>
    </div>
  );
}

interface ConventionCardProps {
  convention: Convention;
  adherentStatus: ConventionAdherentStatus;
  onView: () => void;
}

function ConventionCard({ convention: c, adherentStatus, onView }: ConventionCardProps) {
  const Icon = CONV_TYPE_ICON[c.type];
  const tone = CONV_TYPE_TONE[c.type];
  const today = new Date();
  const finDate = new Date(c.dateFin);
  const daysLeft = Math.ceil((finDate.getTime() - today.getTime()) / 86400000);
  const expiringSoon = daysLeft > 0 && daysLeft < 60;

  const canRequest = adherentStatus === 'disponible';

  return (
    <div className="adh-offer-card">
      <div className="adh-offer-card-head">
        <span className="adh-offer-tag">
          <Icon size={12} />
          {CONV_TYPE_LABEL[c.type]}
        </span>
        <StatusBadge
          status={adherentStatus}
          tone={ADHERENT_STATUS_VARIANT[adherentStatus]}
          label={ADHERENT_STATUS_LABEL[adherentStatus]}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div className={`adh-tile-icon tone-${tone}`}><Icon size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="adh-offer-supplier">{c.fournisseurNom}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            Fournisseur partenaire
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div className="adh-offer-amount" style={{ color: 'var(--color-success-600)' }}>
          −{c.remise}%
        </div>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          {c.avantage ? '· ' + c.avantage : 'de remise'}
        </span>
      </div>

      {c.descriptionCourte && (
        <p className="adh-offer-desc">{c.descriptionCourte}</p>
      )}

      {c.conditions && (
        <div className="adh-offer-conditions">
          <span className="adh-offer-conditions-label">Conditions :</span> {c.conditions}
        </div>
      )}

      <div className="adh-offer-meta">
        <Calendar size={14} />
        <span>
          Du {new Date(c.dateDebut).toLocaleDateString('fr-FR')} au{' '}
          {new Date(c.dateFin).toLocaleDateString('fr-FR')}
          {expiringSoon && (
            <span style={{ color: 'var(--color-warning-600)', fontWeight: 600 }}>
              {' '}· {daysLeft} j restants
            </span>
          )}
        </span>
      </div>

      {expiringSoon && adherentStatus !== 'expiree' && (
        <div className="adh-alert warning" style={{ margin: 0, padding: '8px 10px' }}>
          <AlertTriangle size={14} className="adh-alert-icon" />
          <div style={{ fontSize: 'var(--font-size-xs)' }}>Cette convention expire bientôt.</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
        <Button variant="secondary" size="sm" onClick={onView}>
          <FileText size={14} style={{ marginRight: 6 }} />
          Voir détails
        </Button>
        {canRequest ? (
          <Button size="sm" onClick={onView} style={{ flex: 1, minWidth: 'fit-content' }}>
            Demander l'adhésion
            <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </Button>
        ) : (
          <Button size="sm" disabled style={{ flex: 1, minWidth: 'fit-content' }}>
            {adherentStatus === 'deja_demandee' && 'Demande en cours'}
            {adherentStatus === 'active' && 'Convention active'}
            {adherentStatus === 'expiree' && 'Convention expirée'}
            {adherentStatus === 'non_disponible' && 'Non disponible'}
          </Button>
        )}
      </div>
    </div>
  );
}

const INLINE_STYLES = `
.adh-filters-card {
  background: var(--adh-surface);
  border: 1px solid var(--adh-border);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  box-shadow: var(--adh-shadow-xs);
}
.adh-filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.adh-search-input {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: var(--adh-surface-2);
  border: 1px solid var(--adh-border);
  border-radius: 9px;
  min-width: 240px;
  flex: 1;
  max-width: 360px;
  color: var(--adh-text-3);
  transition: border-color 150ms, background 150ms;
}
.adh-search-input:focus-within {
  border-color: var(--adh-accent);
  background: white;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
}
.adh-search-input input {
  border: none;
  background: transparent;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--adh-text-1);
  flex: 1;
  outline: none;
}
.adh-search-input input::placeholder { color: var(--adh-text-3); }
.adh-search-clear {
  background: none; border: none; cursor: pointer;
  color: var(--adh-text-3); display: flex; align-items: center;
  padding: 2px;
  border-radius: 4px;
}
.adh-search-clear:hover { color: var(--adh-text-1); background: rgba(0,0,0,0.05); }
.adh-select {
  padding: 8px 32px 8px 12px;
  background-color: white;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a92a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border: 1px solid var(--adh-border);
  border-radius: 9px;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--adh-text-1);
  cursor: pointer;
  min-width: 160px;
  transition: border-color 150ms, box-shadow 150ms;
}
.adh-select:hover { border-color: var(--adh-border-strong); }
.adh-select:focus {
  outline: none;
  border-color: var(--adh-accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.adh-quicklinks {
  display: flex; gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.adh-quicklink {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px;
  background: var(--adh-surface);
  border: 1px solid var(--adh-border);
  border-radius: 999px;
  color: var(--adh-text-2);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms;
}
.adh-quicklink:hover {
  background: var(--adh-surface-2);
  color: var(--adh-text-1);
  border-color: var(--adh-border-strong);
}
.adh-quicklink svg { color: var(--adh-text-3); }
.adh-quicklink:hover svg { color: var(--adh-accent); }

.adh-offer-supplier {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--adh-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}
.adh-offer-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--adh-text-2);
  line-height: 1.5;
}
.adh-offer-conditions {
  font-size: 0.75rem;
  color: var(--adh-text-3);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.adh-offer-conditions-label {
  font-weight: 600;
  color: var(--adh-text-2);
}
`;
