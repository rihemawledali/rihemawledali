/* ============================================
   Mes conventions actives — Adherent Portal
   ============================================ */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ArrowRight, AlertTriangle, Star, Sparkles, FileText, Phone, Mail,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { conventionsApi } from '../api/conventionsApi';
import {
  CONV_TYPE_LABEL, CONV_TYPE_ICON, CONV_TYPE_TONE,
} from '../conventions/conventionHelpers';
import type { Convention, ConventionDemande } from '../../../types/domain';

interface ActiveItem {
  convention: Convention;
  demande: ConventionDemande;
  daysLeft: number;
  expiringSoon: boolean;
}

export function AdherentMesConventionsActivesPage() {
  const navigate = useNavigate();

  const { data: conventions, isLoading: convLoading } = useQuery({
    queryKey: ['adherent-conventions'],
    queryFn: () => conventionsApi.getConventions(),
  });
  const { data: demandes, isLoading: demandesLoading } = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });
  const isLoading = convLoading || demandesLoading;

  const activeItems: ActiveItem[] = useMemo(() => {
    if (!conventions || !demandes) return [];
    const today = new Date();
    const validatedDemandes = demandes.filter((d) => d.statut === 'validee');
    return validatedDemandes
      .map((d) => {
        const c = conventions.find((cv) => cv.id === d.conventionId);
        if (!c) return null;
        const fin = new Date(c.dateFin);
        if (fin < today || c.statut === 'expiree') return null; // becomes "active" only while valid
        const daysLeft = Math.ceil((fin.getTime() - today.getTime()) / 86400000);
        return {
          convention: c,
          demande: d,
          daysLeft,
          expiringSoon: daysLeft <= 60,
        } satisfies ActiveItem;
      })
      .filter((x): x is ActiveItem => x !== null)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [conventions, demandes]);

  const expiringCount = activeItems.filter((i) => i.expiringSoon).length;

  return (
    <div>
      <PageHeader
        title="Mes conventions actives"
        description="Conventions validées dont vous bénéficiez actuellement."
      />

      {!isLoading && activeItems.length > 0 && (
        <div className="adh-stats-row">
          <div className="adh-tile">
            <div className="adh-tile-head">
              <div className="adh-tile-icon tone-success"><Sparkles size={18} /></div>
              <span className="adh-tile-label">Conventions actives</span>
            </div>
            <div className="adh-tile-value">{activeItems.length}</div>
            <span className="adh-tile-meta">Vous pouvez en bénéficier dès maintenant</span>
          </div>
          {expiringCount > 0 && (
            <div className="adh-tile">
              <div className="adh-tile-head">
                <div className="adh-tile-icon tone-warning"><AlertTriangle size={18} /></div>
                <span className="adh-tile-label">Expirent bientôt</span>
              </div>
              <div className="adh-tile-value">{expiringCount}</div>
              <span className="adh-tile-meta">Moins de 60 jours restants</span>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="adh-offer-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : activeItems.length === 0 ? (
        <div className="adh-empty-card">
          <div className="adh-empty-icon"><Star size={28} /></div>
          <h3>Aucune convention active actuellement.</h3>
          <p>Demandez à bénéficier d\u2019une convention pour profiter des avantages partenaires.</p>
          <Button onClick={() => navigate('/adherent/conventions')} style={{ marginTop: 'var(--space-3)' }}>
            Voir les conventions disponibles
            <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      ) : (
        <div className="adh-offer-grid">
          {activeItems.map((item) => (
            <ActiveConventionCard
              key={item.convention.id}
              item={item}
              onView={() => navigate(`/adherent/conventions/${item.convention.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ActiveConventionCardProps {
  item: ActiveItem;
  onView: () => void;
}
function ActiveConventionCard({ item, onView }: ActiveConventionCardProps) {
  const { convention: c, demande: d, daysLeft, expiringSoon } = item;
  const Icon = CONV_TYPE_ICON[c.type];
  const tone = CONV_TYPE_TONE[c.type];

  return (
    <article className="adh-offer-card">
      <div className="adh-offer-card-head">
        <span className="adh-offer-tag">
          <Icon size={12} />
          {CONV_TYPE_LABEL[c.type]}
        </span>
        <StatusBadge status="active" tone="info" label="Active" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div className={`adh-tile-icon tone-${tone}`}><Icon size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="adh-offer-supplier">{c.fournisseurNom}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            Active depuis le {new Date(d.dateDecision || d.dateDemande).toLocaleDateString('fr-FR')}
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

      {c.conditions && (
        <p style={{
          margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)',
          lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Conditions : </strong>
          {c.conditions}
        </p>
      )}

      <div className="adh-offer-meta">
        <Calendar size={14} />
        <span>
          Valide jusqu'au {new Date(c.dateFin).toLocaleDateString('fr-FR')}
          {expiringSoon && (
            <span style={{ color: 'var(--color-warning-600)', fontWeight: 600 }}>
              {' '}· {daysLeft} j restants
            </span>
          )}
        </span>
      </div>

      {expiringSoon && (
        <div className="adh-alert warning" style={{ margin: 0, padding: '8px 10px' }}>
          <AlertTriangle size={14} className="adh-alert-icon" />
          <div style={{ fontSize: 'var(--font-size-xs)' }}>Cette convention expire bientôt.</div>
        </div>
      )}

      {/* Quick supplier contact */}
      {(c.fournisseurTelephone || c.fournisseurEmail) && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 'var(--font-size-xs)' }}>
          {c.fournisseurTelephone && (
            <a href={`tel:${c.fournisseurTelephone}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: 'var(--color-primary-600)', textDecoration: 'none', fontWeight: 600,
            }}>
              <Phone size={12} /> {c.fournisseurTelephone}
            </a>
          )}
          {c.fournisseurEmail && (
            <a href={`mailto:${c.fournisseurEmail}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: 'var(--color-primary-600)', textDecoration: 'none', fontWeight: 600,
            }}>
              <Mail size={12} /> Email
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <Button variant="secondary" size="sm" onClick={onView} style={{ width: '100%' }}>
          <FileText size={14} style={{ marginRight: 6 }} />
          Voir détails
        </Button>
      </div>
    </article>
  );
}
