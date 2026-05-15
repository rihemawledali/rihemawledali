import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { compteBancaireSchema, type CompteBancaireFormValues } from '../../../shared/validators';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { Button } from '../../../shared/ui/Button';
import type { CompteBancaire } from '../../../shared/types/domain';

interface Props {
  initial?: CompteBancaire;
  onSubmit: (v: CompteBancaireFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const DEVISES = [
  { value: 'TND', label: 'TND — Dinar tunisien' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — Dollar US' },
];

export function CompteBancaireForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CompteBancaireFormValues>({
    resolver: zodResolver(compteBancaireSchema),
    defaultValues: initial
      ? {
          banque: initial.banque,
          iban: initial.iban,
          solde: initial.solde,
          devise: initial.devise,
        }
      : { banque: '', iban: '', solde: 0, devise: 'TND' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <div className="form-grid-full">
        <FormInput
          label="Banque"
          placeholder="ex. BIAT, Attijari, UBCI…"
          {...register('banque')}
          error={errors.banque?.message}
        />
      </div>
      <div className="form-grid-full">
        <FormInput
          label="IBAN"
          placeholder="TN59 1000 6035 1835 9847 8832"
          {...register('iban')}
          error={errors.iban?.message}
        />
      </div>
      <FormInput
        label={initial ? 'Solde (modifiable)' : 'Solde initial'}
        type="number"
        step="0.01"
        min={0}
        {...register('solde', { valueAsNumber: true })}
        error={errors.solde?.message}
      />
      <FormSelect
        label="Devise"
        {...register('devise')}
        options={DEVISES}
        error={errors.devise?.message}
      />
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting}>
          {initial ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
