/* ============================================
   Demande Convention Form — Adherent Portal
   Submitted from the convention details page or list.
   ============================================ */

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { User as UserIcon, Mail, Phone, BadgeCheck, Building2, Calendar, Percent, Tag, Paperclip, AlertCircle } from 'lucide-react';
import { Button } from '../../../../shared/ui/Button';
import { getConventionAvantageSummary } from '../../../../shared/lib/conventionWorkflow';
import { formatDate } from '../../../../shared/lib/formatters';
import type { Adherent, Convention } from '../../../../shared/types/domain';
import { CONV_TYPE_LABEL } from '../components/conventionHelpers';
import './DemandeConventionForm.css';

export interface DemandeConventionPayload {
  commentaire?: string;
  documentNom?: string;
  file?: File;
}

interface DemandeConventionFormProps {
  adherent: Adherent;
  convention: Convention;
  onSubmit: (payload: DemandeConventionPayload) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function DemandeConventionForm({
  adherent, convention, onSubmit, onCancel, submitting, errorMessage,
}: DemandeConventionFormProps) {
  const [commentaire, setCommentaire] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const documentNom = file?.name;
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const fullName = `${adherent.prenom} ${adherent.nom}`;
  const requiresDoc = (convention.documentsRequis?.length ?? 0) > 0;
  const avantage = getConventionAvantageSummary(convention);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!confirmed) {
      setConfirmError('Veuillez confirmer votre demande pour continuer.');
      return;
    }
    setConfirmError(null);
    await onSubmit({
      commentaire: commentaire.trim() || undefined,
      documentNom,
      file: file ?? undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="dcf-form">
      <section>
        <h4 className="dcf-section-title">Vos informations</h4>
        <div className="dcf-grid">
          <ReadOnlyField icon={<UserIcon size={16} />} label="Nom complet" value={fullName} />
          <ReadOnlyField icon={<Mail size={16} />} label="Email" value={adherent.email} />
          <ReadOnlyField icon={<Phone size={16} />} label="Téléphone" value={adherent.telephone || '—'} />
          <ReadOnlyField
            icon={<BadgeCheck size={16} />}
            label="Statut adhérent"
            value={adherent.status === 'actif' ? 'Adhérent actif' : 'Adhérent inactif'}
            valueTone={adherent.status === 'actif' ? 'success' : 'error'}
          />
        </div>
      </section>

      <section>
        <h4 className="dcf-section-title">Convention sélectionnée</h4>
        <div className="dcf-grid">
          <ReadOnlyField icon={<Building2 size={16} />} label="Fournisseur" value={convention.fournisseurNom} />
          <ReadOnlyField icon={<Tag size={16} />} label="Type de convention" value={CONV_TYPE_LABEL[convention.type]} />
          <ReadOnlyField
            icon={<Percent size={16} />}
            label="Avantage"
            value={avantage.subtitle ? `${avantage.title} - ${avantage.subtitle}` : avantage.title}
            valueTone="success"
          />
          <ReadOnlyField
            icon={<Calendar size={16} />}
            label="Période de validité"
            value={`${formatDate(convention.dateDebut)} -> ${formatDate(convention.dateFin)}`}
          />
        </div>
      </section>

      <section>
        <label htmlFor="dcf-commentaire" className="dcf-label">
          Commentaire <span className="dcf-optional">(facultatif)</span>
        </label>
        <textarea
          id="dcf-commentaire"
          rows={3}
          maxLength={500}
          placeholder="Précisez le contexte de votre demande, vos questions, etc."
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className="dcf-textarea"
        />
        <div className="dcf-counter">{commentaire.length} / 500</div>
      </section>

      {requiresDoc && (
        <section>
          <label className="dcf-label">
            Document justificatif{' '}
            <span className="dcf-optional">
              (recommandé — {convention.documentsRequis?.join(', ')})
            </span>
          </label>
          <label className="dcf-file">
            <Paperclip size={16} />
            <span>{documentNom ?? 'Choisir un fichier (PDF, JPG, PNG — max 5 Mo)'}</span>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={handleFileChange}
              className="dcf-file-input"
            />
          </label>
        </section>
      )}

      {errorMessage && (
        <div className="adh-alert error dcf-alert">
          <AlertCircle size={18} className="adh-alert-icon" />
          <div>{errorMessage}</div>
        </div>
      )}

      <section>
        <label className="dcf-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => { setConfirmed(e.target.checked); setConfirmError(null); }}
          />
          <span>Je confirme vouloir demander à bénéficier de cette convention.</span>
        </label>
        {confirmError && (
          <p className="dcf-confirm-error">
            {confirmError}
          </p>
        )}
      </section>

      <div className="dcf-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting} disabled={!confirmed && !submitting}>
          Envoyer la demande
        </Button>
      </div>
    </form>
  );
}

interface ReadOnlyFieldProps {
  icon: ReactNode;
  label: string;
  value: string;
  valueTone?: 'success' | 'error';
}
function ReadOnlyField({ icon, label, value, valueTone }: ReadOnlyFieldProps) {
  return (
    <div className="dcf-readonly">
      <div className="dcf-readonly-icon">{icon}</div>
      <div className="dcf-readonly-text">
        <span className="dcf-readonly-label">{label}</span>
        <span className={`dcf-readonly-value ${valueTone ? `is-${valueTone}` : ''}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
