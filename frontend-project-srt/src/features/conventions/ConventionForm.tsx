import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { conventionSchema, type ConventionFormValues } from '../../lib/validators';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { FormTextarea } from '../../components/ui/FormTextarea';
import { Button } from '../../components/ui/Button';
import { suppliersApi } from '../suppliers/suppliersApi';
import type { Convention } from '../../types/domain';

interface Props {
  initial?: Convention;
  onSubmit: (v: ConventionFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const TYPES = [
  { value: 'sante', label: 'Santé' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'transport', label: 'Transport' },
  { value: 'loisir', label: 'Loisir' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'education', label: 'Éducation' },
];

export function ConventionForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const suppliers = useQuery({
    queryKey: ['suppliers', 'all-options'],
    queryFn: () => suppliersApi.list({ page: 1, size: 200 }),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ConventionFormValues>({
    resolver: zodResolver(conventionSchema),
    defaultValues: initial
      ? {
          fournisseurId: initial.fournisseurId,
          type: initial.type,
          dateDebut: initial.dateDebut.slice(0, 10),
          dateFin: initial.dateFin.slice(0, 10),
          remise: initial.remise,
          statut: initial.statut,
          description: initial.description ?? '',
        }
      : { fournisseurId: '', type: 'commerce', dateDebut: '', dateFin: '', remise: 10, statut: 'active', description: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <div className="form-grid-full">
        <FormSelect
          label="Fournisseur"
          {...register('fournisseurId')}
          options={(suppliers.data?.items ?? []).map((s) => ({ value: s.id, label: s.nom }))}
          placeholder="Sélectionnez un fournisseur"
          error={errors.fournisseurId?.message}
        />
      </div>
      <FormSelect label="Type" {...register('type')} options={TYPES} error={errors.type?.message} />
      <FormInput label="Remise (%)" type="number" step="0.1" {...register('remise', { valueAsNumber: true })} error={errors.remise?.message} />
      <FormInput label="Date début" type="date" {...register('dateDebut')} error={errors.dateDebut?.message} />
      <FormInput label="Date fin" type="date" {...register('dateFin')} error={errors.dateFin?.message} />
      <FormSelect
        label="Statut"
        {...register('statut')}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'expiree', label: 'Expirée' },
          { value: 'en_negociation', label: 'En négociation' },
          { value: 'suspendue', label: 'Suspendue' },
        ]}
        error={errors.statut?.message}
      />
      <div className="form-grid-full">
        <FormTextarea label="Description (optionnel)" rows={3} {...register('description')} error={errors.description?.message} />
      </div>
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
