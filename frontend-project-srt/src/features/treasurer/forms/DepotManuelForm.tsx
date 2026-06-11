import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '../../../shared/ui/FormInput';
import { Button } from '../../../shared/ui/Button';

const schema = z.object({
  montant: z.number({ error: 'Montant requis' }).positive('Montant > 0'),
  description: z.string().optional(),
});

export type DepotFormValues = z.infer<typeof schema>;

export function DepotManuelForm({ compte, onSubmit, onCancel, submitting }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm<DepotFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { montant: 0, description: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <div className="form-grid-full form-summary-card">
        <strong>{compte.banque}</strong>
        <span className="cell-mono">{compte.iban}</span>
        <span>Solde actuel : <strong>{compte.solde.toFixed(2)} {compte.devise}</strong></span>
      </div>
      <FormInput
        label="Montant"
        type="number"
        step="0.01"
        {...register('montant', { valueAsNumber: true })}
        error={errors.montant?.message}
      />
      <div className="form-grid-full">
        <FormInput label="Description (optionnel)" {...register('description')} />
      </div>
      <div className="form-grid-full form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>Déposer</Button>
      </div>
    </form>
  );
}
