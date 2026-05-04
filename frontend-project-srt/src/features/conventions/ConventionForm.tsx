import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { conventionSchema, type ConventionFormValues } from '../../lib/validators';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { FormTextarea } from '../../components/ui/FormTextarea';
import { Button } from '../../components/ui/Button';
import { suppliersApi } from '../suppliers/suppliersApi';
import type { Convention, ModeAvantage } from '../../types/domain';

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

/**
 * Mode d'avantage options — drives the conditional display of
 * {@code tauxReduction} or {@code montantReduction}.
 */
const MODE_AVANTAGE_OPTIONS: { value: ModeAvantage; label: string; hint: string }[] = [
  { value: 'REMISE_POURCENTAGE',  label: 'Remise en pourcentage', hint: 'Remise appliquée en % sur le prix' },
  { value: 'REMISE_MONTANT_FIXE', label: 'Remise — montant fixe', hint: 'Remise exprimée en TND' },
];

export function ConventionForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const suppliers = useQuery({
    queryKey: ['suppliers', 'all-options'],
    queryFn: () => suppliersApi.list({ page: 1, size: 200 }),
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ConventionFormValues>({
    resolver: zodResolver(conventionSchema),
    defaultValues: initial
      ? {
          fournisseurId: initial.fournisseurId,
          type: initial.type,
          dateDebut: initial.dateDebut.slice(0, 10),
          dateFin: initial.dateFin.slice(0, 10),
          statut: initial.statut,
          description: initial.description ?? '',
          typeConvention: initial.typeConvention ?? '',
          modeAvantage:
            initial.modeAvantage === 'REMISE_POURCENTAGE' ||
            initial.modeAvantage === 'REMISE_MONTANT_FIXE'
              ? initial.modeAvantage
              : 'REMISE_POURCENTAGE',
          tauxReduction: initial.tauxReduction,
          montantReduction: initial.montantReduction,
        }
      : {
          fournisseurId: '',
          type: 'commerce',
          dateDebut: '',
          dateFin: '',
          statut: 'active',
          description: '',
          typeConvention: '',
          modeAvantage: 'REMISE_POURCENTAGE',
          tauxReduction: undefined,
          montantReduction: undefined,
        },
  });

  const mode = watch('modeAvantage');
  const showTaux = mode === 'REMISE_POURCENTAGE';
  const showMontant = mode === 'REMISE_MONTANT_FIXE';
  const hint = MODE_AVANTAGE_OPTIONS.find((o) => o.value === mode)?.hint;

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
      <FormSelect label="Catégorie" {...register('type')} options={TYPES} error={errors.type?.message} />
      <FormInput
        label="Type de convention (optionnel)"
        placeholder="ex. Partenariat cadre, Offre ponctuelle…"
        {...register('typeConvention')}
        error={errors.typeConvention?.message}
      />
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
      <FormInput label="Date début" type="date" {...register('dateDebut')} error={errors.dateDebut?.message} />
      <FormInput label="Date fin" type="date" {...register('dateFin')} error={errors.dateFin?.message} />

      {/* ----- Mode d'avantage ----- */}
      <div className="form-grid-full" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
        <FormSelect
          label="Mode d\u2019avantage"
          {...register('modeAvantage')}
          options={MODE_AVANTAGE_OPTIONS.map(({ value, label }) => ({ value, label }))}
          error={errors.modeAvantage?.message}
        />
        {hint && (
          <p style={{
            marginTop: 'var(--space-1)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
          }}>
            {hint}
          </p>
        )}
      </div>
      {showTaux && (
        <FormInput
          label="Taux de réduction (%)"
          type="number"
          step="0.1"
          min={0}
          max={100}
          {...register('tauxReduction', { valueAsNumber: true })}
          error={errors.tauxReduction?.message}
        />
      )}
      {showMontant && (
        <FormInput
          label="Montant de réduction (TND)"
          type="number"
          step="0.01"
          min={0}
          {...register('montantReduction', { valueAsNumber: true })}
          error={errors.montantReduction?.message}
        />
      )}
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
