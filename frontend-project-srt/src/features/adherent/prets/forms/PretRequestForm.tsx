/* ============================================
   Pret Request Form - Adherent Portal
   ============================================ */

import { useMemo, useState, type ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Paperclip, FileText, X } from 'lucide-react';
import { pretRequestSchema, type PretRequestFormValues } from '../../validators';
import { FormInput } from '../../../../shared/ui/FormInput';
import { FormTextarea } from '../../../../shared/ui/FormTextarea';
import { Button } from '../../../../shared/ui/Button';
import { pretsApi } from '../api';
import './PretRequestForm.css';

interface Props {
  onSubmit: (values: PretRequestFormValues, file?: File) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function PretRequestForm({ onSubmit, onCancel, submitting }: Props) {
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<PretRequestFormValues>({
    resolver: zodResolver(pretRequestSchema),
    defaultValues: { montant: 5000, duree: 12, taux: 2.5, motif: '' },
  });

  const montant = useWatch({ control, name: 'montant' });
  const duree = useWatch({ control, name: 'duree' });
  const taux = useWatch({ control, name: 'taux' }) || 2.5;
  const fileName = file?.name;
  const fileSize = file ? `${(file.size / 1024).toFixed(1)} Ko` : '';

  const monthlyPayment = useMemo(() => {
    if (!montant || !duree) return 0;
    return pretsApi.calculateMonthlyPayment(montant, duree, taux);
  }, [montant, duree, taux]);

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

  const submitForm = (values: PretRequestFormValues) => {
    return onSubmit(values, file ?? undefined);
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="form-grid">
      <FormInput
        label="Montant du prêt (TND)"
        type="number"
        step="100"
        {...register('montant', { valueAsNumber: true })}
        error={errors.montant?.message}
      />
      <FormInput
        label="Durée (mois)"
        type="number"
        {...register('duree', { valueAsNumber: true })}
        error={errors.duree?.message}
      />
      <FormInput
        label="Taux d'intérêt (% annuel)"
        type="number"
        step="0.1"
        disabled
        {...register('taux', { valueAsNumber: true })}
        error={errors.taux?.message}
      />

      <div className="form-grid-full pret-estimate-box">
        <strong>Mensualité estimée: {monthlyPayment.toFixed(2)} TND</strong>
        <p>Calcul basé sur le taux de {taux}% par an</p>
      </div>

      <div className="form-grid-full">
        <FormTextarea
          label="Motif de la demande"
          rows={3}
          {...register('motif')}
          error={errors.motif?.message}
        />
      </div>

      <div className="form-grid-full">
        <label className="pret-file-label">Justificatif (PDF, image - optionnel)</label>

        {!file ? (
          <label className="pret-file-drop">
            <Paperclip size={16} />
            <span>Cliquez pour joindre un fichier (devis, facture pro forma, ordonnance...)</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="pret-file-input"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="pret-file-preview">
            <FileText size={16} className="pret-file-icon" />
            <span className="pret-file-name">{fileName}</span>
            <span className="pret-file-size">{fileSize}</span>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Retirer le fichier"
              className="pret-file-remove"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="form-grid-full pret-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting}>
          Demander le prêt
        </Button>
      </div>
    </form>
  );
}
