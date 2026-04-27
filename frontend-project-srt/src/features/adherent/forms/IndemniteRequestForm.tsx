/* ============================================
   Indemnite Request Form — Adherent Portal
   ============================================ */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { indemniteRequestSchema, type IndemniteRequestFormValues } from '../validators';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { FormTextarea } from '../../../components/ui/FormTextarea';
import { Button } from '../../../components/ui/Button';
import type { IndemniteType } from '../../../types/domain';

const INDEMNITE_TYPES: { value: IndemniteType; label: string }[] = [
  { value: 'maladie', label: 'Maladie' },
  { value: 'naissance', label: 'Naissance' },
  { value: 'mariage', label: 'Mariage' },
  { value: 'deces', label: 'Décès' },
  { value: 'scolarite', label: 'Scolarité' },
];

interface Props {
  onSubmit: (values: IndemniteRequestFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function IndemniteRequestForm({ onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<IndemniteRequestFormValues>({
    resolver: zodResolver(indemniteRequestSchema),
    defaultValues: { type: 'maladie', montant: 100, motif: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
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
      
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>Soumettre la demande</Button>
      </div>
    </form>
  );
}
