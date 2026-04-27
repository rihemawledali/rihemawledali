/* ============================================
   Change Password Form — Adherent Portal
   ============================================ */

import { useState } from 'react';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';

export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordFormProps {
  onSubmit: (values: { currentPassword: string; newPassword: string }) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function ChangePasswordForm({ onSubmit, onCancel, submitting }: ChangePasswordFormProps) {
  const [values, setValues] = useState<ChangePasswordValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordValues, string>>>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!values.currentPassword) e.currentPassword = 'Mot de passe actuel requis';
    if (!values.newPassword) e.newPassword = 'Nouveau mot de passe requis';
    else if (values.newPassword.length < 8) e.newPassword = 'Au moins 8 caractères';
    else if (!/[A-Z]/.test(values.newPassword) || !/[0-9]/.test(values.newPassword))
      e.newPassword = 'Doit contenir une majuscule et un chiffre';
    if (!values.confirmPassword) e.confirmPassword = 'Confirmation requise';
    else if (values.confirmPassword !== values.newPassword)
      e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit({ currentPassword: values.currentPassword, newPassword: values.newPassword });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Échec';
      setErrors({ currentPassword: msg });
    }
  };

  const set = <K extends keyof ChangePasswordValues>(k: K, v: ChangePasswordValues[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <PasswordInput
        label="Mot de passe actuel"
        value={values.currentPassword}
        onChange={(e) => set('currentPassword', e.target.value)}
        error={errors.currentPassword}
        autoComplete="current-password"
      />
      <PasswordInput
        label="Nouveau mot de passe"
        value={values.newPassword}
        onChange={(e) => set('newPassword', e.target.value)}
        error={errors.newPassword}
        autoComplete="new-password"
      />
      <PasswordInput
        label="Confirmer le nouveau mot de passe"
        value={values.confirmPassword}
        onChange={(e) => set('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
        Le mot de passe doit comporter au moins 8 caractères, une majuscule et un chiffre.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting}>
          Changer le mot de passe
        </Button>
      </div>
    </form>
  );
}
