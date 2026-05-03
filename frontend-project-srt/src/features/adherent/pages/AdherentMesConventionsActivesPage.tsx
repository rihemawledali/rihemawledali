/* ============================================
   Mes conventions actives — Adherent Portal
   Designed as a clean wallet of digital passes.
   ============================================ */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, AlertTriangle, Star, Phone, Mail, ArrowUpRight, MapPin, Hash,
  Sparkles, Clock,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { conventionsApi } from '../api/conventionsApi';
import {
  CONV_TYPE_LABEL, CONV_TYPE_ICON, CONV_TYPE_TONE,
} from '../conventions/conventionHelpers';
import type { Convention, ConventionDemande } from '../../../types/domain';

interface ActiveItem {
  convention: Convention;
  demande: ConventionDemande;
  daysLeft: number;
  daysTotal: number;
  daysElapsed: number;
  progressPct: number;
  expiringSoon: boolean;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

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
    const validated = demandes.filter((d) => d.statut === 'validee');
    return validated
      .map((d) => {
        const c = conventions.find((cv) => cv.id === d.conventionId);
        if (!c) return null;
        const start = new Date(d.dateDecision || d.dateDemande || c.dateDebut);
        const end = new Date(c.dateFin);
        if (end < today || c.statut === 'expiree') return null;
        const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
        const daysElapsed = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / 86400000));
        const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000);
        const progressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / daysTotal) * 100)));
        return {
          convention: c,
          demande: d,
          daysLeft,
          daysTotal,
          daysElapsed,
          progressPct,
          expiringSoon: daysLeft <= 60,
        } satisfies ActiveItem;
      })
      .filter((x): x is ActiveItem => x !== null)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [conventions, demandes]);

  const expiringCount = activeItems.filter((i) => i.expiringSoon).length;
  const avgDiscount = activeItems.length
    ? Math.round(activeItems.reduce((sum, i) => sum + i.convention.remise, 0) / activeItems.length)
    : 0;
  const maxDiscount = activeItems.length
    ? Math.max(...activeItems.map((i) => i.convention.remise))
    : 0;

  return (
    <div>
      <PageHeader
        title="Mes conventions actives"
        description="Les avantages partenaires dont vous bénéficiez actuellement."
      />

      {/* ---- Summary header ---- */}
      {!isLoading && activeItems.length > 0 && (
        <section className="adh-actives-summary">
          <div className="adh-actives-summary-main">
            <div className="adh-actives-summary-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="adh-actives-summary-eyebrow">Vous bénéficiez de</div>
              <div className="adh-actives-summary-count">
                {activeItems.length}
                <span>convention{activeItems.length > 1 ? 's' : ''} active{activeItems.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="adh-actives-summary-stats">
            <div className="adh-actives-summary-stat">
              <span className="label">Remise moyenne</span>
              <span className="value">−{avgDiscount}%</span>
            </div>
            <div className="adh-actives-summary-divider" />
            <div className="adh-actives-summary-stat">
              <span className="label">Meilleure offre</span>
              <span className="value">−{maxDiscount}%</span>
            </div>
            {expiringCount > 0 && (
              <>
                <div className="adh-actives-summary-divider" />
                <div className="adh-actives-summary-stat is-warning">
                  <span className="label">Expire bientôt</span>
                  <span className="value">{expiringCount}</span>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="adh-pass-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 14 }} />
          ))}
        </div>
      ) : activeItems.length === 0 ? (
        <div className="adh-empty-card">
          <div className="adh-empty-icon"><Star size={22} /></div>
          <h3>Aucune convention active</h3>
          <p>Demandez à bénéficier d&rsquo;une convention pour profiter des avantages partenaires.</p>
          <Button onClick={() => navigate('/adherent/conventions')} style={{ marginTop: 14 }}>
            Voir les conventions disponibles
            <ArrowUpRight size={14} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      ) : (
        <div className="adh-pass-grid">
          {activeItems.map((item) => (
            <ActivePass
              key={item.convention.id}
              item={item}
              onView={() => navigate(`/adherent/conventions/${item.convention.id}`)}
            />
          ))}
        </div>
      )}

      <style>{INLINE_STYLES}</style>
    </div>
  );
}

interface ActivePassProps {
  item: ActiveItem;
  onView: () => void;
}

function ActivePass({ item, onView }: ActivePassProps) {
  const { convention: c, demande: d, daysLeft, progressPct, expiringSoon } = item;
  const Icon = CONV_TYPE_ICON[c.type];
  const tone = CONV_TYPE_TONE[c.type];
  const passId = `#${d.id.slice(-6).toUpperCase()}`;

  return (
    <article
      className={`adh-pass ${expiringSoon ? 'is-warning' : ''}`}
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onView(); }}
    >
      {/* Left rail: thumbnail + type */}
      <div className="adh-pass-rail">
        <div className={`adh-pass-thumb tone-${tone}`}>
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={c.fournisseurNom}
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <Icon size={24} />
          )}
        </div>
        <div className="adh-pass-type">
          <Icon size={11} />
          {CONV_TYPE_LABEL[c.type]}
        </div>
      </div>

      {/* Body */}
      <div className="adh-pass-body">
        <div className="adh-pass-header">
          <div className="adh-pass-supplier">
            <h3>{c.fournisseurNom}</h3>
            <div className="adh-pass-id">
              <Hash size={11} />
              {passId}
            </div>
          </div>
          <div className="adh-pass-discount">
            <span className="label">Avantage</span>
            <strong>−{c.remise}%</strong>
          </div>
        </div>

        {c.avantage && (
          <p className="adh-pass-avantage">{c.avantage}</p>
        )}

        {/* Validity progress */}
        <div className="adh-pass-validity">
          <div className="adh-pass-validity-bar">
            <div
              className="adh-pass-validity-fill"
              style={{ width: `${progressPct}%` }}
              aria-valuenow={progressPct}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="adh-pass-validity-meta">
            <span className="adh-pass-validity-date">
              <Calendar size={11} />
              Du {fmtDate(d.dateDecision || d.dateDemande)} au {fmtDate(c.dateFin)}
            </span>
            <span className={`adh-pass-validity-left ${expiringSoon ? 'is-warning' : ''}`}>
              <Clock size={11} />
              {daysLeft > 0 ? `${daysLeft} j restants` : 'Expirée'}
            </span>
          </div>
        </div>

        {/* Footer: contact + CTA */}
        <div className="adh-pass-footer">
          <div className="adh-pass-contact">
            {c.fournisseurAdresse && (
              <span className="adh-pass-contact-item adh-pass-contact-address" title={c.fournisseurAdresse}>
                <MapPin size={12} />
                <span>{c.fournisseurAdresse}</span>
              </span>
            )}
            <div className="adh-pass-contact-actions" onClick={(e) => e.stopPropagation()}>
              {c.fournisseurTelephone && (
                <a
                  href={`tel:${c.fournisseurTelephone}`}
                  className="adh-pass-contact-btn"
                  aria-label={`Appeler ${c.fournisseurNom}`}
                  title={c.fournisseurTelephone}
                >
                  <Phone size={13} />
                </a>
              )}
              {c.fournisseurEmail && (
                <a
                  href={`mailto:${c.fournisseurEmail}`}
                  className="adh-pass-contact-btn"
                  aria-label={`Envoyer un email à ${c.fournisseurNom}`}
                  title={c.fournisseurEmail}
                >
                  <Mail size={13} />
                </a>
              )}
            </div>
          </div>

          <span className="adh-pass-cta">
            Voir les détails
            <ArrowUpRight size={14} />
          </span>
        </div>

        {expiringSoon && (
          <div className="adh-pass-warning-banner">
            <AlertTriangle size={13} />
            <span>Cette convention expire dans moins de 60 jours.</span>
          </div>
        )}
      </div>
    </article>
  );
}

const INLINE_STYLES = `
/* ---- Summary banner ---- */
.adh-actives-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 20px;
  margin-bottom: 18px;
  background: var(--adh-surface);
  border: 1px solid var(--adh-border);
  border-radius: 14px;
  box-shadow: var(--adh-shadow-xs);
  flex-wrap: wrap;
  position: relative;
  overflow: hidden;
}
.adh-actives-summary::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, #16a34a 0%, #2563eb 100%);
  opacity: 0.85;
}
.adh-actives-summary-main {
  display: flex; align-items: center; gap: 14px;
}
.adh-actives-summary-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
  display: inline-flex; align-items: center; justify-content: center;
}
.adh-actives-summary-eyebrow {
  font-size: 0.6875rem;
  color: var(--adh-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  margin-bottom: 2px;
}
.adh-actives-summary-count {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--adh-text-1);
  letter-spacing: -0.025em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.adh-actives-summary-count span {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--adh-text-2);
  letter-spacing: 0;
}
.adh-actives-summary-stats {
  display: flex; align-items: center; gap: 18px;
}
.adh-actives-summary-divider {
  width: 1px; height: 32px;
  background: var(--adh-border);
}
.adh-actives-summary-stat {
  display: flex; flex-direction: column; gap: 2px;
}
.adh-actives-summary-stat .label {
  font-size: 0.6875rem;
  color: var(--adh-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.adh-actives-summary-stat .value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--adh-text-1);
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}
.adh-actives-summary-stat.is-warning .value { color: #b45309; }

/* ---- Pass grid ---- */
.adh-pass-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 14px;
}
@media (max-width: 520px) {
  .adh-pass-grid { grid-template-columns: 1fr; }
}

/* ---- Pass card ---- */
.adh-pass {
  position: relative;
  display: grid;
  grid-template-columns: 100px 1fr;
  background: var(--adh-surface);
  border: 1px solid var(--adh-border);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 180ms, transform 180ms, box-shadow 180ms;
  box-shadow: var(--adh-shadow-xs);
}
.adh-pass:hover {
  border-color: var(--adh-border-strong);
  transform: translateY(-1px);
  box-shadow: var(--adh-shadow-md);
}
.adh-pass:focus-visible {
  outline: 2px solid var(--adh-accent);
  outline-offset: 2px;
}

/* perforation-style separator between rail and body */
.adh-pass::before {
  content: '';
  position: absolute;
  left: 100px;
  top: 14px;
  bottom: 14px;
  width: 1px;
  background:
    repeating-linear-gradient(
      to bottom,
      var(--adh-border) 0,
      var(--adh-border) 4px,
      transparent 4px,
      transparent 8px
    );
}

.adh-pass.is-warning {
  border-color: #fde68a;
}
.adh-pass.is-warning::before {
  background:
    repeating-linear-gradient(
      to bottom,
      #fde68a 0,
      #fde68a 4px,
      transparent 4px,
      transparent 8px
    );
}

/* ---- Left rail ---- */
.adh-pass-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 10px;
  background: var(--adh-surface-2);
}
.adh-pass-thumb {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: white;
  border: 1px solid var(--adh-border);
  flex-shrink: 0;
}
.adh-pass-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.adh-pass-thumb.tone-success { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.adh-pass-thumb.tone-primary { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
.adh-pass-thumb.tone-warning { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.adh-pass-thumb.tone-error   { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.adh-pass-thumb.tone-info    { background: #ecfeff; color: #0e7490; border-color: #a5f3fc; }
.adh-pass-thumb.tone-violet  { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }

.adh-pass-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--adh-text-2);
  text-align: center;
  line-height: 1.2;
}

/* ---- Body ---- */
.adh-pass-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  min-width: 0;
}

.adh-pass-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.adh-pass-supplier { min-width: 0; }
.adh-pass-supplier h3 {
  margin: 0 0 3px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--adh-text-1);
  letter-spacing: -0.015em;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.adh-pass-id {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--adh-text-3);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 500;
}

.adh-pass-discount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  line-height: 1;
}
.adh-pass-discount .label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--adh-text-3);
  font-weight: 600;
  margin-bottom: 3px;
}
.adh-pass-discount strong {
  font-size: 1.5rem;
  font-weight: 700;
  color: #15803d;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
}

.adh-pass-avantage {
  margin: -4px 0 0;
  font-size: 0.8125rem;
  color: var(--adh-text-2);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---- Validity ---- */
.adh-pass-validity {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.adh-pass-validity-bar {
  width: 100%;
  height: 4px;
  background: var(--adh-surface-2);
  border-radius: 99px;
  overflow: hidden;
}
.adh-pass-validity-fill {
  height: 100%;
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
  border-radius: 99px;
  transition: width 400ms ease-out;
}
.adh-pass.is-warning .adh-pass-validity-fill {
  background: linear-gradient(90deg, #d97706 0%, #f59e0b 100%);
}

.adh-pass-validity-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: var(--adh-text-3);
  flex-wrap: wrap;
}
.adh-pass-validity-date,
.adh-pass-validity-left {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}
.adh-pass-validity-left { color: var(--adh-text-2); font-weight: 600; }
.adh-pass-validity-left.is-warning { color: #b45309; }

/* ---- Footer ---- */
.adh-pass-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--adh-border);
  flex-wrap: wrap;
}
.adh-pass-contact {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.adh-pass-contact-address {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--adh-text-3);
  min-width: 0;
}
.adh-pass-contact-address span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.adh-pass-contact-actions {
  display: inline-flex;
  gap: 6px;
}
.adh-pass-contact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--adh-surface-2);
  border: 1px solid var(--adh-border);
  color: var(--adh-text-2);
  text-decoration: none;
  transition: all 150ms;
}
.adh-pass-contact-btn:hover {
  background: white;
  color: var(--adh-accent);
  border-color: var(--adh-accent);
  transform: translateY(-1px);
}

.adh-pass-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--adh-text-2);
  transition: gap 150ms, color 150ms;
}
.adh-pass:hover .adh-pass-cta {
  color: var(--adh-accent);
  gap: 6px;
}

.adh-pass-warning-banner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  margin-top: -2px;
}
`;
