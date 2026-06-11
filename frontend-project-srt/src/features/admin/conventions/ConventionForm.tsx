import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { conventionSchema, type ConventionFormValues } from '../../../shared/validators';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { FormTextarea } from '../../../shared/ui/FormTextarea';
import { Button } from '../../../shared/ui/Button';
import { suppliersApi } from '../../../shared/api/suppliersApi';
import type { TypeAvantage } from '../../../shared/types/domain';

const TYPES = [
  { value: 'sante', label: 'Sante' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'transport', label: 'Transport' },
  { value: 'loisir', label: 'Loisir' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'education', label: 'Education' },
];

const TYPE_AVANTAGE_OPTIONS: { value: TypeAvantage; label: string }[] = [
  { value: 'REMISE_DIRECTE', label: 'Remise directe' },
  { value: 'BON_ACHAT', label: "Bon d'achat" },
  { value: 'ACHAT_TRANCHE', label: 'Achat tranche' },
  { value: 'ABONNEMENT', label: 'Abonnement' },
];

export function ConventionForm({ initial, onSubmit, onCancel, submitting }: any) {
  const suppliers = useQuery({
    queryKey: ['suppliers', 'all-options'],
    queryFn: () => suppliersApi.list({ page: 1, size: 200 }),
  });

  const { register, handleSubmit, control, formState: { errors } } = useForm<ConventionFormValues>({
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
          typeAvantage: initial.typeAvantage ?? 'REMISE_DIRECTE',
          pourcentageAdherent: initial.pourcentageAdherent,
          montantAvantage: initial.montantAvantage,
          nombreMoisRetenue: initial.nombreMoisRetenue,
          quantiteDisponible: initial.quantiteDisponible,
          autoriseAyantsDroit: initial.autoriseAyantsDroit ?? false,
        }
      : {
          fournisseurId: '',
          type: 'commerce',
          dateDebut: '',
          dateFin: '',
          statut: 'active',
          description: '',
          typeConvention: '',
          typeAvantage: 'REMISE_DIRECTE',
          pourcentageAdherent: 0,
          montantAvantage: undefined,
          nombreMoisRetenue: undefined,
          quantiteDisponible: undefined,
          autoriseAyantsDroit: false,
        },
  });

  const typeAvantage = useWatch({ control, name: 'typeAvantage' });
  const hasFinancialFlow = typeAvantage !== 'REMISE_DIRECTE';
  const isTranche = typeAvantage === 'ACHAT_TRANCHE';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <div className="form-grid-full">
        <FormSelect
          label="Fournisseur"
          {...register('fournisseurId')}
          options={(suppliers.data?.items ?? []).map((s) => ({ value: s.id, label: s.nom }))}
          placeholder="Selectionnez un fournisseur"
          error={errors.fournisseurId?.message}
        />
      </div>

      <FormSelect label="Categorie" {...register('type')} options={TYPES} error={errors.type?.message} />
      <FormInput
        label="Type de convention (optionnel)"
        placeholder="ex. Partenariat cadre, offre ponctuelle"
        {...register('typeConvention')}
        error={errors.typeConvention?.message}
      />
      <FormSelect
        label="Statut"
        {...register('statut')}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'expiree', label: 'Expiree' },
          { value: 'en_negociation', label: 'En negociation' },
          { value: 'suspendue', label: 'Suspendue' },
        ]}
        error={errors.statut?.message}
      />
      <FormInput label="Date debut" type="date" {...register('dateDebut')} error={errors.dateDebut?.message} />
      <FormInput label="Date fin" type="date" {...register('dateFin')} error={errors.dateFin?.message} />

      <div className="form-grid-full admin-form-section">
        <FormSelect
          label="Type d'avantage"
          {...register('typeAvantage')}
          options={TYPE_AVANTAGE_OPTIONS}
          error={errors.typeAvantage?.message}
        />
      </div>

      {hasFinancialFlow && (
        <>
          <FormInput
            label="Montant avantage (TND)"
            type="number"
            step="0.01"
            min={0}
            {...register('montantAvantage', { valueAsNumber: true })}
            error={errors.montantAvantage?.message}
          />
          <FormInput
            label="Part adherent (%)"
            type="number"
            step="0.1"
            min={0}
            max={100}
            {...register('pourcentageAdherent', { valueAsNumber: true })}
            error={errors.pourcentageAdherent?.message}
          />
        </>
      )}

      {isTranche && (
        <FormInput
          label="Nombre de mois de retenue"
          type="number"
          min={1}
          {...register('nombreMoisRetenue', { valueAsNumber: true })}
          error={errors.nombreMoisRetenue?.message}
        />
      )}

      <FormInput
        label="Quantite disponible"
        type="number"
        min={0}
        {...register('quantiteDisponible', { valueAsNumber: true })}
        error={errors.quantiteDisponible?.message}
      />
      <label className="admin-checkbox-row">
        <input type="checkbox" {...register('autoriseAyantsDroit')} />
        Autoriser les ayants droit
      </label>

      <div className="form-grid-full">
        <FormTextarea label="Description (optionnel)" rows={3} {...register('description')} error={errors.description?.message} />
      </div>
      <div className="form-grid-full admin-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre a jour' : 'Creer'}</Button>
      </div>
    </form>
  );
}
