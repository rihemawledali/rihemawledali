/* ============================================
   Treasurer - Profil
   ============================================ */

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Calendar,
  IdCard,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { Modal } from '../../../shared/data/Modal';
import { FormInput } from '../../../shared/ui/FormInput';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { Button } from '../../../shared/ui/Button';
import { useToast } from '../../../shared/feedback/useToast';
import { useAuth } from '../../auth/hooks/useAuth';
import { treasurerProfileApi, type AccountProfileResponse } from '../profile/api';
import './TreasurerProfilPage.css';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function TreasurerProfilPage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: treasurerProfileApi.getProfile,
  });

  const profile = profileQuery.data ?? user;
  const profileDetails = profileQuery.data;

  const updateProfile = useMutation({
    mutationFn: treasurerProfileApi.updateProfile,
    onSuccess: ({ user: updatedUser, token }) => {
      updateUser(updatedUser, token);
      queryClient.invalidateQueries({ queryKey: ['account', 'profile'] });
      setEditing(false);
      toast.push({ title: 'Profil mis a jour', variant: 'success' });
    },
    onError: (error) => {
      toast.push({ title: error instanceof Error ? error.message : 'Mise a jour impossible', variant: 'error' });
    },
  });

  const changePassword = useMutation({
    mutationFn: treasurerProfileApi.changePassword,
    onSuccess: () => {
      setChangingPassword(false);
      toast.push({ title: 'Mot de passe mis a jour', variant: 'success' });
    },
    onError: (error) => {
      toast.push({ title: error instanceof Error ? error.message : 'Changement impossible', variant: 'error' });
    },
  });

  const displayProfile = useMemo(() => {
    if (profile) return profile;
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'treasurer' as const,
    };
  }, [profile]);

  const initials = `${displayProfile.firstName?.[0] ?? ''}${displayProfile.lastName?.[0] ?? ''}`.toUpperCase() || 'TR';
  const fullName = `${displayProfile.firstName} ${displayProfile.lastName}`.trim() || 'Tresorier';

  return (
    <div className="treasurer-profile-page">
      <PageHeader
        title="Mon profil"
        description="Informations du compte tresorier"
        breadcrumb={['Tresorerie', 'Compte', 'Profil']}
      />

      <section className="treasurer-profile-hero" aria-label="Resume du profil">
        <div className="treasurer-profile-identity">
          <span className="treasurer-profile-avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="treasurer-profile-title">
            <span className="treasurer-profile-kicker">Compte tresorier</span>
            <h2>{profileQuery.isLoading ? 'Chargement...' : fullName}</h2>
            <p>{displayProfile.email || '-'}</p>
          </div>
        </div>

        <div className="treasurer-profile-status">
          <span className="treasurer-profile-status-badge">
            <BadgeCheck size={16} />
            {profileDetails?.statut === 'inactif' ? 'Inactif' : 'Actif'}
          </span>
          <span className="treasurer-profile-role">
            <ShieldCheck size={16} />
            Tresorier
          </span>
        </div>
      </section>

      <section className="treasurer-profile-layout">
        <article className="treasurer-profile-panel">
          <header className="treasurer-profile-panel-header">
            <div>
              <span className="treasurer-profile-kicker">Identite</span>
              <h3>Informations personnelles</h3>
            </div>
          </header>

          <dl className="treasurer-profile-fields">
            <ProfileField icon={<User size={17} />} label="Prenom" value={displayProfile.firstName || '-'} />
            <ProfileField icon={<User size={17} />} label="Nom" value={displayProfile.lastName || '-'} />
            <ProfileField icon={<Mail size={17} />} label="E-mail" value={displayProfile.email || '-'} />
            <ProfileField icon={<Phone size={17} />} label="Telephone" value={displayProfile.phone || '-'} />
            <ProfileField icon={<ShieldCheck size={17} />} label="Role" value="Tresorier" />
            <ProfileField icon={<IdCard size={17} />} label="Identifiant" value={displayProfile.id || '-'} mono />
          </dl>
        </article>

        <aside className="treasurer-profile-side">
          <article className="treasurer-profile-panel">
            <header className="treasurer-profile-panel-header">
              <div>
                <span className="treasurer-profile-kicker">Acces</span>
                <h3>Securite du compte</h3>
              </div>
            </header>

            <div className="treasurer-profile-security">
              <div className="treasurer-profile-security-item">
                <span>
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <strong>Session protegee</strong>
                  <p>Acces limite aux operations de tresorerie.</p>
                </div>
              </div>
              <div className="treasurer-profile-security-item">
                <span>
                  <Calendar size={17} />
                </span>
                <div>
                  <strong>Compte actif</strong>
                  <p>Votre profil est synchronise avec le backend.</p>
                </div>
              </div>
            </div>

            <div className="treasurer-profile-actions">
              <Button onClick={() => setEditing(true)} disabled={profileQuery.isLoading}>
                <User size={16} />
                Modifier
              </Button>
              <Button variant="secondary" onClick={() => setChangingPassword(true)}>
                <KeyRound size={16} />
                Mot de passe
              </Button>
            </div>
          </article>
        </aside>
      </section>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Modifier mon profil"
        description="Ces informations seront enregistrees dans le backend."
      >
        <ProfileEditForm
          profile={displayProfile}
          submitting={updateProfile.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(values) => updateProfile.mutate(values)}
        />
      </Modal>

      <Modal
        open={changingPassword}
        onClose={() => setChangingPassword(false)}
        title="Changer le mot de passe"
        description="Saisissez votre mot de passe actuel pour confirmer le changement."
      >
        <PasswordChangeForm
          submitting={changePassword.isPending}
          onCancel={() => setChangingPassword(false)}
          onSubmit={(values) => changePassword.mutate(values)}
        />
      </Modal>
    </div>
  );
}

function ProfileField({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="treasurer-profile-field">
      <dt>
        {icon}
        {label}
      </dt>
      <dd className={mono ? 'is-mono' : undefined}>{value}</dd>
    </div>
  );
}

function ProfileEditForm({
  profile,
  submitting,
  onCancel,
  onSubmit,
}: {
  profile: Pick<AccountProfileResponse, 'firstName' | 'lastName' | 'email' | 'phone'>;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: ProfileFormState) => void;
}) {
  const [values, setValues] = useState<ProfileFormState>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone ?? '',
  });
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim()) {
      setError('Prenom, nom et email sont requis.');
      return;
    }
    onSubmit({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    });
  };

  const set = (key: keyof ProfileFormState, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  return (
    <form className="treasurer-profile-form" onSubmit={submit}>
      <div className="treasurer-profile-form-grid">
        <FormInput label="Prenom" value={values.firstName} onChange={(event) => set('firstName', event.target.value)} />
        <FormInput label="Nom" value={values.lastName} onChange={(event) => set('lastName', event.target.value)} />
        <FormInput label="Email" type="email" value={values.email} onChange={(event) => set('email', event.target.value)} />
        <FormInput label="Telephone" value={values.phone} onChange={(event) => set('phone', event.target.value)} />
      </div>
      {error && <p className="treasurer-profile-form-error">{error}</p>}
      <div className="treasurer-profile-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

function PasswordChangeForm({
  submitting,
  onCancel,
  onSubmit,
}: {
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: { currentPassword: string; newPassword: string }) => void;
}) {
  const [values, setValues] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.currentPassword || !values.newPassword) {
      setError('Tous les champs sont requis.');
      return;
    }
    if (values.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit faire au moins 8 caracteres.');
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    onSubmit({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  const set = (key: keyof PasswordFormState, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  return (
    <form className="treasurer-profile-form" onSubmit={submit}>
      <PasswordInput
        label="Mot de passe actuel"
        value={values.currentPassword}
        onChange={(event) => set('currentPassword', event.target.value)}
        autoComplete="current-password"
      />
      <PasswordInput
        label="Nouveau mot de passe"
        value={values.newPassword}
        onChange={(event) => set('newPassword', event.target.value)}
        autoComplete="new-password"
      />
      <PasswordInput
        label="Confirmer le nouveau mot de passe"
        value={values.confirmPassword}
        onChange={(event) => set('confirmPassword', event.target.value)}
        autoComplete="new-password"
      />
      {error && <p className="treasurer-profile-form-error">{error}</p>}
      <div className="treasurer-profile-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting}>
          Changer
        </Button>
      </div>
    </form>
  );
}
