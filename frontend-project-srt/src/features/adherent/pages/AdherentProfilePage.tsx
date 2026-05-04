import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Calendar,
  Edit2,
  Hash,
  Headphones,
  Heart,
  KeyRound,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/data/Modal';
import { useToast } from '../../../components/feedback/useToast';
import {
  profileApi,
  type ChangePasswordRequest,
  type ProfileUpdateRequest,
} from '../api/profileApi';
import { ChangePasswordForm } from '../forms/ChangePasswordForm';
import { ProfileEditForm } from '../forms/ProfileEditForm';
import type { ProfileFormValues } from '../validators';
import './AdherentAccountPages.css';

export function AdherentProfilePage() {
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['adherent-profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: (request: ProfileUpdateRequest) => profileApi.updateProfile(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adherent-profile'] });
      setEditing(false);
      toast.push({ title: 'Profil mis à jour', variant: 'success' });
    },
    onError: () => {
      toast.push({ title: 'Échec de la mise à jour', variant: 'error' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (request: ChangePasswordRequest) => profileApi.changePassword(request),
    onSuccess: () => {
      setChangingPassword(false);
      toast.push({ title: 'Mot de passe modifié', variant: 'success' });
    },
    onError: (error) => {
      toast.push({
        title: error instanceof Error ? error.message : 'Échec du changement',
        variant: 'error',
      });
    },
  });

  const handleSubmit = async (values: ProfileFormValues) => {
    await updateMutation.mutateAsync({
      prenom: values.prenom,
      nom: values.nom,
      email: values.email,
      telephone: values.telephone,
      dateNaissance: values.dateNaissance,
      salaire: values.salaire,
      enfants: values.enfants,
    });
  };

  if (isLoading || !profile) {
    return (
      <div className="adh-account-page">
        <PageHeader title="Mon profil" description="Chargement..." />
        <div className="adh-profile-shell">
          <div className="adh-profile-main-skeleton skeleton" />
          <div className="adh-profile-side-skeleton skeleton" />
        </div>
      </div>
    );
  }

  const initials = `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase() || 'A';
  const fullName = `${profile.prenom} ${profile.nom}`;
  const memberSince = profile.createdAt ? formatLongDate(profile.createdAt) : 'Non renseigné';

  const rows: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: User, label: 'Nom complet', value: fullName },
    { icon: Hash, label: 'Matricule', value: profile.matricule || 'Non renseigné' },
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: Phone, label: 'Téléphone', value: profile.telephone || 'Non renseigné' },
    { icon: Calendar, label: 'Membre depuis', value: memberSince },
    { icon: Heart, label: 'Situation', value: profile.marie ? 'Marié(e)' : 'Célibataire' },
    { icon: Users, label: 'Enfants à charge', value: String(profile.enfants ?? 0) },
    { icon: Wallet, label: 'Salaire mensuel', value: formatCurrency(profile.salaire || 0) },
  ];

  return (
    <div className="adh-account-page">
      <PageHeader
        title="Mon profil"
        description="Vos informations personnelles et les paramètres de sécurité du compte."
        actions={(
          <Button onClick={() => setEditing(true)}>
            <Edit2 size={15} className="adh-account-btn-icon" />
            Modifier
          </Button>
        )}
      />

      <div className="adh-profile-shell">
        <article className="adh-profile-main-card">
          <div className="adh-profile-identity">
            <div className="adh-profile-avatar-large">{initials}</div>
            <div className="adh-profile-heading">
              <span className="adh-account-kicker">Compte adhérent</span>
              <h2>{fullName}</h2>
              <div className="adh-profile-badges">
                <span className="adh-profile-badge">
                  <BadgeCheck size={13} />
                  Adhérent
                </span>
                <span className={`adh-profile-status ${profile.status === 'actif' ? 'is-active' : 'is-inactive'}`}>
                  {profile.status === 'actif' ? 'Compte actif' : 'Compte inactif'}
                </span>
              </div>
            </div>
          </div>

          <div className="adh-profile-info-grid">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="adh-profile-info-item">
                <span className="adh-profile-info-icon">
                  <Icon size={16} />
                </span>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="adh-profile-aside">
          <section className="adh-account-panel">
            <header className="adh-account-panel-head">
              <span className="adh-account-panel-icon is-info">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h3>Sécurité</h3>
                <p>Accès et mot de passe</p>
              </div>
            </header>
            <p className="adh-account-panel-copy">
              Gardez un mot de passe unique et mettez-le à jour lorsque nécessaire.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setChangingPassword(true)}>
              <KeyRound size={14} className="adh-account-btn-icon" />
              Changer mon mot de passe
            </Button>
          </section>

          <section className="adh-account-panel">
            <header className="adh-account-panel-head">
              <span className="adh-account-panel-icon is-success">
                <Headphones size={18} />
              </span>
              <div>
                <h3>Assistance</h3>
                <p>Contact Amicale SRT</p>
              </div>
            </header>
            <p className="adh-account-panel-copy">
              Pour les données sensibles comme le matricule, le salaire ou la situation familiale,
              contactez l’administration.
            </p>
            <div className="adh-profile-contact-row">
              <a href="mailto:contact@amicale-srt.tn">
                <Mail size={13} />
                Email
              </a>
              <a href="tel:+21671000000">
                <Phone size={13} />
                Téléphone
              </a>
              <span>
                <MessageCircle size={13} />
                9h-17h
              </span>
            </div>
          </section>
        </aside>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Modifier mon profil" size="lg">
        <ProfileEditForm
          profile={profile}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(false)}
          submitting={updateMutation.isPending}
        />
      </Modal>

      <Modal
        open={changingPassword}
        onClose={() => setChangingPassword(false)}
        title="Changer mon mot de passe"
        size="sm"
      >
        <ChangePasswordForm
          onSubmit={async (values) => {
            await passwordMutation.mutateAsync(values);
          }}
          onCancel={() => setChangingPassword(false)}
          submitting={passwordMutation.isPending}
        />
      </Modal>
    </div>
  );
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(value);
}
