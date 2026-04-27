/* ============================================
   Mes demandes de conventions — Adherent Portal
   ============================================ */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Eye, FileClock, AlertCircle, CheckCircle2, XCircle, Ban, Clock,
  ArrowRight, RotateCcw, FileText,
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

type StatusFilter = 'all' | ConventionDemandeStatut;

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

  const counts = useMemo(() => {
    const c: Record<ConventionDemandeStatut | 'all', number> = {
      all: 0, en_attente: 0, validee: 0, refusee: 0, annulee: 0,
    };
    (demandes || []).forEach((d) => { c.all += 1; c[d.statut] += 1; });
    return c;
  }, [demandes]);

  const filtered = useMemo(() => {
    if (!demandes) return [];
    return filter === 'all' ? demandes : demandes.filter((d) => d.statut === filter);
  }, [demandes, filter]);

  return (
    <div>
      <PageHeader
        title="Mes demandes de conventions"
        description="Suivez l'état de vos demandes d'adhésion aux conventions partenaires."
      />

      {/* Status tabs */}
      <div className="adh-demandes-tabs">
        {([
          { k: 'all',         label: 'Toutes',     icon: FileText },
          { k: 'en_attente',  label: 'En attente', icon: Clock },
          { k: 'validee',     label: 'Validées',   icon: CheckCircle2 },
          { k: 'refusee',     label: 'Refusées',   icon: XCircle },
          { k: 'annulee',     label: 'Annulées',   icon: Ban },
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
            ? 'Vous n\u2019avez encore envoyé aucune demande de convention.'
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
          {filtered.map((d) => (
            <DemandeRow
              key={d.id}
              demande={d}
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

interface DemandeRowProps {
  demande: ConventionDemande;
  convention?: Convention;
  onView: () => void;
  onCancel: () => void;
  onOpenConvention: () => void;
}
function DemandeRow({ demande: d, convention, onView, onCancel, onOpenConvention }: DemandeRowProps) {
  const fournisseurNom = convention?.fournisseurNom || d.conventionSnapshot?.fournisseurNom || '—';
  const type = convention?.type || d.conventionSnapshot?.type;
  const canCancel = d.statut === 'en_attente';

  return (
    <article className="adh-demande-card">
      <div className="adh-demande-head">
        <div className="adh-demande-title">
          <h3>{fournisseurNom}</h3>
          <span className="adh-demande-meta">
            {type && CONV_TYPE_LABEL[type]}
            {' · '}Demande envoyée le {new Date(d.dateDemande).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <StatusBadge
          status={d.statut}
          tone={DEMANDE_STATUS_VARIANT[d.statut]}
          label={DEMANDE_STATUS_LABEL[d.statut]}
        />
      </div>

      <DemandeStatusMessage demande={d} />

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

function DemandeStatusMessage({ demande: d }: { demande: ConventionDemande }) {
  switch (d.statut) {
    case 'en_attente':
      return (
        <div className="adh-alert info adh-demande-msg">
          <Clock size={16} className="adh-alert-icon" />
          <div>Votre demande est en cours de traitement.</div>
        </div>
      );
    case 'validee':
      return (
        <div className="adh-alert success adh-demande-msg">
          <CheckCircle2 size={16} className="adh-alert-icon" />
          <div>
            Votre demande a été acceptée. La convention est maintenant active.
            {d.dateDecision && <> <span className="adh-demande-msg-date">(décision du {new Date(d.dateDecision).toLocaleDateString('fr-FR')})</span></>}
          </div>
        </div>
      );
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
  }
}

interface DemandeDetailsProps {
  demande: ConventionDemande;
  convention?: Convention;
  onClose: () => void;
  onOpenConvention: () => void;
  onCancel: () => void;
}
function DemandeDetails({ demande: d, convention, onClose, onOpenConvention, onCancel }: DemandeDetailsProps) {
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
              status={d.statut}
              tone={DEMANDE_STATUS_VARIANT[d.statut]}
              label={DEMANDE_STATUS_LABEL[d.statut]}
            />
          </strong>
        </div>
      </div>

      <DemandeStatusMessage demande={d} />

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
        {d.statut === 'en_attente' && (
          <Button variant="danger" size="sm" onClick={onCancel}>
            <Ban size={14} style={{ marginRight: 6 }} />
            Annuler la demande
          </Button>
        )}
        {d.statut === 'refusee' && convention && (
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
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  transition: all 150ms;
}
.adh-demande-card:hover { box-shadow: var(--shadow-sm); }
.adh-demande-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: var(--space-3); margin-bottom: var(--space-3);
  flex-wrap: wrap;
}
.adh-demande-title h3 {
  margin: 0 0 4px;
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}
.adh-demande-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
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
