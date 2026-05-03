/* ============================================
   Pret Request Form — Adherent Portal
   ============================================ */

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pretRequestSchema, type PretRequestFormValues } from '../validators';
import { FormInput } from '../../../components/ui/FormInput';
import { FormTextarea } from '../../../components/ui/FormTextarea';
import { Button } from '../../../components/ui/Button';
import { useMemo, useState, type ChangeEvent } from 'react';
import { Paperclip, FileText, X } from 'lucide-react';
import { pretsApi } from '../api/pretsApi';

interface Props {
  /** Receives form values plus the optional File for upstream multipart upload. */
  onSubmit: (values: PretRequestFormValues, file?: File) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function PretRequestForm({ onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<PretRequestFormValues>({
    resolver: zodResolver(pretRequestSchema),
    defaultValues: { montant: 5000, duree: 12, taux: 2.5, motif: '' },
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

  const montant = useWatch({ control, name: 'montant' });
  const duree = useWatch({ control, name: 'duree' });
  const taux = useWatch({ control, name: 'taux' }) || 2.5;

  const monthlyPayment = useMemo(() => {
    if (!montant || !duree) return 0;
    return pretsApi.calculateMonthlyPayment(montant, duree, taux);
  }, [montant, duree, taux]);

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v, file ?? undefined))} className="form-grid">
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
      
      <div className="form-grid-full" style={{ 
        background: 'var(--color-surface-secondary)', 
        padding: 'var(--space-3)', 
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-3)'
      }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>
          Mensualité estimée: {monthlyPayment.toFixed(2)} TND
        </strong>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          Calcul basé sur le taux de {taux}% par an
        </p>
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
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
          }}
        >
          Justificatif (PDF, image — optionnel)
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
            <span>Cliquez pour joindre un fichier (devis, facture pro forma, ordonnance…)</span>
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
        <Button type="submit" isLoading={submitting}>Demander le prêt</Button>
      </div>
    </form>
  );
}
