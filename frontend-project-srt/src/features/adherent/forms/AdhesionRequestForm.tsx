/* ============================================
   Adhesion Request Form — Adherent Portal
   ============================================ */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adhesionRequestSchema, type AdhesionRequestFormValues } from '../validators';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';

interface Props {
  onSubmit: (values: AdhesionRequestFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function AdhesionRequestForm({ onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<AdhesionRequestFormValues>({
    resolver: zodResolver(adhesionRequestSchema),
    defaultValues: { montantCotisation: 50 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <div className="form-grid-full">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          Veuillez indiquer le montant de cotisation mensuelle souhaité.
        </p>
      </div>
      <FormInput 
        label="Montant de cotisation mensuelle (TND)" 
        type="number" 
        step="0.01"
        {...register('montantCotisation', { valueAsNumber: true })} 
        error={errors.montantCotisation?.message} 
      />
      
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>Demander l'adhésion</Button>
      </div>
    </form>
  );
}
