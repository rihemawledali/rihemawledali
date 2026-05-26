import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Calendar,
  Hash,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '../shared/layout/PageHeader';
import { FormInput } from '../shared/ui/FormInput';
import { PasswordInput } from '../shared/ui/PasswordInput';
import { Button } from '../shared/ui/Button';
import { useToast } from '../shared/feedback/useToast';
import { useAuth } from '../features/auth/hooks/useAuth';
import {
  profileService,
  type ProfileResponse,
  type UpdateProfileRequest,
} from '../services/profileService';
import './Profile.css';

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ROLE_LABELS: Record<ProfileResponse['role'], string> = {
  admin: 'Administrateur',
  treasurer: 'Tresorier',
  adherent: 'Adherent',
};

export function Profile() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const profileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getMe,
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }
    setForm((current) => ({
      ...current,
      firstName: profileQuery.data.firstName ?? '',
      lastName: profileQuery.data.lastName ?? '',
      phone: profileQuery.data.phone ?? '',
    }));
  }, [profileQuery.data]);

  const updateProfile = useMutation({
    mutationFn: profileService.updateMe,
    onSuccess: (profile) => {
      updateUser({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone ?? '',
        role: profile.role,
      });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      setForm((current) => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      toast.push({ title: 'Profil mis a jour', variant: 'success' });
    },
    onError: (mutationError) => {
      toast.push({
        title: mutationError instanceof Error ? mutationError.message : 'Mise a jour impossible',
        variant: 'error',
      });
    },
  });

  const displayName = useMemo(() => {
    const profile = profileQuery.data;
    if (!profile) {
      return '';
    }
    return `${profile.firstName} ${profile.lastName}`.trim();
  }, [profileQuery.data]);

  const set = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError('');
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Prenom et nom sont requis.');
      return;
    }

    const wantsPasswordChange = Boolean(
      form.currentPassword || form.newPassword || form.confirmPassword,
    );

    if (wantsPasswordChange) {
      if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
        setError('Tous les champs mot de passe sont requis.');
        return;
      }
      if (form.newPassword.length < 8) {
        setError('Le nouveau mot de passe doit contenir au moins 8 caracteres.');
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    const payload: UpdateProfileRequest = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
    };

    if (wantsPasswordChange) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    updateProfile.mutate(payload);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="profile-page">
        <PageHeader title="Mon profil" description="Chargement..." />
        <div className="profile-loading-grid">
          <div className="profile-skeleton profile-skeleton--hero" />
          <div className="profile-skeleton" />
          <div className="profile-skeleton" />
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="profile-page">
        <PageHeader title="Mon profil" description="Profil introuvable." />
        <section className="profile-empty">
          <BadgeCheck size={20} />
          <span>Impossible de charger les informations du compte.</span>
        </section>
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="profile-page">
      <PageHeader
        title="Mon profil"
        description="Informations personnelles du compte connecte."
        breadcrumb={['Compte', 'Profil']}
      />

      <section className="profile-identity">
        <div className="profile-avatar" aria-hidden="true">{initials(profile)}</div>
        <div className="profile-identity-main">
          <span className="profile-kicker">Compte {ROLE_LABELS[profile.role]}</span>
          <h2>{displayName || ROLE_LABELS[profile.role]}</h2>
          <div className="profile-contact-strip">
            <span><Mail size={15} />{profile.email}</span>
            <span><Phone size={15} />{profile.phone || '-'}</span>
          </div>
        </div>
        <div className="profile-summary-grid" aria-label="Synthese du profil">
          <SummaryItem icon={<ShieldCheck size={17} />} label="Role" value={ROLE_LABELS[profile.role]} />
          <SummaryItem icon={<BadgeCheck size={17} />} label="Statut" value={profile.status || '-'} />
          <SummaryItem icon={<Calendar size={17} />} label="Compte cree" value={formatDate(profile.createdAt)} />
        </div>
      </section>

      <div className="profile-layout">
        <aside className="profile-panel profile-details">
          <div className="profile-section-head">
            <h3>Informations du compte</h3>
          </div>
          <dl className="profile-info-list">
            <InfoRow icon={<User size={16} />} label="Nom complet" value={displayName || '-'} />
            <InfoRow icon={<Mail size={16} />} label="Email" value={profile.email} />
            <InfoRow icon={<Phone size={16} />} label="Telephone" value={profile.phone || '-'} />
            <InfoRow icon={<ShieldCheck size={16} />} label="Role" value={ROLE_LABELS[profile.role]} />
            <InfoRow icon={<BadgeCheck size={16} />} label="Statut" value={profile.status || '-'} />
            <InfoRow icon={<Calendar size={16} />} label="Cree le" value={formatDate(profile.createdAt)} />
            {profile.matricule && (
              <InfoRow icon={<Hash size={16} />} label="Matricule" value={profile.matricule} />
            )}
          </dl>

          {profile.role === 'adherent' && profile.adherent && (
            <div className="profile-subsection">
              <div className="profile-section-head">
                <h3>Informations adherent</h3>
              </div>
              <dl className="profile-info-list">
                <InfoRow icon={<Calendar size={16} />} label="Date naissance" value={formatDate(profile.adherent.dateNaissance)} />
                <InfoRow icon={<User size={16} />} label="Situation" value={profile.adherent.marie ? 'Marie(e)' : 'Celibataire'} />
                <InfoRow icon={<User size={16} />} label="Enfants" value={String(profile.adherent.enfants ?? '-')} />
                <InfoRow icon={<Wallet size={16} />} label="Salaire" value={formatCurrency(profile.adherent.salaire)} />
              </dl>
            </div>
          )}
        </aside>

        <form className="profile-panel profile-form" onSubmit={submit}>
          <div className="profile-section-head profile-section-head--split">
            <h3>Modifier mes informations</h3>
            <span>Identite et securite</span>
          </div>

          <div className="profile-form-grid">
            <FormInput
              label="Prenom"
              value={form.firstName}
              onChange={(event) => set('firstName', event.target.value)}
            />
            <FormInput
              label="Nom"
              value={form.lastName}
              onChange={(event) => set('lastName', event.target.value)}
            />
            <FormInput label="Email" value={profile.email} disabled readOnly />
            <FormInput
              label="Telephone"
              value={form.phone}
              onChange={(event) => set('phone', event.target.value)}
            />
          </div>

          <div className="profile-password-block">
            <h4>
              <KeyRound size={16} />
              Changer le mot de passe
            </h4>
            <div className="profile-password-grid">
              <PasswordInput
                label="Mot de passe actuel"
                value={form.currentPassword}
                onChange={(event) => set('currentPassword', event.target.value)}
                autoComplete="current-password"
              />
              <PasswordInput
                label="Nouveau mot de passe"
                value={form.newPassword}
                onChange={(event) => set('newPassword', event.target.value)}
                autoComplete="new-password"
              />
              <PasswordInput
                label="Confirmer le nouveau mot de passe"
                value={form.confirmPassword}
                onChange={(event) => set('confirmPassword', event.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <p className="profile-error" role="alert">
              {error}
            </p>
          )}

          <div className="profile-actions">
            <Button type="submit" isLoading={updateProfile.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="profile-summary-item">
      <span className="profile-summary-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="profile-info-row">
      <dt>
        <span className="profile-info-icon">{icon}</span>
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function initials(profile: ProfileResponse) {
  return `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    || ROLE_LABELS[profile.role].slice(0, 2).toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  if (value == null) {
    return '-';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(value);
}
