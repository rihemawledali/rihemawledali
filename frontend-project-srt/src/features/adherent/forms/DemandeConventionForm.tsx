/* ============================================
   Demande Convention Form — Adherent Portal
   Submitted from the convention details page or list.
   ============================================ */

import { useState } from 'react';
import { User as UserIcon, Mail, Phone, BadgeCheck, Building2, Calendar, Percent, Tag, Paperclip, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { Adherent, Convention } from '../../../types/domain';
import { CONV_TYPE_LABEL } from '../conventions/conventionHelpers';

export interface DemandeConventionPayload {
  commentaire?: string;
  documentNom?: string;
  /** Actual File selected by the user (used by the page for multipart upload). */
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Adherent (read-only) */}
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
            valueColor={adherent.status === 'actif' ? 'var(--color-success-700)' : 'var(--color-error-700)'}
          />
        </div>
      </section>

      {/* Selected convention */}
      <section>
        <h4 className="dcf-section-title">Convention sélectionnée</h4>
        <div className="dcf-grid">
          <ReadOnlyField icon={<Building2 size={16} />} label="Fournisseur" value={convention.fournisseurNom} />
          <ReadOnlyField icon={<Tag size={16} />} label="Type de convention" value={CONV_TYPE_LABEL[convention.type]} />
          <ReadOnlyField
            icon={<Percent size={16} />}
            label="Avantage"
            value={convention.avantage || `${convention.remise}% de remise`}
            valueColor="var(--color-success-700)"
          />
          <ReadOnlyField
            icon={<Calendar size={16} />}
            label="Période de validité"
            value={`${new Date(convention.dateDebut).toLocaleDateString('fr-FR')} → ${new Date(convention.dateFin).toLocaleDateString('fr-FR')}`}
          />
        </div>
      </section>

      {/* Commentaire */}
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

      {/* Document */}
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
              style={{ display: 'none' }}
            />
          </label>
        </section>
      )}

      {/* API error */}
      {errorMessage && (
        <div className="adh-alert error" style={{ margin: 0 }}>
          <AlertCircle size={18} className="adh-alert-icon" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Confirmation */}
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
          <p style={{ color: 'var(--color-error-600)', fontSize: 'var(--font-size-xs)', margin: '6px 0 0 26px' }}>
            {confirmError}
          </p>
        )}
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting} disabled={!confirmed && !submitting}>
          Envoyer la demande
        </Button>
      </div>

      <style>{INLINE_STYLES}</style>
    </form>
  );
}

interface ReadOnlyFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}
function ReadOnlyField({ icon, label, value, valueColor }: ReadOnlyFieldProps) {
  return (
    <div className="dcf-readonly">
      <div className="dcf-readonly-icon">{icon}</div>
      <div className="dcf-readonly-text">
        <span className="dcf-readonly-label">{label}</span>
        <span className="dcf-readonly-value" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </span>
      </div>
    </div>
  );
}

// Inline scoped styles to keep the form self-contained
const INLINE_STYLES = `
.dcf-section-title {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.dcf-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
@media (max-width: 540px) { .dcf-grid { grid-template-columns: 1fr; } }
.dcf-readonly {
  display: flex; gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}
.dcf-readonly-icon {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: white;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}
.dcf-readonly-text { display: flex; flex-direction: column; min-width: 0; }
.dcf-readonly-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}
.dcf-readonly-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  word-break: break-word;
}
.dcf-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}
.dcf-optional {
  font-weight: 400;
  color: var(--color-text-tertiary);
}
.dcf-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font: inherit;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  background: white;
  resize: vertical;
  min-height: 80px;
}
.dcf-textarea:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}
.dcf-counter {
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-align: right;
}
.dcf-file {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-secondary);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  transition: all 150ms;
  width: 100%;
}
.dcf-file:hover {
  border-color: var(--color-primary-400);
  color: var(--color-primary-600);
}
.dcf-confirm {
  display: flex; align-items: flex-start; gap: 10px;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.4;
}
.dcf-confirm input[type="checkbox"] {
  width: 16px; height: 16px;
  margin-top: 2px;
  accent-color: var(--color-primary-500);
  cursor: pointer;
  flex-shrink: 0;
}
`;
