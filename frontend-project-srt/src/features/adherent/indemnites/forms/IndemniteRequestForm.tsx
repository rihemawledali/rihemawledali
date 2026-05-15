/* ============================================
   Indemnite Request Form — Adherent Portal
   ============================================ */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ChangeEvent } from 'react';
import { Paperclip, FileText, X } from 'lucide-react';
import { indemniteRequestSchema, type IndemniteRequestFormValues } from '../../validators';
import { FormInput } from '../../../../shared/ui/FormInput';
import { FormSelect } from '../../../../shared/ui/FormSelect';
import { FormTextarea } from '../../../../shared/ui/FormTextarea';
import { Button } from '../../../../shared/ui/Button';
import type { IndemniteType } from '../../../../shared/types/domain';

const INDEMNITE_TYPES: { value: IndemniteType; label: string }[] = [
  { value: 'maladie', label: 'Maladie' },
  { value: 'naissance', label: 'Naissance' },
  { value: 'mariage', label: 'Mariage' },
  { value: 'deces', label: 'Décès' },
  { value: 'scolarite', label: 'Scolarité' },
];

interface Props {
  /** Receives form values plus the optional File for upstream multipart upload. */
  onSubmit: (values: IndemniteRequestFormValues, file?: File) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function IndemniteRequestForm({ onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<IndemniteRequestFormValues>({
    resolver: zodResolver(indemniteRequestSchema),
    defaultValues: { type: 'maladie', montant: 100, motif: '' },
  });

  const [file, setFile] = useState<File | null>(null);
  const fileMeta = file ? { name: file.name, size: file.size } : null;

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setValue('documentNom', f.name);
    setValue('documentSize', f.size);
  };

  const clearFile = () => {
    setFile(null);
    setValue('documentNom', undefined);
    setValue('documentSize', undefined);
  };

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v, file ?? undefined))} className="form-grid">
      <FormSelect 
        label="Type d'indemnité" 
        {...register('type')} 
        options={INDEMNITE_TYPES}
        error={errors.type?.message} 
      />
      <FormInput 
        label="Montant demandé (TND)" 
        type="number" 
        step="0.01"
        {...register('montant', { valueAsNumber: true })} 
        error={errors.montant?.message} 
      />
      
      <div className="form-grid-full">
        <FormTextarea 
          label="Motif / Justification" 
          rows={3}
          {...register('motif')} 
          error={errors.motif?.message} 
        />
      </div>

      <div className="form-grid-full">
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
          }}
        >
          Justificatif (certificat, acte… — obligatoire pour validation)
        </label>
        {!fileMeta ? (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Paperclip size={16} />
            <span>Cliquez pour joindre un fichier (PDF, JPG, PNG)</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </label>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-50)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <FileText size={16} style={{ color: 'var(--color-primary-700)' }} />
            <span style={{ flex: 1, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {fileMeta.name}
            </span>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>
              {(fileMeta.size / 1024).toFixed(1)} Ko
            </span>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Retirer le fichier"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>Soumettre la demande</Button>
      </div>
    </form>
  );
}
