/* ============================================
   Détails de la convention — Adherent Portal
   ============================================ */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, User as UserIcon,
  Calendar, Percent, FileText, Info, AlertTriangle, Handshake,
  CheckCircle2, ListChecks, Paperclip,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/data/Modal';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { conventionsApi, getAdherentConventionStatus } from '../api/conventionsApi';
import { profileApi } from '../api/profileApi';
import {
  CONV_TYPE_LABEL, CONV_TYPE_ICON, CONV_TYPE_TONE,
  ADHERENT_STATUS_LABEL, ADHERENT_STATUS_VARIANT,
} from '../conventions/conventionHelpers';
import { DemandeConventionForm } from '../forms/DemandeConventionForm';

const DEFAULT_CONDITIONS = [
  'Être un adhérent actif de l\u2019Amicale',
  'Respecter la période de validité',
  'Présenter une confirmation d\u2019adhésion si nécessaire',
  'Respecter les conditions du fournisseur',
];

export function AdherentConventionDetailsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [demandeOpen, setDemandeOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const { data: convention, isLoading } = useQuery({
    queryKey: ['adherent-convention', id],
    queryFn: () => conventionsApi.getConvention(id),
    enabled: !!id,
  });

  const { data: demandes } = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });

  const { data: profile } = useQuery({
    queryKey: ['adherent-profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const createDemandeMutation = useMutation({
    mutationFn: (req: { commentaire?: string; documentNom?: string }) =>
      conventionsApi.createDemande({ conventionId: id, ...req }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-conventions-demandes'] });
      qc.invalidateQueries({ queryKey: ['adherent-conventions'] });
      setDemandeOpen(false);
      setSubmitError(null);
      setConfirmationOpen(true);
    },
    onError: (err) => {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    },
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Chargement…" />
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!convention) {
    return (
      <div>
        <PageHeader title="Convention introuvable" />
        <div className="adh-empty-card">
          <div className="adh-empty-icon"><AlertTriangle size={28} /></div>
          <h3>Cette convention n'existe pas ou a été retirée.</h3>
          <Button variant="secondary" onClick={() => navigate('/adherent/conventions')} style={{ marginTop: 'var(--space-3)' }}>
            <ArrowLeft size={14} style={{ marginRight: 6 }} />
            Retour aux conventions
          </Button>
        </div>
      </div>
    );
  }

  const adherentStatus = getAdherentConventionStatus(convention, demandes || []);
  const Icon = CONV_TYPE_ICON[convention.type];
  const tone = CONV_TYPE_TONE[convention.type];

  const today = new Date();
  const finDate = new Date(convention.dateFin);
  const daysLeft = Math.ceil((finDate.getTime() - today.getTime()) / 86400000);
  const expiringSoon = daysLeft > 0 && daysLeft < 60;

  const canRequest = adherentStatus === 'disponible';

  const conditionsList = (convention.conditionsList && convention.conditionsList.length > 0)
    ? convention.conditionsList
    : DEFAULT_CONDITIONS;

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/adherent/conventions')}
        style={{ marginBottom: 'var(--space-3)' }}
      >
        <ArrowLeft size={16} style={{ marginRight: 6 }} />
        Retour aux conventions
      </Button>

      <PageHeader title={convention.fournisseurNom} description={CONV_TYPE_LABEL[convention.type]} />

      {/* Hero card */}
      <div className="adh-conv-hero">
        <div className={`adh-tile-icon tone-${tone}`} style={{ width: 56, height: 56 }}>
          <Icon size={28} />
        </div>
        <div className="adh-conv-hero-text">
          <div className="adh-conv-hero-tags">
            <span className="adh-offer-tag">{CONV_TYPE_LABEL[convention.type]}</span>
            <StatusBadge
              status={adherentStatus}
              tone={ADHERENT_STATUS_VARIANT[adherentStatus]}
              label={ADHERENT_STATUS_LABEL[adherentStatus]}
            />
          </div>
          <h2 className="adh-conv-hero-title">{convention.fournisseurNom}</h2>
          {convention.descriptionCourte && (
            <p className="adh-conv-hero-sub">{convention.descriptionCourte}</p>
          )}
        </div>
        <div className="adh-conv-hero-discount">
          <span>Avantage</span>
          <strong>−{convention.remise}%</strong>
        </div>
      </div>

      {expiringSoon && (
        <div className="adh-alert warning" style={{ marginTop: 'var(--space-4)' }}>
          <AlertTriangle size={18} className="adh-alert-icon" />
          <div>
            <strong>Cette convention expire bientôt</strong> — Plus que {daysLeft} jour(s) avant la fin de validité.
          </div>
        </div>
      )}

      <div className="adh-conv-grid">
        <div className="adh-conv-main">
          {/* Description */}
          {convention.description && (
            <section className="adh-conv-section">
              <h3 className="adh-conv-section-title"><FileText size={16} /> Description complète</h3>
              <p className="adh-conv-paragraph">{convention.description}</p>
            </section>
          )}

          {/* Avantage */}
          <section className="adh-conv-section">
            <h3 className="adh-conv-section-title"><Percent size={16} /> Avantage proposé</h3>
            <div className="adh-conv-highlight">
              <strong>{convention.avantage || `${convention.remise}% de remise`}</strong>
              <span>Remise effective : {convention.remise}%</span>
            </div>
          </section>

          {/* Conditions */}
          <section className="adh-conv-section">
            <h3 className="adh-conv-section-title"><ListChecks size={16} /> Conditions d'utilisation</h3>
            <ul className="adh-conv-list">
              {conditionsList.map((cond, i) => (
                <li key={i}>
                  <CheckCircle2 size={16} />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Documents requis */}
          {convention.documentsRequis && convention.documentsRequis.length > 0 && (
            <section className="adh-conv-section">
              <h3 className="adh-conv-section-title"><Paperclip size={16} /> Documents nécessaires</h3>
              <ul className="adh-conv-list">
                {convention.documentsRequis.map((doc, i) => (
                  <li key={i}>
                    <Paperclip size={14} />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Important notice */}
          <section className="adh-alert info" style={{ marginTop: 'var(--space-2)' }}>
            <Info size={18} className="adh-alert-icon" />
            <div>
              <strong>Informations importantes</strong>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)' }}>
                Votre demande doit être validée par l'administration de l'Amicale avant que vous ne puissiez bénéficier de
                cette convention. Vous serez notifié dès qu'une décision sera prise. Vous pourrez suivre l'état de votre
                demande dans la rubrique « Mes demandes de conventions ».
              </p>
            </div>
          </section>
        </div>

        <aside className="adh-conv-aside">
          {/* Validity & status */}
          <div className="adh-conv-card">
            <h4>Période de validité</h4>
            <div className="adh-conv-info-row">
              <Calendar size={14} />
              <div>
                <span>Date de début</span>
                <strong>{new Date(convention.dateDebut).toLocaleDateString('fr-FR')}</strong>
              </div>
            </div>
            <div className="adh-conv-info-row">
              <Calendar size={14} />
              <div>
                <span>Date de fin</span>
                <strong>{new Date(convention.dateFin).toLocaleDateString('fr-FR')}</strong>
              </div>
            </div>
            <div className="adh-conv-info-row">
              <Info size={14} />
              <div>
                <span>Statut convention</span>
                <strong><StatusBadge status={convention.statut} /></strong>
              </div>
            </div>
          </div>

          {/* Supplier contact */}
          {(convention.fournisseurAdresse || convention.fournisseurTelephone || convention.fournisseurEmail || convention.fournisseurContact) && (
            <div className="adh-conv-card">
              <h4>Coordonnées du fournisseur</h4>
              {convention.fournisseurContact && (
                <div className="adh-conv-info-row">
                  <UserIcon size={14} />
                  <div><span>Contact</span><strong>{convention.fournisseurContact}</strong></div>
                </div>
              )}
              {convention.fournisseurAdresse && (
                <div className="adh-conv-info-row">
                  <MapPin size={14} />
                  <div><span>Adresse</span><strong>{convention.fournisseurAdresse}</strong></div>
                </div>
              )}
              {convention.fournisseurTelephone && (
                <div className="adh-conv-info-row">
                  <Phone size={14} />
                  <div>
                    <span>Téléphone</span>
                    <a href={`tel:${convention.fournisseurTelephone}`} className="adh-conv-link">
                      {convention.fournisseurTelephone}
                    </a>
                  </div>
                </div>
              )}
              {convention.fournisseurEmail && (
                <div className="adh-conv-info-row">
                  <Mail size={14} />
                  <div>
                    <span>Email</span>
                    <a href={`mailto:${convention.fournisseurEmail}`} className="adh-conv-link">
                      {convention.fournisseurEmail}
                    </a>
                  </div>
                </div>
              )}
              {convention.fournisseurId && (
                <div className="adh-conv-info-row">
                  <Building2 size={14} />
                  <div><span>Référence fournisseur</span><strong>{convention.fournisseurId}</strong></div>
                </div>
              )}
            </div>
          )}

          {/* Action panel */}
          <div className="adh-conv-card adh-conv-card-action">
            {canRequest ? (
              <>
                <p>Vous pouvez demander à bénéficier de cette convention.</p>
                <Button onClick={() => setDemandeOpen(true)} style={{ width: '100%' }}>
                  <Handshake size={16} style={{ marginRight: 8 }} />
                  Demander l'adhésion
                </Button>
              </>
            ) : adherentStatus === 'deja_demandee' ? (
              <>
                <div className="adh-alert warning" style={{ margin: 0 }}>
                  <AlertTriangle size={18} className="adh-alert-icon" />
                  <div>Vous avez déjà une demande en cours pour cette convention.</div>
                </div>
                <Button variant="secondary" onClick={() => navigate('/adherent/conventions/mes-demandes')} style={{ width: '100%', marginTop: 12 }}>
                  Voir mes demandes
                </Button>
              </>
            ) : adherentStatus === 'active' ? (
              <>
                <div className="adh-alert success" style={{ margin: 0 }}>
                  <CheckCircle2 size={18} className="adh-alert-icon" />
                  <div>Cette convention est <strong>active</strong> pour vous. Vous pouvez en bénéficier.</div>
                </div>
                <Button variant="secondary" onClick={() => navigate('/adherent/conventions/actives')} style={{ width: '100%', marginTop: 12 }}>
                  Mes conventions actives
                </Button>
              </>
            ) : (
              <>
                <Button disabled style={{ width: '100%' }}>
                  Cette convention n'est pas disponible actuellement.
                </Button>
                <Button variant="secondary" onClick={() => navigate('/adherent/conventions')} style={{ width: '100%', marginTop: 8 }}>
                  Retour aux conventions
                </Button>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Demande modal */}
      {profile && (
        <Modal
          open={demandeOpen}
          onClose={() => { setDemandeOpen(false); setSubmitError(null); }}
          title="Demande d'adhésion à une convention"
          description="Vérifiez les informations puis confirmez votre demande."
          size="lg"
        >
          <DemandeConventionForm
            adherent={profile}
            convention={convention}
            submitting={createDemandeMutation.isPending}
            errorMessage={submitError}
            onCancel={() => { setDemandeOpen(false); setSubmitError(null); }}
            onSubmit={async (payload) => { await createDemandeMutation.mutateAsync(payload); }}
          />
        </Modal>
      )}

      {/* Confirmation modal */}
      <Modal
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        title="Demande envoyée"
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button variant="secondary" onClick={() => setConfirmationOpen(false)}>Fermer</Button>
            <Button onClick={() => { setConfirmationOpen(false); navigate('/adherent/conventions/mes-demandes'); }}>
              Voir mes demandes
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center', textAlign: 'center' }}>
          <div className="adh-tile-icon tone-success" style={{ width: 56, height: 56 }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
              Votre demande a été envoyée avec succès.
            </h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Vous pouvez suivre son état dans la rubrique <strong>Mes demandes de conventions</strong>.
            </p>
          </div>
          <StatusBadge status="en_attente" />
        </div>
      </Modal>

      <style>{INLINE_STYLES}</style>
    </div>
  );
}

const INLINE_STYLES = `
.adh-conv-hero {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-5);
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.adh-conv-hero-text { flex: 1; min-width: 240px; }
.adh-conv-hero-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.adh-conv-hero-title {
  margin: 0; font-size: var(--font-size-xl);
  color: var(--color-text-primary); font-weight: 700;
}
.adh-conv-hero-sub {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.adh-conv-hero-discount {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, var(--color-success-50), var(--color-success-100));
  border-radius: var(--radius-lg);
  min-width: 120px;
}
.adh-conv-hero-discount span {
  font-size: var(--font-size-xs);
  color: var(--color-success-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.adh-conv-hero-discount strong {
  font-size: var(--font-size-2xl);
  color: var(--color-success-700);
  font-weight: 800;
}
.adh-conv-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
@media (max-width: 920px) { .adh-conv-grid { grid-template-columns: 1fr; } }
.adh-conv-main { display: flex; flex-direction: column; gap: var(--space-4); }
.adh-conv-aside { display: flex; flex-direction: column; gap: var(--space-3); }
.adh-conv-section {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
}
.adh-conv-section-title {
  display: flex; align-items: center; gap: 8px;
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}
.adh-conv-paragraph {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--color-text-primary);
}
.adh-conv-highlight {
  display: flex; flex-direction: column; gap: 4px;
  padding: var(--space-3) var(--space-4);
  background: var(--color-success-50);
  border: 1px solid var(--color-success-100);
  border-radius: var(--radius-md);
  color: var(--color-success-700);
}
.adh-conv-highlight strong { font-size: var(--font-size-base); }
.adh-conv-highlight span { font-size: var(--font-size-xs); color: var(--color-success-600); }
.adh-conv-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 8px;
}
.adh-conv-list li {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.5;
}
.adh-conv-list li svg {
  color: var(--color-success-500);
  flex-shrink: 0;
  margin-top: 2px;
}
.adh-conv-card {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.adh-conv-card h4 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}
.adh-conv-info-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 0;
}
.adh-conv-info-row svg {
  color: var(--color-text-tertiary);
  margin-top: 4px;
  flex-shrink: 0;
}
.adh-conv-info-row > div {
  display: flex; flex-direction: column; min-width: 0; flex: 1;
}
.adh-conv-info-row span {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.adh-conv-info-row strong {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: 600;
  word-break: break-word;
}
.adh-conv-link {
  font-size: var(--font-size-sm);
  color: var(--color-primary-600);
  text-decoration: none;
  font-weight: 600;
}
.adh-conv-link:hover { text-decoration: underline; }
.adh-conv-card-action p {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
`;
