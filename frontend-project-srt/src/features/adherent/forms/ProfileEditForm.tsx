/* ============================================
   Profile Edit Form — Adherent Portal
   ============================================ */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileFormValues } from '../validators';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { Button } from '../../../components/ui/Button';
import type { Adherent } from '../../../types/domain';

interface Props {
  profile: Adherent;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function ProfileEditForm({ profile, onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      prenom: profile.prenom,
      nom: profile.nom,
      email: profile.email,
      telephone: profile.telephone,
      dateNaissance: (profile as unknown as Record<string, string>).dateNaissance || '',
      salaire: profile.salaire,
      enfants: profile.enfants,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormInput label="Prénom" {...register('prenom')} error={errors.prenom?.message} />
      <FormInput label="Nom" {...register('nom')} error={errors.nom?.message} />
      <FormInput label="Email" type="email" {...register('email')} error={errors.email?.message} />
      <FormInput label="Téléphone" {...register('telephone')} error={errors.telephone?.message} />
      <FormInput label="Date de naissance" type="date" {...register('dateNaissance')} error={errors.dateNaissance?.message} />
      <FormInput 
        label="Salaire mensuel (TND)" 
        type="number" 
        step="0.01"
        {...register('salaire', { valueAsNumber: true })} 
        error={errors.salaire?.message} 
      />
      <FormInput 
        label="Nombre d'enfants" 
        type="number" 
        {...register('enfants', { valueAsNumber: true })} 
        error={errors.enfants?.message} 
      />
      
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>Enregistrer</Button>
      </div>
    </form>
  );
}
