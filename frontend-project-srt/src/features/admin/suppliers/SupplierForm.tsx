import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierSchema, type SupplierFormValues } from '../../../shared/validators';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { Button } from '../../../shared/ui/Button';

const CATEGORIES = [
  { value: 'sante', label: 'Santé' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'transport', label: 'Transport' },
  { value: 'loisir', label: 'Loisir' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'education', label: 'Éducation' },
];

export function SupplierForm({ initial, onSubmit, onCancel, submitting }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initial ?? { nom: '', adresse: '', telephone: '', email: '', categorie: 'commerce', status: 'actif' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <div className="form-grid-full">
        <FormInput label="Nom du fournisseur" placeholder="ex. Pharmacie Centrale" {...register('nom')} error={errors.nom?.message} />
      </div>
      <div className="form-grid-full">
        <FormInput label="Adresse" placeholder="ex. 12 Av. Bourguiba, Tunis" {...register('adresse')} error={errors.adresse?.message} />
      </div>
      <FormInput label="Téléphone" placeholder="+216 ..." {...register('telephone')} error={errors.telephone?.message} />
      <FormInput label="Email" type="email" placeholder="contact@..." {...register('email')} error={errors.email?.message} />
      <FormSelect label="Catégorie" {...register('categorie')} options={CATEGORIES} error={errors.categorie?.message} />
      <FormSelect
        label="Statut"
        {...register('status')}
        options={[{ value: 'actif', label: 'Actif' }, { value: 'inactif', label: 'Inactif' }]}
        error={errors.status?.message}
      />
      <div className="form-grid-full admin-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
