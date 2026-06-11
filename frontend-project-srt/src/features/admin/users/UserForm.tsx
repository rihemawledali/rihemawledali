import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, type UserFormValues } from '../../../shared/validators';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { Button } from '../../../shared/ui/Button';

export function UserForm({ initial, onSubmit, onCancel, submitting }: any) {
  const isEdit = !!initial;
  const { register, handleSubmit, formState: { errors }, setError } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initial ?? {
      prenom: '', nom: '', email: '', telephone: '',
      role: 'adherent', status: 'actif', matricule: '', password: '',
    },
  });

  const handleValid = (values: UserFormValues) => {
    // Password is required on create, optional on edit
    if (!isEdit && (!values.password || values.password.length < 6)) {
      setError('password', { message: 'Mot de passe : 6 caractères minimum' });
      return;
    }
    return onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(handleValid)} className="form-grid">
      <FormInput label="Prénom" placeholder="ex. Ahmed" {...register('prenom')} error={errors.prenom?.message} />
      <FormInput label="Nom" placeholder="ex. Ben Salah" {...register('nom')} error={errors.nom?.message} />
      <FormInput label="Email" type="email" placeholder="nom@srt.tn" {...register('email')} error={errors.email?.message} />
      <FormInput label="Téléphone" placeholder="+216 ..." {...register('telephone')} error={errors.telephone?.message} />
      <FormInput label="Matricule" placeholder="ADH001" {...register('matricule')} error={errors.matricule?.message} />
      <FormInput
        label={isEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
        type="password"
        placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Au moins 6 caractères'}
        {...register('password')}
        error={errors.password?.message}
      />
      <FormSelect
        label="Rôle"
        {...register('role')}
        options={[
          { value: 'admin', label: 'Administrateur' },
          { value: 'treasurer', label: 'Trésorier' },
          { value: 'adherent', label: 'Adhérent' },
        ]}
        error={errors.role?.message}
      />
      <FormSelect
        label="Statut"
        {...register('status')}
        options={[
          { value: 'actif', label: 'Actif' },
          { value: 'inactif', label: 'Inactif' },
          { value: 'suspendu', label: 'Suspendu' },
        ]}
        error={errors.status?.message}
      />
      <div className="form-grid-full admin-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
