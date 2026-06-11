import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ExternalLink,
  FileSignature,
  Handshake,
  Info,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';

import { PageHeader } from '../../../../shared/layout/PageHeader';
import { Button } from '../../../../shared/ui/Button';
import { Modal } from '../../../../shared/data/Modal';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { formatCurrency } from '../../../../shared/lib/formatters';
import { getConventionAvantageSummary } from '../../../../shared/lib/conventionWorkflow';

import { conventionsApi, getAdherentConventionStatus } from '../api';
import { uploadFile } from '../../../../shared/api/apiClient';
import { profileService } from '../../../../services/profileService';

import {
  CONV_TYPE_LABEL,
  CONV_TYPE_TONE,
  ADHERENT_STATUS_LABEL,
  ADHERENT_STATUS_VARIANT,
} from '../components/conventionHelpers';

import { DemandeConventionForm } from '../forms/DemandeConventionForm';
import './AdherentConventionDetailsPage.css';

export function AdherentConventionDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [demandeOpen, setDemandeOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: convention, isLoading } = useQuery({
    queryKey: ['adherent-convention', id],
    queryFn: () => conventionsApi.getConvention(id),
    enabled: !!id,
  });

  const { data: demandes = [] } = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });

  const { data: profile } = useQuery({
    queryKey: ['adherent-profile'],
    queryFn: async () => {
      const profile = await profileService.getMe();

      return {
        id: profile.id,
        nom: profile.lastName,
        prenom: profile.firstName,
        email: profile.email,
        telephone: profile.phone ?? '',
        role: profile.role,
        status: profile.status ?? 'actif',
        matricule: profile.matricule ?? undefined,
        createdAt: profile.createdAt ?? '',
        salaire: profile.adherent?.salaire ?? 0,
        enfants: profile.adherent?.enfants ?? 0,
        marie: profile.adherent?.marie ?? false,
        dateNaissance: profile.adherent?.dateNaissance ?? undefined,
      };
    },
  });

  const createDemandeMutation = useMutation({
    mutationFn: async (payload: any) => {
      let attachmentId;

      if (payload.file) {
        const uploadedFile = await uploadFile(payload.file);
        attachmentId = uploadedFile.id;
      }

      return conventionsApi.createDemande({
        conventionId: id,
        commentaire: payload.commentaire,
        attachmentId,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions-demandes'] });
      queryClient.invalidateQueries({ queryKey: ['adherent-conventions'] });

      setDemandeOpen(false);
      setSubmitError(null);
      setConfirmationOpen(true);
    },

    onError: (error) => {
      setSubmitError(
        error instanceof Error ? error.message : 'Une erreur est survenue.'
      );
    },
  });

  if (isLoading) {
    return (
      <div className="adh-conv-details-page loading-state">
        <PageHeader title="Chargement…" />

        <div className="skeleton-loader">
          <div className="skeleton skeleton-banner" />
          <div className="skeleton skeleton-title-card" />
          <div className="skeleton-grid">
            <div className="skeleton skeleton-col-left" />
            <div className="skeleton skeleton-col-right" />
          </div>
        </div>
      </div>
    );
  }

  if (!convention) {
    return (
      <div className="adh-conv-details-page error-state">
        <PageHeader title="Convention introuvable" />

        <div className="error-card">
          <ShieldAlert size={48} className="error-icon" />
          <h2>Convention introuvable</h2>
          <p>
            La convention demandée n'existe pas ou vous n'avez pas l'autorisation
            d'y accéder.
          </p>

          <Button variant="secondary" onClick={() => navigate('/adherent/conventions')}>
            <ArrowLeft size={16} />
            Retour aux conventions
          </Button>
        </div>
      </div>
    );
  }

  const status = getAdherentConventionStatus(convention, demandes);
  const canRequest = status === 'disponible';
  const avantage = getConventionAvantageSummary(convention);

  const isDirectDiscount =
    convention.typeAvantage === 'REMISE_DIRECTE' || !convention.typeAvantage;

  const totalAmount = convention.montantOffre ?? convention.montantAvantage ?? 0;
  const pctAdherent = convention.pourcentageAdherent ?? 100;
  const pctAmicale = 100 - pctAdherent;

  const amountAdherent = (totalAmount * pctAdherent) / 100;
  const amountAmicale = (totalAmount * pctAmicale) / 100;

  return (
    <div className="adh-conv-details-page fade-in">
      <button
        className="adh-conv-back-link"
        onClick={() => navigate('/adherent/conventions')}
      >
        <ArrowLeft size={16} />
        <span>Retour aux conventions</span>
      </button>

      <div className="adh-conv-single-page-layout">
        <section className="adh-conv-card unified-main-card">
          <div className="unified-header-row">
            <div className="unified-header-text">
              <div className="adh-conv-meta-row">
                <span className={`tag tag-category tone-${CONV_TYPE_TONE[convention.type]}`}>
                  {CONV_TYPE_LABEL[convention.type]}
                </span>

                <StatusBadge
                  status={status}
                  tone={ADHERENT_STATUS_VARIANT[status]}
                  label={ADHERENT_STATUS_LABEL[status]}
                />
              </div>

              <h1>{convention.fournisseurNom}</h1>

              <p className="adh-conv-tagline">
                {convention.descriptionCourte || 'Partenaire agréé Amicale SRT'}
              </p>
            </div>

            <div className="unified-header-actions">
              {canRequest && (
                <Button variant="primary" onClick={() => setDemandeOpen(true)}>
                  <Handshake size={18} />
                  Adhérer à la convention
                </Button>
              )}

              {status === 'deja_demandee' && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/adherent/conventions/mes-demandes')}
                >
                  <FileSignature size={18} />
                  Suivre ma demande
                </Button>
              )}

              {status === 'active' && (
                <div className="active-benefit-badge">
                  <CheckCircle2 size={16} />
                  <span>Adhésion active</span>
                </div>
              )}
            </div>
          </div>

          <hr className="unified-divider" />

          <div className="unified-section-header">
            <h3>Avantages financiers</h3>
            <p>Détails des remises et conditions de prise en charge</p>
          </div>

          <div className="advantage-highlight-box">
            <div className="highlight-label">Avantage Principal</div>
            <h2>{avantage.title}</h2>
            {avantage.subtitle && <p>{avantage.subtitle}</p>}
          </div>

          {isDirectDiscount ? (
            <DirectDiscount convention={convention} />
          ) : (
            <PaymentDetails
              totalAmount={totalAmount}
              pctAdherent={pctAdherent}
              pctAmicale={pctAmicale}
              amountAdherent={amountAdherent}
              amountAmicale={amountAmicale}
              convention={convention}
            />
          )}

          {convention.description && (
            <>
              <hr className="unified-divider" />

              <div className="unified-section-header">
                <h3>Description détaillée</h3>
                <p>Présentation complète de l'offre partenaire</p>
              </div>

              <div className="description-body text-rich">
                <p>{convention.description}</p>
              </div>
            </>
          )}

          <SupplierContact convention={convention} />

          <hr className="unified-divider" />

          <div className="unified-section-header">
            <h3>Justificatifs requis</h3>
            <p>Pièces justificatives à fournir pour votre dossier d'adhésion</p>
          </div>

          {convention.documentsRequis?.length > 0 ? (
            <ul className="documents-checklist">
              {convention.documentsRequis.map((doc: string, index: number) => (
                <li key={index} className="checklist-item">
                  <div className="check-bullet">
                    <Check size={12} />
                  </div>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="documents-empty-state">
              <Info size={16} className="info-icon" />
              <span>Aucun justificatif particulier n'est requis pour cette convention.</span>
            </div>
          )}
        </section>
      </div>

      {profile && (
        <Modal
          open={demandeOpen}
          onClose={() => {
            setDemandeOpen(false);
            setSubmitError(null);
          }}
          title="Demande d'adhésion"
          description="Veuillez remplir les informations pour finaliser votre dossier."
          size="lg"
        >
          <div className="form-modal-container">
            <DemandeConventionForm
              adherent={profile as any}
              convention={convention}
              submitting={createDemandeMutation.isPending}
              errorMessage={submitError}
              onCancel={() => {
                setDemandeOpen(false);
                setSubmitError(null);
              }}
              onSubmit={(payload) => createDemandeMutation.mutateAsync(payload)}
            />
          </div>
        </Modal>
      )}

      <Modal
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        title="Félicitations !"
        size="sm"
        footer={
          <div className="adh-conv-modal-footer">
            <Button variant="secondary" onClick={() => setConfirmationOpen(false)}>
              Fermer
            </Button>

            <Button
              onClick={() => {
                setConfirmationOpen(false);
                navigate('/adherent/conventions/mes-demandes');
              }}
            >
              Suivre ma demande
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        }
      >
        <div className="adh-conv-confirmation">
          <div className="adh-conv-confirmation-icon">
            <BookmarkCheck size={32} />
          </div>

          <div className="confirmation-copy">
            <h3>Demande transmise avec succès</h3>
            <p>
              Votre dossier a été transmis au tresorier de l'Amicale. Vous pouvez
              suivre l'évolution de son traitement en temps réel.
            </p>
          </div>

          <StatusBadge status="en_attente" />
        </div>
      </Modal>
    </div>
  );
}

function DirectDiscount({ convention }: any) {
  return (
    <div className="adh-conv-discount-visual">
      <div className="discount-badge-flat">
        <span>-{convention.remise}%</span>
      </div>

      <div className="discount-copy">
        <h4>Remise immédiate en caisse</h4>
        <p>
          Bénéficiez d'une remise exclusive de{' '}
          <strong>{convention.remise}%</strong> sur vos achats chez{' '}
          <strong>{convention.fournisseurNom}</strong>. Présentez simplement votre
          carte d'adhérent active lors du passage en caisse.
        </p>
      </div>
    </div>
  );
}

function PaymentDetails({
  totalAmount,
  pctAdherent,
  pctAmicale,
  amountAdherent,
  amountAmicale,
  convention,
}: any) {
  return (
    <div className="adh-conv-finance-breakdown">
      <div className="visual-header">
        <h4>Conditions de paiement</h4>
        <span className="total-badge">{formatCurrency(totalAmount)} au total</span>
      </div>

      <div className="finance-invoice-summary">
        <div className="invoice-row">
          <span className="invoice-label">
            À la charge de l'adhérent ({pctAdherent}%)
          </span>
          <span className="invoice-amount">{formatCurrency(amountAdherent)}</span>
        </div>

        {pctAmicale > 0 && (
          <div className="invoice-row">
            <span className="invoice-label">
              Prise en charge Amicale SRT ({pctAmicale}%)
            </span>
            <span className="invoice-amount text-success">
              {formatCurrency(amountAmicale)}
            </span>
          </div>
        )}

        <div className="invoice-row is-total">
          <span className="invoice-label">Montant total</span>
          <strong className="invoice-amount">{formatCurrency(totalAmount)}</strong>
        </div>
      </div>

      <div className="adh-conv-finance-details-grid">
        <DetailPill
          title="Montant total"
          value={formatCurrency(totalAmount)}
          className="text-primary"
        />

        {convention.nombreMoisRetenue && (
          <>
            <DetailPill
              title="Durée de remboursement"
              value={`${convention.nombreMoisRetenue} mois`}
            />

            <DetailPill
              title="Mensualité prélevée"
              value={`${formatCurrency(amountAdherent / convention.nombreMoisRetenue)}/mois`}
              className="text-success"
            />
          </>
        )}

        {convention.nbTranches && (
          <DetailPill
            title="Nombre de tranches"
            value={`${convention.nbTranches} tranches`}
          />
        )}
      </div>
    </div>
  );
}

function DetailPill({ title, value, className = '' }: any) {
  return (
    <div className="detail-pill">
      <span className="pill-title">{title}</span>
      <strong className={`pill-value ${className}`}>{value}</strong>
    </div>
  );
}

function SupplierContact({ convention }: any) {
  const hasContact =
    convention.fournisseurAdresse ||
    convention.fournisseurTelephone ||
    convention.fournisseurEmail ||
    convention.fournisseurContact;

  if (!hasContact) return null;

  return (
    <>
      <hr className="unified-divider" />

      <div className="unified-section-header">
        <h3>Coordonnées du partenaire</h3>
        <p>Contact et localisation physique du fournisseur</p>
      </div>

      <div className="supplier-details-list-horizontal">
        {convention.fournisseurContact && (
          <ContactItem
            icon={<UserIcon size={16} />}
            label="Contact principal"
            value={convention.fournisseurContact}
          />
        )}

        {convention.fournisseurAdresse && (
          <ContactItem
            icon={<MapPin size={16} />}
            label="Adresse"
            value={convention.fournisseurAdresse}
          />
        )}

        {convention.fournisseurTelephone && (
          <ContactItem
            icon={<Phone size={16} />}
            label="Téléphone"
            value={convention.fournisseurTelephone}
            href={`tel:${convention.fournisseurTelephone}`}
          />
        )}

        {convention.fournisseurEmail && (
          <ContactItem
            icon={<Mail size={16} />}
            label="Email"
            value={convention.fournisseurEmail}
            href={`mailto:${convention.fournisseurEmail}`}
          />
        )}
      </div>
    </>
  );
}

function ContactItem({ icon, label, value, href }: any) {
  return (
    <div className="contact-item">
      <div className="contact-icon">{icon}</div>

      <div className="contact-content">
        <span className="contact-label">{label}</span>

        {href ? (
          <a href={href} className="contact-link">
            <span>{value}</span>
            <ExternalLink size={12} className="link-arrow" />
          </a>
        ) : (
          <strong className="contact-value">{value}</strong>
        )}
      </div>
    </div>
  );
}