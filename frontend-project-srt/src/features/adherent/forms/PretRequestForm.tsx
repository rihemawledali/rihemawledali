/* ============================================
   Pret Request Form — Adherent Portal
   ============================================ */

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pretRequestSchema, type PretRequestFormValues } from '../validators';
import { FormInput } from '../../../components/ui/FormInput';
import { FormTextarea } from '../../../components/ui/FormTextarea';
import { Button } from '../../../components/ui/Button';
import { useMemo } from 'react';
import { pretsApi } from '../api/pretsApi';

interface Props {
  onSubmit: (values: PretRequestFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function PretRequestForm({ onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<PretRequestFormValues>({
    resolver: zodResolver(pretRequestSchema),
    defaultValues: { montant: 5000, duree: 12, taux: 2.5, motif: '' },
  });

  const montant = useWatch({ control, name: 'montant' });
  const duree = useWatch({ control, name: 'duree' });
  const taux = useWatch({ control, name: 'taux' }) || 2.5;

  const monthlyPayment = useMemo(() => {
    if (!montant || !duree) return 0;
    return pretsApi.calculateMonthlyPayment(montant, duree, taux);
  }, [montant, duree, taux]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
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
      
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>Demander le prêt</Button>
      </div>
    </form>
  );
}
