/* ============================================
   Détails de la convention — Adherent Portal
   ============================================ */

import { useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, User as UserIcon,
  Calendar, Percent, FileText, Info, AlertTriangle, Handshake,
  CheckCircle2, ListChecks, Paperclip, CreditCard,
} from 'lucide-react';
import { getConventionAvantageSummary } from '../../../../shared/lib/conventionWorkflow';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { Button } from '../../../../shared/ui/Button';
import { Modal } from '../../../../shared/data/Modal';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { conventionsApi, getAdherentConventionStatus } from '../api';
import { uploadFile } from '../../../../shared/api/apiClient';
import { profileService, type ProfileResponse } from '../../../../services/profileService';
import type { Adherent } from '../../../../shared/types/domain';
import type { DemandeConventionPayload } from '../forms/DemandeConventionForm';
import {
  CONV_TYPE_LABEL, CONV_TYPE_ICON, CONV_TYPE_TONE,
  ADHERENT_STATUS_LABEL, ADHERENT_STATUS_VARIANT,
} from '../components/conventionHelpers';
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
    queryFn: async () => mapProfileToAdherent(await profileService.getMe()),
  });

  const createDemandeMutation = useMutation({
    mutationFn: async (payload: DemandeConventionPayload) => {
      let attachmentId: string | undefined;
      if (payload.file) {
        const att = await uploadFile(payload.file);
        attachmentId = att.id;
      }
      return conventionsApi.createDemande({
        conventionId: id,
        commentaire: payload.commentaire,
        attachmentId,
      });
    },
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
  const avantage = getConventionAvantageSummary(convention);
  const validityLabel = `${new Date(convention.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(convention.dateFin).toLocaleDateString('fr-FR')}`;
  const actionTitle = canRequest
    ? 'Demande disponible'
    : adherentStatus === 'deja_demandee'
      ? 'Demande en cours'
      : adherentStatus === 'active'
        ? 'Convention active'
        : 'Acces indisponible';

  return (
    <div className="adh-conv-detail">
      <PageHeader
        title="Dossier convention"
        description={`${convention.fournisseurNom} - ${CONV_TYPE_LABEL[convention.type]}`}
        breadcrumb={['Adherent', 'Conventions', convention.fournisseurNom]}
        actions={(
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/adherent/conventions')}
          >
            <ArrowLeft size={16} />
            Retour
          </Button>
        )}
      />

      {/* Cover banner */}
      {convention.imageUrl && (
        <div className="adh-conv-banner">
          <img
            src={convention.imageUrl}
            alt={convention.fournisseurNom}
            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
          />
          <div className="adh-conv-banner-discount">{avantage.title}</div>
        </div>
      )}

      <section className="adh-conv-overview-grid">
        <div className="adh-conv-panel adh-conv-panel--main">
          <div className="adh-conv-panel-header">
            <div>
              <span className="adh-conv-eyebrow">Convention fournisseur</span>
              <h2>{convention.fournisseurNom}</h2>
            </div>
            <span className={`adh-conv-panel-icon tone-${tone}`}>
              <Icon size={22} />
            </span>
          </div>

          <strong className="adh-conv-primary-value">{avantage.title}</strong>
          {convention.descriptionCourte && (
            <p className="adh-conv-panel-note">{convention.descriptionCourte}</p>
          )}

          <div className="adh-conv-metric-grid">
            <DashboardMetric
              icon={<Percent size={16} />}
              label="Type d'avantage"
              value={avantage.label}
              tone="success"
            />
            <DashboardMetric
              icon={<Calendar size={16} />}
              label="Validite"
              value={validityLabel}
              tone={expiringSoon ? 'warning' : 'primary'}
            />
            <DashboardMetric
              icon={<Info size={16} />}
              label="Statut"
              value={<StatusBadge status={convention.statut} />}
              tone="neutral"
            />
          </div>
        </div>

        <div className="adh-conv-panel">
          <div className="adh-conv-panel-header">
            <div>
              <span className="adh-conv-eyebrow">Suivi adherent</span>
              <h2>{actionTitle}</h2>
            </div>
            <StatusBadge
              status={adherentStatus}
              tone={ADHERENT_STATUS_VARIANT[adherentStatus]}
              label={ADHERENT_STATUS_LABEL[adherentStatus]}
            />
          </div>

          <div className="adh-conv-action-stack">
            {canRequest ? (
              <>
                <p>La convention est disponible pour une nouvelle demande.</p>
                <Button onClick={() => setDemandeOpen(true)} style={{ width: '100%' }}>
                  <Handshake size={16} />
                  Demander la convention
                </Button>
              </>
            ) : adherentStatus === 'deja_demandee' ? (
              <>
                <p>Une demande est deja en attente de decision.</p>
                <Button variant="secondary" onClick={() => navigate('/adherent/conventions/mes-demandes')} style={{ width: '100%' }}>
                  Voir mes demandes
                </Button>
              </>
            ) : adherentStatus === 'active' ? (
              <p>Cette convention est active pour votre compte adherent.</p>
            ) : (
              <>
                <p>Cette convention n'est pas ouverte aux demandes actuellement.</p>
                <Button variant="secondary" onClick={() => navigate('/adherent/conventions')} style={{ width: '100%' }}>
                  Retour aux conventions
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

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
              <SectionHeader title="Description" subtitle="Informations communiquees par le fournisseur." icon={<FileText size={16} />} />
              <p className="adh-conv-paragraph">{convention.description}</p>
            </section>
          )}

          {/* Avantage */}
          <section className="adh-conv-section">
            <SectionHeader title="Avantage" subtitle="Synthese de la prise en charge et des montants." icon={<Percent size={16} />} />
            <div className="adh-conv-highlight">
              <strong>{avantage.title}</strong>
              {avantage.subtitle && <span>{avantage.subtitle}</span>}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-3)',
              }}
            >
              {avantage.rows.map((row, index) => (
                <FinancementCard
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  icon={index === 0 ? <CreditCard size={16} /> : <Calendar size={16} />}
                  highlight={index === 0}
                />
              ))}
            </div>
          </section>

          {/* Conditions */}
          <section className="adh-conv-section">
            <SectionHeader title="Conditions" subtitle="Points a respecter avant validation." icon={<ListChecks size={16} />} />
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
              <SectionHeader title="Documents requis" subtitle="Pieces a joindre si le fournisseur les demande." icon={<Paperclip size={16} />} />
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
                Votre demande doit etre validee avant utilisation de la convention. Le suivi reste disponible dans
                la rubrique Mes demandes de conventions.
              </p>
            </div>
          </section>
        </div>

        <aside className="adh-conv-aside">
          {/* Validity & status */}
          <div className="adh-conv-card">
            <h4>Validite</h4>
            <div className="adh-conv-info-row">
              <Calendar size={14} />
              <div>
                <span>Debut</span>
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
                <span>Statut</span>
                <strong><StatusBadge status={convention.statut} /></strong>
              </div>
            </div>
          </div>

          {/* Supplier contact */}
          {(convention.fournisseurAdresse || convention.fournisseurTelephone || convention.fournisseurEmail || convention.fournisseurContact) && (
            <div className="adh-conv-card">
              <h4>Fournisseur</h4>
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
                    <span>Telephone</span>
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
                  <div><span>Reference</span><strong>{convention.fournisseurId}</strong></div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Demande modal */}
      {profile && (
        <Modal
          open={demandeOpen}
          onClose={() => { setDemandeOpen(false); setSubmitError(null); }}
          title="Demande d'adhésion à une convention"
          description="Verifiez les informations puis confirmez votre demande."
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
              Votre demande a ete envoyee.
            </h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Le suivi est disponible dans la rubrique <strong>Mes demandes de conventions</strong>.
            </p>
          </div>
          <StatusBadge status="en_attente" />
        </div>
      </Modal>

      <style>{INLINE_STYLES}</style>
    </div>
  );
}

function DashboardMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
}) {
  return (
    <div className={`adh-conv-dashboard-metric adh-conv-dashboard-metric--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <header className="adh-conv-section-header">
      <div>
        <h3>{icon}{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}

function mapProfileToAdherent(profile: ProfileResponse): Adherent {
  return {
    id: profile.id,
    nom: profile.lastName,
    prenom: profile.firstName,
    email: profile.email,
    telephone: profile.phone ?? '',
    role: profile.role,
    status: (profile.status ?? 'actif') as Adherent['status'],
    matricule: profile.matricule ?? undefined,
    createdAt: profile.createdAt ?? '',
    salaire: profile.adherent?.salaire ?? 0,
    enfants: profile.adherent?.enfants ?? 0,
    marie: profile.adherent?.marie ?? false,
    dateNaissance: profile.adherent?.dateNaissance ?? undefined,
  };
}

function FinancementCard({
  label, value, icon, highlight,
}: { label: string; value: string; icon: ReactNode; highlight?: boolean }) {
  return (
    <div
      style={{
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${highlight ? 'var(--color-primary-200)' : 'var(--color-border-light)'}`,
        background: highlight ? 'var(--color-primary-50)' : 'var(--color-surface-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          textTransform: 'uppercase',
          letterSpacing: 0,
          color: 'var(--color-text-tertiary)',
          fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ color: highlight ? 'var(--color-primary-700)' : 'var(--color-text-secondary)' }}>
          {icon}
        </span>
        {label}
      </span>
      <strong
        style={{
          fontSize: highlight ? 18 : 16,
          color: highlight ? 'var(--color-primary-800)' : 'var(--color-text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const INLINE_STYLES = `
.adh-conv-detail {
  display: grid;
  gap: var(--space-5);
}
.adh-conv-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.9fr);
  gap: var(--space-4);
}
.adh-conv-panel,
.adh-conv-section,
.adh-conv-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}
.adh-conv-panel,
.adh-conv-section {
  padding: var(--space-5);
}
.adh-conv-card {
  padding: var(--space-4);
}
.adh-conv-panel--main {
  border-color: var(--color-primary-100);
}
.adh-conv-panel-header,
.adh-conv-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.adh-conv-section-header {
  margin-bottom: var(--space-4);
}
.adh-conv-eyebrow {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0;
}
.adh-conv-panel-header h2,
.adh-conv-section-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}
.adh-conv-panel-header h2 {
  font-size: var(--font-size-lg);
}
.adh-conv-section-header h3 {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-md);
}
.adh-conv-section-header p {
  margin: 3px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.adh-conv-panel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: var(--radius-md);
}
.adh-conv-panel-icon.tone-sante,
.adh-conv-panel-icon.tone-commerce,
.adh-conv-panel-icon.tone-primary {
  color: var(--color-primary-700);
  background: var(--color-primary-50);
}
.adh-conv-panel-icon.tone-info {
  color: var(--color-info-700);
  background: var(--color-info-50);
}
.adh-conv-panel-icon.tone-restauration,
.adh-conv-panel-icon.tone-loisir,
.adh-conv-panel-icon.tone-warning {
  color: var(--color-warning-700);
  background: var(--color-warning-50);
}
.adh-conv-panel-icon.tone-error {
  color: var(--color-error-700);
  background: var(--color-error-50);
}
.adh-conv-panel-icon.tone-violet {
  color: var(--color-primary-700);
  background: var(--color-primary-50);
}
.adh-conv-panel-icon.tone-transport,
.adh-conv-panel-icon.tone-education,
.adh-conv-panel-icon.tone-success {
  color: var(--color-success-700);
  background: var(--color-success-50);
}
.adh-conv-primary-value {
  display: block;
  margin: var(--space-5) 0 var(--space-2);
  color: var(--color-text-primary);
  font-size: clamp(1.5rem, 3vw, 2.15rem);
  line-height: var(--line-height-tight);
}
.adh-conv-panel-note {
  margin: 0 0 var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.adh-conv-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}
.adh-conv-dashboard-metric {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-3);
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}
.adh-conv-dashboard-metric > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: var(--radius-md);
}
.adh-conv-dashboard-metric--primary > span {
  color: var(--color-primary-700);
  background: var(--color-primary-50);
}
.adh-conv-dashboard-metric--success > span {
  color: var(--color-success-700);
  background: var(--color-success-50);
}
.adh-conv-dashboard-metric--warning > span {
  color: var(--color-warning-700);
  background: var(--color-warning-50);
}
.adh-conv-dashboard-metric--neutral > span {
  color: var(--color-text-secondary);
  background: var(--color-surface);
}
.adh-conv-dashboard-metric p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0;
}
.adh-conv-dashboard-metric strong {
  display: block;
  margin-top: 2px;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  overflow-wrap: anywhere;
}
.adh-conv-action-stack {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.adh-conv-action-stack p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.adh-conv-banner {
  position: relative;
  width: 100%;
  aspect-ratio: 21 / 8;
  max-height: 280px;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
  border: 1px solid var(--adh-border);
  box-shadow: var(--adh-shadow-xs);
  background: var(--adh-surface-2);
}
.adh-conv-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.adh-conv-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.25) 100%);
  pointer-events: none;
}
.adh-conv-banner-discount {
  position: absolute;
  bottom: 14px;
  right: 14px;
  background: #16a34a;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 10px;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 6px 18px -4px rgba(22, 163, 74, 0.5),
              0 0 0 1px rgba(22, 163, 74, 0.20);
  z-index: 1;
}
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
  letter-spacing: 0;
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
  letter-spacing: 0;
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
  letter-spacing: 0;
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
  letter-spacing: 0;
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
@media (max-width: 1180px) {
  .adh-conv-overview-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 820px) {
  .adh-conv-metric-grid {
    grid-template-columns: 1fr;
  }
  .adh-conv-panel-header,
  .adh-conv-section-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 640px) {
  .adh-conv-panel,
  .adh-conv-section {
    padding: var(--space-4);
  }
  .adh-conv-primary-value {
    font-size: var(--font-size-2xl);
  }
}
.adh-conv-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  padding: var(--space-5);
}
.adh-conv-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}
.adh-conv-card h4,
.adh-conv-info-row span,
.adh-conv-hero-discount span,
.adh-conv-section-title {
  letter-spacing: 0;
}
`;
