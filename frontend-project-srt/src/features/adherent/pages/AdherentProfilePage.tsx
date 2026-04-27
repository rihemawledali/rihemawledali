/* ============================================
   Adherent Profile — Refined design
   ============================================ */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Phone, Calendar, Wallet, Users, Edit2, KeyRound, ShieldCheck,
  Hash, Heart, BadgeCheck, Headphones, MessageCircle,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/data/Modal';
import { useToast } from '../../../components/feedback/useToast';
import {
  profileApi, type ProfileUpdateRequest, type ChangePasswordRequest,
} from '../api/profileApi';
import { ProfileEditForm } from '../forms/ProfileEditForm';
import { ChangePasswordForm } from '../forms/ChangePasswordForm';
import type { ProfileFormValues } from '../validators';

export function AdherentProfilePage() {
  const [editing, setEditing] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['adherent-profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: (req: ProfileUpdateRequest) => profileApi.updateProfile(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adherent-profile'] });
      setEditing(false);
      toast.push({ title: 'Profil mis à jour', variant: 'success' });
    },
    onError: () => {
      toast.push({ title: 'Échec de la mise à jour', variant: 'error' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (req: ChangePasswordRequest) => profileApi.changePassword(req),
    onSuccess: () => {
      setChangingPwd(false);
      toast.push({ title: 'Mot de passe modifié', variant: 'success' });
    },
    onError: (err) => {
      toast.push({
        title: err instanceof Error ? err.message : 'Échec du changement',
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
      <div>
        <PageHeader title="Mon profil" description="Chargement…" />
        <div className="adh-profile-grid">
          <div className="skeleton" style={{ height: 460 }} />
          <div className="skeleton" style={{ height: 320 }} />
        </div>
      </div>
    );
  }

  const initials = `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase();
  const fullName = `${profile.prenom} ${profile.nom}`;
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const rows = [
    { icon: User,     label: 'Nom complet',       value: fullName },
    { icon: Hash,     label: 'Matricule',         value: profile.matricule || '—' },
    { icon: Mail,     label: 'Email',             value: profile.email },
    { icon: Phone,    label: 'Téléphone',         value: profile.telephone || '—' },
    { icon: Calendar, label: 'Membre depuis',     value: memberSince },
    { icon: Heart,    label: 'Situation',         value: profile.marie ? 'Marié(e)' : 'Célibataire' },
    { icon: Users,    label: 'Enfants à charge',  value: String(profile.enfants ?? 0) },
    { icon: Wallet,   label: 'Salaire mensuel',   value: `${(profile.salaire || 0).toLocaleString('fr-FR')} TND` },
  ];

  return (
    <div>
      <PageHeader
        title="Mon profil"
        description="Vos informations personnelles et la sécurité du compte."
        actions={
          <Button onClick={() => setEditing(true)}>
            <Edit2 size={15} style={{ marginRight: 8 }} />
            Modifier
          </Button>
        }
      />

      <div className="adh-profile-grid">
        {/* ---- Main profile card ---- */}
        <article className="adh-profile-card">
          <div className="adh-profile-banner" />
          <div className="adh-profile-header">
            <div className="adh-profile-avatar">{initials || 'A'}</div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <h2 style={{
                margin: '0 0 4px',
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--adh-text-1)',
                letterSpacing: '-0.015em',
              }}>{fullName}</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="adh-profile-tag">
                  <BadgeCheck size={11} /> Adhérent
                </span>
                <span
                  className={`adh-profile-status-pill ${profile.status === 'actif' ? 'active' : 'inactive'}`}
                >
                  {profile.status === 'actif' ? 'Compte actif' : 'Compte inactif'}
                </span>
              </div>
            </div>
          </div>

          <div className="adh-profile-list">
            {rows.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className="adh-profile-row">
                  <span className="adh-profile-row-icon"><Icon size={15} /></span>
                  <span className="adh-profile-row-label">{r.label}</span>
                  <span className="adh-profile-row-value">{r.value}</span>
                </div>
              );
            })}
          </div>
        </article>

        {/* ---- Side: security + help ---- */}
        <aside className="adh-profile-side">
          <section className="adh-profile-side-section">
            <h3 className="adh-profile-side-title"><ShieldCheck size={13} /> Sécurité</h3>
            <p className="adh-profile-side-text">
              Votre mot de passe est <strong>chiffré et privé</strong>. Pensez à le renouveler
              régulièrement et utilisez un mot de passe long et unique.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setChangingPwd(true)} style={{ marginTop: 10 }}>
              <KeyRound size={14} style={{ marginRight: 6 }} />
              Changer mon mot de passe
            </Button>
          </section>

          <section className="adh-profile-side-section">
            <h3 className="adh-profile-side-title"><Headphones size={13} /> Besoin d'aide ?</h3>
            <p className="adh-profile-side-text">
              Pour toute modification nécessitant une vérification (matricule, salaire,
              situation familiale), contactez l'administration de l'Amicale SRT.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <a
                href="mailto:contact@amicale-srt.tn"
                className="adh-profile-tag"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <Mail size={11} /> Email
              </a>
              <a
                href="tel:+21671000000"
                className="adh-profile-tag"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <Phone size={11} /> Téléphone
              </a>
              <span className="adh-profile-tag">
                <MessageCircle size={11} /> 9h–17h
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
        open={changingPwd}
        onClose={() => setChangingPwd(false)}
        title="Changer mon mot de passe"
        size="sm"
      >
        <ChangePasswordForm
          onSubmit={async (vals) => { await passwordMutation.mutateAsync(vals); }}
          onCancel={() => setChangingPwd(false)}
          submitting={passwordMutation.isPending}
        />
      </Modal>
    </div>
  );
}
