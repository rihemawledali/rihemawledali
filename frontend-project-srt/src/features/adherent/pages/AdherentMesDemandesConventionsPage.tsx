/* ============================================
   Mes demandes de conventions & historique — Adherent Portal
   Unified view: en_attente / validée / refusée / annulée
   plus computed final states terminée / expirée (history).
   ============================================ */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Eye, FileClock, AlertCircle, CheckCircle2, XCircle, Ban, Clock,
  ArrowRight, RotateCcw, FileText, Archive, CalendarX,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/data/Modal';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { useToast } from '../../../components/feedback/useToast';
import { conventionsApi } from '../api/conventionsApi';
import {
  CONV_TYPE_LABEL, DEMANDE_STATUS_LABEL, DEMANDE_STATUS_VARIANT,
} from '../conventions/conventionHelpers';
import type {
  Convention, ConventionDemande, ConventionDemandeStatut,
} from '../../../types/domain';

// Extended status used only for display: includes history states.
type DisplayStatus = ConventionDemandeStatut | 'terminee' | 'expiree';
type StatusFilter = 'all' | DisplayStatus;

const DISPLAY_STATUS_LABEL: Record<DisplayStatus, string> = {
  ...DEMANDE_STATUS_LABEL,
  terminee: 'Terminée',
  expiree: 'Expirée',
};
const DISPLAY_STATUS_VARIANT: Record<
  DisplayStatus,
  'success' | 'warning' | 'info' | 'neutral' | 'error'
> = {
  ...DEMANDE_STATUS_VARIANT,
  terminee: 'success',
  expiree: 'warning',
};

function computeDisplayStatus(d: ConventionDemande, conv?: Convention): DisplayStatus {
  const finExpiree = conv ? new Date(conv.dateFin) < new Date() : false;
  if (d.statut === 'validee' && finExpiree) return 'terminee';
  if (d.statut === 'en_attente' && finExpiree) return 'expiree';
  return d.statut;
}

export function AdherentMesDemandesConventionsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<ConventionDemande | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<ConventionDemande | null>(null);

  const { data: demandes, isLoading } = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });

  const { data: conventions } = useQuery({
    queryKey: ['adherent-conventions'],
    queryFn: () => conventionsApi.getConventions(),
  });

  const cancelMutation = useMutation({
    mutationFn: (demandeId: string) => conventionsApi.cancelDemande(demandeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-conventions-demandes'] });
      qc.invalidateQueries({ queryKey: ['adherent-conventions'] });
      toast.push({ title: 'Demande annulée', variant: 'success' });
      setConfirmCancel(null);
    },
    onError: (err) => {
      toast.push({
        title: err instanceof Error ? err.message : 'Échec de l\u2019annulation',
        variant: 'error',
      });
    },
  });

  const conventionMap = useMemo(() => {
    const map = new Map<string, Convention>();
    (conventions || []).forEach((c) => map.set(c.id, c));
    return map;
  }, [conventions]);

  // Annotate every demande with its display status.
  const annotated = useMemo(() => {
    return (demandes || []).map((d) => ({
      d,
      displayStatus: computeDisplayStatus(d, conventionMap.get(d.conventionId)),
    }));
  }, [demandes, conventionMap]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: 0, en_attente: 0, validee: 0, refusee: 0, annulee: 0, terminee: 0, expiree: 0,
    };
    annotated.forEach(({ displayStatus }) => { c.all += 1; c[displayStatus] += 1; });
    return c;
  }, [annotated]);

  const filtered = useMemo(() => {
    const rows = filter === 'all' ? annotated : annotated.filter((r) => r.displayStatus === filter);
    return rows;
  }, [annotated, filter]);

  return (
    <div>
      <PageHeader
        title="Mes demandes"
        description="Suivez l'état de vos demandes d'adhésion et l'historique de vos conventions."
      />

      {/* Summary strip */}
      {!isLoading && annotated.length > 0 && (
        <div className="adh-demandes-summary">
          <SummaryTile tone="primary" icon={<FileText size={18} />} label="Total" value={counts.all} />
          <SummaryTile tone="warning" icon={<Clock size={18} />} label="En attente" value={counts.en_attente} />
          <SummaryTile tone="success" icon={<CheckCircle2 size={18} />} label="Validées" value={counts.validee} />
          <SummaryTile tone="neutral" icon={<Archive size={18} />} label="Terminées" value={counts.terminee} />
        </div>
      )}

      {/* Status tabs */}
      <div className="adh-demandes-tabs">
        {([
          { k: 'all',         label: 'Toutes',     icon: FileText },
          { k: 'en_attente',  label: 'En attente', icon: Clock },
          { k: 'validee',     label: 'Validées',   icon: CheckCircle2 },
          { k: 'refusee',     label: 'Refusées',   icon: XCircle },
          { k: 'annulee',     label: 'Annulées',   icon: Ban },
          { k: 'terminee',    label: 'Terminées',  icon: Archive },
          { k: 'expiree',     label: 'Expirées',   icon: CalendarX },
        ] as const).map(({ k, label, icon: Icon }) => {
          const active = filter === k;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`adh-demandes-tab ${active ? 'is-active' : ''}`}
            >
              <Icon size={14} />
              {label}
              <span className="adh-demandes-tab-count">{counts[k]}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="adh-empty-card">
          <div className="adh-empty-icon"><FileClock size={28} /></div>
          <h3>{filter === 'all'
            ? 'Vous n\u2019avez encore aucune demande ni historique de convention.'
            : 'Aucune demande dans cette catégorie.'}
          </h3>
          <p>
            {filter === 'all'
              ? 'Parcourez les conventions disponibles et faites votre première demande.'
              : 'Modifiez le filtre pour voir d\u2019autres demandes.'}
          </p>
          <Button onClick={() => navigate('/adherent/conventions')} style={{ marginTop: 'var(--space-3)' }}>
            Voir les conventions disponibles
            <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      ) : (
        <div className="adh-demandes-list">
          {filtered.map(({ d, displayStatus }) => (
            <DemandeRow
              key={d.id}
              demande={d}
              displayStatus={displayStatus}
              convention={conventionMap.get(d.conventionId)}
              onView={() => setSelected(d)}
              onCancel={() => setConfirmCancel(d)}
              onOpenConvention={() => navigate(`/adherent/conventions/${d.conventionId}`)}
            />
          ))}
        </div>
      )}

      {/* Details modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détails de la demande"
        description={selected ? `Demande #${selected.id}` : undefined}
        size="md"
      >
        {selected && (
          <DemandeDetails
            demande={selected}
            displayStatus={computeDisplayStatus(selected, conventionMap.get(selected.conventionId))}
            convention={conventionMap.get(selected.conventionId)}
            onClose={() => setSelected(null)}
            onOpenConvention={() => { setSelected(null); navigate(`/adherent/conventions/${selected.conventionId}`); }}
            onCancel={() => { setSelected(null); setConfirmCancel(selected); }}
          />
        )}
      </Modal>

      {/* Cancel confirmation modal */}
      <Modal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        title="Annuler la demande"
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="secondary" onClick={() => setConfirmCancel(null)} disabled={cancelMutation.isPending}>
              Conserver la demande
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmCancel && cancelMutation.mutate(confirmCancel.id)}
              isLoading={cancelMutation.isPending}
            >
              <Ban size={16} style={{ marginRight: 6 }} />
              Annuler la demande
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
          Êtes-vous sûr de vouloir annuler cette demande ?
          {confirmCancel?.conventionSnapshot?.fournisseurNom && (
            <>
              <br />
              <strong>{confirmCancel.conventionSnapshot.fournisseurNom}</strong>
            </>
          )}
        </p>
        <p style={{ margin: '12px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
          Vous pourrez soumettre une nouvelle demande pour cette convention plus tard si elle est toujours disponible.
        </p>
      </Modal>

      <style>{INLINE_STYLES}</style>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function SummaryTile({
  tone, icon, label, value,
}: { tone: 'primary' | 'warning' | 'success' | 'neutral'; icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className={`adh-summary-tile tone-${tone}`}>
      <div className="adh-summary-tile-icon">{icon}</div>
      <div className="adh-summary-tile-body">
        <span className="adh-summary-tile-label">{label}</span>
        <span className="adh-summary-tile-value">{value}</span>
      </div>
    </div>
  );
}


interface DemandeRowProps {
  demande: ConventionDemande;
  displayStatus: DisplayStatus;
  convention?: Convention;
  onView: () => void;
  onCancel: () => void;
  onOpenConvention: () => void;
}
function DemandeRow({ demande: d, displayStatus, convention, onView, onCancel, onOpenConvention }: DemandeRowProps) {
  const fournisseurNom = convention?.fournisseurNom || d.conventionSnapshot?.fournisseurNom || '—';
  const type = convention?.type || d.conventionSnapshot?.type;
  const canCancel = displayStatus === 'en_attente';

  const initials = fournisseurNom
    .split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <article className={`adh-demande-card status-${displayStatus}`}>
      <div className="adh-demande-head">
        <div className="adh-demande-identity">
          <div className="adh-demande-avatar" aria-hidden="true">{initials}</div>
          <div className="adh-demande-title">
            <h3>{fournisseurNom}</h3>
            <span className="adh-demande-meta">
              {type && <span className="adh-demande-pill">{CONV_TYPE_LABEL[type]}</span>}
              <span>Envoyée le {new Date(d.dateDemande).toLocaleDateString('fr-FR')}</span>
            </span>
          </div>
        </div>
        <StatusBadge
          status={displayStatus}
          tone={DISPLAY_STATUS_VARIANT[displayStatus]}
          label={DISPLAY_STATUS_LABEL[displayStatus]}
        />
      </div>

      <DemandeStatusMessage demande={d} displayStatus={displayStatus} convention={convention} />

      <div className="adh-demande-actions">
        <Button variant="secondary" size="sm" onClick={onView}>
          <Eye size={14} style={{ marginRight: 6 }} />
          Voir détails
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenConvention}>
          <FileText size={14} style={{ marginRight: 6 }} />
          Voir la convention
        </Button>
        {canCancel && (
          <Button variant="danger" size="sm" onClick={onCancel}>
            <Ban size={14} style={{ marginRight: 6 }} />
            Annuler la demande
          </Button>
        )}
      </div>
    </article>
  );
}

function DemandeStatusMessage({
  demande: d, displayStatus, convention,
}: { demande: ConventionDemande; displayStatus: DisplayStatus; convention?: Convention }) {
  switch (displayStatus) {
    case 'en_attente':
      return (
        <div className="adh-alert info adh-demande-msg">
          <Clock size={16} className="adh-alert-icon" />
          <div>Votre demande est en cours de traitement.</div>
        </div>
      );
    case 'validee': {
      const total = d.nbTranchesSnapshot ?? convention?.nbTranches;
      const offre = d.montantOffreSnapshot ?? convention?.montantOffre;
      const payees = d.tranchesPayees ?? 0;
      const showFinancement = !!total && !!offre && total > 0;
      const mensualite = showFinancement ? offre / total : 0;
      const restantes = showFinancement ? Math.max(0, total - payees) : 0;
      const restantMontant = showFinancement ? restantes * mensualite : 0;
      const pct = showFinancement ? Math.min(100, Math.round((payees / total) * 100)) : 0;
      return (
        <div className="adh-alert success adh-demande-msg">
          <CheckCircle2 size={16} className="adh-alert-icon" />
          <div style={{ width: '100%' }}>
            Votre demande a été acceptée. La convention est maintenant active.
            {d.dateDecision && <> <span className="adh-demande-msg-date">(décision du {new Date(d.dateDecision).toLocaleDateString('fr-FR')})</span></>}
            {showFinancement && (
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  background: 'white',
                  border: '1px solid var(--color-success-100, #d1fae5)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 'var(--font-size-sm)' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>
                    {payees} / {total} tranches payées
                  </strong>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {restantes > 0
                      ? `Reste ${restantMontant.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' })}`
                      : 'Soldée'}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'var(--color-surface-secondary)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #10b981, #047857)',
                      transition: 'width 200ms ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                  Mensualité : {mensualite.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' })} · prélevée sur la paie
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    case 'refusee':
      return (
        <div className="adh-alert error adh-demande-msg">
          <AlertCircle size={16} className="adh-alert-icon" />
          <div>
            <strong>Demande refusée</strong>
            {d.motifRefus
              ? <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)' }}>Motif : {d.motifRefus}</p>
              : <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)' }}>Aucun motif n'a été précisé.</p>}
          </div>
        </div>
      );
    case 'annulee':
      return (
        <div className="adh-alert info adh-demande-msg" style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-light)' }}>
          <Ban size={16} className="adh-alert-icon" />
          <div>Demande annulée.</div>
        </div>
      );
    case 'terminee':
      return (
        <div className="adh-alert success adh-demande-msg">
          <Archive size={16} className="adh-alert-icon" />
          <div>
            Convention terminée
            {convention?.dateFin && <> le {new Date(convention.dateFin).toLocaleDateString('fr-FR')}</>}.
          </div>
        </div>
      );
    case 'expiree':
      return (
        <div className="adh-alert info adh-demande-msg" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <CalendarX size={16} className="adh-alert-icon" />
          <div>
            Convention expirée avant traitement de votre demande
            {convention?.dateFin && <> (échéance&nbsp;: {new Date(convention.dateFin).toLocaleDateString('fr-FR')})</>}.
          </div>
        </div>
      );
  }
}

interface DemandeDetailsProps {
  demande: ConventionDemande;
  displayStatus: DisplayStatus;
  convention?: Convention;
  onClose: () => void;
  onOpenConvention: () => void;
  onCancel: () => void;
}
function DemandeDetails({ demande: d, displayStatus, convention, onClose, onOpenConvention, onCancel }: DemandeDetailsProps) {
  const snap = d.conventionSnapshot;
  const fournisseurNom = convention?.fournisseurNom || snap?.fournisseurNom || '—';
  const type = convention?.type || snap?.type;
  const remise = convention?.remise ?? snap?.remise;
  const dateDebut = convention?.dateDebut || snap?.dateDebut;
  const dateFin = convention?.dateFin || snap?.dateFin;
  const avantage = convention?.avantage || snap?.avantage;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="adh-demande-summary">
        <div>
          <span>Fournisseur</span>
          <strong>{fournisseurNom}</strong>
        </div>
        {type && (
          <div>
            <span>Type</span>
            <strong>{CONV_TYPE_LABEL[type]}</strong>
          </div>
        )}
        <div>
          <span>Date de demande</span>
          <strong>{new Date(d.dateDemande).toLocaleDateString('fr-FR')}</strong>
        </div>
        {d.dateDecision && (
          <div>
            <span>Date de décision</span>
            <strong>{new Date(d.dateDecision).toLocaleDateString('fr-FR')}</strong>
          </div>
        )}
        {remise != null && (
          <div>
            <span>Avantage</span>
            <strong style={{ color: 'var(--color-success-700)' }}>
              {avantage || `${remise}% de remise`}
            </strong>
          </div>
        )}
        {dateDebut && dateFin && (
          <div>
            <span>Validité de la convention</span>
            <strong>
              {new Date(dateDebut).toLocaleDateString('fr-FR')} → {new Date(dateFin).toLocaleDateString('fr-FR')}
            </strong>
          </div>
        )}
        <div>
          <span>Statut</span>
          <strong>
            <StatusBadge
              status={displayStatus}
              tone={DISPLAY_STATUS_VARIANT[displayStatus]}
              label={DISPLAY_STATUS_LABEL[displayStatus]}
            />
          </strong>
        </div>
      </div>

      <DemandeStatusMessage demande={d} displayStatus={displayStatus} convention={convention} />

      {d.commentaire && (
        <section>
          <h4 className="adh-demande-section-title">Votre commentaire</h4>
          <p className="adh-demande-quote">{d.commentaire}</p>
        </section>
      )}
      {d.documentNom && (
        <section>
          <h4 className="adh-demande-section-title">Document fourni</h4>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
            <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {d.documentNom}
          </p>
        </section>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        {displayStatus === 'en_attente' && (
          <Button variant="danger" size="sm" onClick={onCancel}>
            <Ban size={14} style={{ marginRight: 6 }} />
            Annuler la demande
          </Button>
        )}
        {displayStatus === 'refusee' && convention && (
          <Button variant="secondary" size="sm" onClick={onOpenConvention}>
            <RotateCcw size={14} style={{ marginRight: 6 }} />
            Refaire une demande
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onOpenConvention}>
          Voir la convention
        </Button>
        <Button size="sm" onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
}

const INLINE_STYLES = `
.adh-demandes-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
@media (max-width: 720px) { .adh-demandes-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.adh-summary-tile {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(15,23,42,0.04));
  transition: transform 150ms, box-shadow 150ms;
}
.adh-summary-tile:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.adh-summary-tile-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--color-primary-50); color: var(--color-primary-700);
  flex-shrink: 0;
}
.adh-summary-tile.tone-warning .adh-summary-tile-icon { background: #fff7ed; color: #c2410c; }
.adh-summary-tile.tone-success .adh-summary-tile-icon { background: #ecfdf5; color: #047857; }
.adh-summary-tile.tone-neutral .adh-summary-tile-icon { background: var(--color-surface-secondary); color: var(--color-text-secondary); }
.adh-summary-tile-body { display: flex; flex-direction: column; min-width: 0; }
.adh-summary-tile-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-tertiary);
  font-weight: 600;
}
.adh-summary-tile-value {
  font-size: var(--font-size-xl, 20px);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.1;
}
.adh-demandes-tabs {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-bottom: var(--space-4);
  padding: 4px;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
}
.adh-demandes-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  border: none; cursor: pointer;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all 150ms;
  white-space: nowrap;
}
.adh-demandes-tab:hover { color: var(--color-text-primary); background: var(--color-surface-secondary); }
.adh-demandes-tab.is-active {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  font-weight: 600;
}
.adh-demandes-tab-count {
  display: inline-block;
  min-width: 20px; padding: 0 6px;
  border-radius: 999px;
  background: var(--color-surface-tertiary);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
}
.adh-demandes-tab.is-active .adh-demandes-tab-count {
  background: var(--color-primary-600);
  color: white;
}
.adh-demandes-list {
  display: flex; flex-direction: column; gap: var(--space-3);
}
.adh-demande-card {
  position: relative;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  transition: transform 150ms, box-shadow 150ms, border-color 150ms;
  overflow: hidden;
}
.adh-demande-card::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--color-border);
}
.adh-demande-card.status-en_attente::before { background: linear-gradient(180deg, #f59e0b, #d97706); }
.adh-demande-card.status-validee::before    { background: linear-gradient(180deg, #10b981, #047857); }
.adh-demande-card.status-refusee::before     { background: linear-gradient(180deg, #ef4444, #b91c1c); }
.adh-demande-card.status-annulee::before     { background: linear-gradient(180deg, #94a3b8, #64748b); }
.adh-demande-card.status-terminee::before    { background: linear-gradient(180deg, #6366f1, #4338ca); }
.adh-demande-card.status-expiree::before     { background: linear-gradient(180deg, #fbbf24, #b45309); }
.adh-demande-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md, 0 6px 16px rgba(15,23,42,0.06));
  border-color: var(--color-border);
}
.adh-demande-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: var(--space-3); margin-bottom: var(--space-3);
  flex-wrap: wrap;
}
.adh-demande-identity { display: flex; gap: 12px; align-items: center; min-width: 0; }
.adh-demande-avatar {
  width: 42px; height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-100), var(--color-primary-50));
  color: var(--color-primary-700);
  font-weight: 700;
  font-size: var(--font-size-sm);
  letter-spacing: 0.02em;
}
.adh-demande-title h3 {
  margin: 0 0 4px;
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}
.adh-demande-meta {
  display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
.adh-demande-pill {
  display: inline-block;
  padding: 2px 8px;
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  border-radius: 999px;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.02em;
}
.adh-demande-msg {
  margin-bottom: var(--space-3) !important;
}
.adh-demande-msg-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
.adh-demande-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.adh-demande-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}
@media (max-width: 540px) { .adh-demande-summary { grid-template-columns: 1fr; } }
.adh-demande-summary > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.adh-demande-summary span {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}
.adh-demande-summary strong {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: 600;
  word-break: break-word;
}
.adh-demande-section-title {
  margin: 0 0 8px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}
.adh-demande-quote {
  margin: 0;
  padding: var(--space-3);
  background: var(--color-surface-secondary);
  border-left: 3px solid var(--color-primary-300);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-style: italic;
  line-height: 1.5;
}
`;
