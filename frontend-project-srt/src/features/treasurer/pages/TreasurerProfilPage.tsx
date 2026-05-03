/* ============================================
   Treasurer — Profil
   ============================================ */

import { User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';

export function TreasurerProfilPage() {
  const { user } = useAuth();

  if (!user) return null;

  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'TR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Mon profil"
        description="Informations du compte trésorier"
        breadcrumb={['Trésorerie', 'Compte', 'Profil']}
      />

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 'var(--space-5)',
          alignItems: 'flex-start',
        }}
      >
        {/* Identity card */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xs)',
            padding: 'var(--space-5)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              margin: '0 auto var(--space-4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))',
              color: 'white',
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {initials}
          </div>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
            {user.firstName} {user.lastName}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
            Trésorier — Amicale SRT
          </p>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <span className="badge badge--success">Actif</span>
          </div>
        </div>

        {/* Details card */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xs)',
            padding: 'var(--space-5)',
          }}
        >
          <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
            Informations personnelles
          </h3>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', margin: 0 }}>
            <ProfileField icon={<User size={16} />} label="Prénom" value={user.firstName} />
            <ProfileField icon={<User size={16} />} label="Nom" value={user.lastName} />
            <ProfileField icon={<Mail size={16} />} label="E-mail" value={user.email} />
            <ProfileField icon={<Phone size={16} />} label="Téléphone" value={user.phone || '—'} />
            <ProfileField icon={<Shield size={16} />} label="Rôle" value="Trésorier" />
            <ProfileField icon={<Calendar size={16} />} label="Identifiant" value={user.id} />
          </dl>

          <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Button onClick={() => alert('Édition du profil — à connecter au backend.')}>
              Modifier mes informations
            </Button>
            <Button variant="secondary" onClick={() => alert('Changement de mot de passe — à connecter au backend.')}>
              Changer le mot de passe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileField({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--font-size-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--color-text-tertiary)',
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {icon}
        {label}
      </dt>
      <dd style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>
        {value}
      </dd>
    </div>
  );
}
