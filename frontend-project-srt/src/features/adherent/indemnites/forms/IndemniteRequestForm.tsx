/* ============================================
   Indemnite Request Form - Adherent Portal
   ============================================ */

import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Paperclip, FileText, X } from 'lucide-react';
import { indemniteRequestSchema, type IndemniteRequestFormValues } from '../../validators';
import { FormInput } from '../../../../shared/ui/FormInput';
import { FormSelect } from '../../../../shared/ui/FormSelect';
import { FormTextarea } from '../../../../shared/ui/FormTextarea';
import { Button } from '../../../../shared/ui/Button';
import type { IndemniteType } from '../../../../shared/types/domain';
import './IndemniteRequestForm.css';

const INDEMNITE_TYPES: { value: IndemniteType; label: string }[] = [
  { value: 'maladie', label: 'Maladie' },
  { value: 'naissance', label: 'Naissance' },
  { value: 'mariage', label: 'Mariage' },
  { value: 'deces', label: 'Décès' },
  { value: 'scolarite', label: 'Scolarité' },
];

interface Props {
  onSubmit: (values: IndemniteRequestFormValues, file?: File) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function IndemniteRequestForm({ onSubmit, onCancel, submitting }: Props) {
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<IndemniteRequestFormValues>({
    resolver: zodResolver(indemniteRequestSchema),
    defaultValues: { type: 'maladie', montant: 100, motif: '' },
  });

  const fileName = file?.name;
  const fileSize = file ? `${(file.size / 1024).toFixed(1)} Ko` : '';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValue('documentNom', selectedFile.name);
    setValue('documentSize', selectedFile.size);
  };

  const clearFile = () => {
    setFile(null);
    setValue('documentNom', undefined);
    setValue('documentSize', undefined);
  };

  const submitForm = (values: IndemniteRequestFormValues) => {
    return onSubmit(values, file ?? undefined);
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="form-grid">
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
        <label className="indemnite-file-label">
          Justificatif (certificat, acte... - obligatoire pour validation)
        </label>

        {!file ? (
          <label className="indemnite-file-drop">
            <Paperclip size={16} />
            <span>Cliquez pour joindre un fichier (PDF, JPG, PNG)</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="indemnite-file-input"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="indemnite-file-preview">
            <FileText size={16} className="indemnite-file-icon" />
            <span className="indemnite-file-name">{fileName}</span>
            <span className="indemnite-file-size">{fileSize}</span>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Retirer le fichier"
              className="indemnite-file-remove"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="form-grid-full indemnite-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting}>
          Soumettre la demande
        </Button>
      </div>
    </form>
  );
}
