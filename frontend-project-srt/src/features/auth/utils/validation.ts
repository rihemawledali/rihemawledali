/* ============================================
   Utilitaires de validation de formulaire
   ============================================ */

import type { LoginPayload, SignupPayload, ValidationErrors } from '../types/auth.types';

// ---- Validateurs de champs individuels ----

export function validateEmail(email: string): string {
  if (!email.trim()) return 'L\'adresse e-mail est requise';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Veuillez saisir une adresse e-mail valide';
  return '';
}

export function validatePhone(phone: string): string {
  if (!phone.trim()) return 'Le numéro de téléphone est requis';
  const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;
  if (!phoneRegex.test(phone)) return 'Veuillez saisir un numéro de téléphone valide';
  return '';
}

export function validateRequired(value: string, fieldName: string): string {
  if (!value.trim()) return `Le champ ${fieldName} est requis`;
  return '';
}

// ---- Force du mot de passe ----

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Au moins 8 caractères', test: (p) => p.length >= 8 },
  { label: 'Une lettre majuscule', test: (p) => /[A-Z]/.test(p) },
  { label: 'Une lettre minuscule', test: (p) => /[a-z]/.test(p) },
  { label: 'Un chiffre', test: (p) => /\d/.test(p) },
  { label: 'Un caractère spécial (!@#$%...)', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

export type PasswordStrengthLevel = 'none' | 'weak' | 'fair' | 'good' | 'strong' | 'excellent';

export interface PasswordStrengthResult {
  score: number;       // 0–5
  level: PasswordStrengthLevel;
  label: string;
  rules: { label: string; passed: boolean }[];
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const rules = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    passed: rule.test(password),
  }));

  const score = rules.filter((r) => r.passed).length;

  const levels: { level: PasswordStrengthLevel; label: string }[] = [
    { level: 'none', label: '' },
    { level: 'weak', label: 'Faible' },
    { level: 'fair', label: 'Passable' },
    { level: 'good', label: 'Bon' },
    { level: 'strong', label: 'Fort' },
    { level: 'excellent', label: 'Excellent' },
  ];

  return {
    score,
    level: levels[score].level,
    label: levels[score].label,
    rules,
  };
}

export function validatePassword(password: string): string {
  if (!password) return 'Le mot de passe est requis';
  const strength = getPasswordStrength(password);
  if (strength.score < 5) return 'Le mot de passe ne respecte pas toutes les exigences';
  return '';
}

export function validateConfirmPassword(password: string, confirmPassword: string): string {
  if (!confirmPassword) return 'Veuillez confirmer votre mot de passe';
  if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas';
  return '';
}

// ---- Validateurs au niveau du formulaire ----

export function validateLoginForm(data: LoginPayload): ValidationErrors {
  const errors: ValidationErrors = {};
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  if (!data.password) errors.password = 'Le mot de passe est requis';
  return errors;
}

export function validateSignupForm(data: SignupPayload): ValidationErrors {
  const errors: ValidationErrors = {};

  const firstNameError = validateRequired(data.firstName, 'Prénom');
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateRequired(data.lastName, 'Nom');
  if (lastNameError) errors.lastName = lastNameError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const matriculeError = validateRequired(data.matricule, 'Matricule');
  if (matriculeError) errors.matricule = matriculeError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validateConfirmPassword(data.password, data.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;

  return errors;
}
