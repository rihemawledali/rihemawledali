/* ============================================
   Form Validation Utilities
   ============================================ */

import type { LoginPayload, SignupPayload, ValidationErrors } from '../types/auth.types';

// ---- Individual Field Validators ----

export function validateEmail(email: string): string {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
}

export function validatePhone(phone: string): string {
  if (!phone.trim()) return 'Phone number is required';
  const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;
  if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
  return '';
}

export function validateRequired(value: string, fieldName: string): string {
  if (!value.trim()) return `${fieldName} is required`;
  return '';
}

// ---- Password Strength ----

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character (!@#$%...)', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
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
    { level: 'weak', label: 'Weak' },
    { level: 'fair', label: 'Fair' },
    { level: 'good', label: 'Good' },
    { level: 'strong', label: 'Strong' },
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
  if (!password) return 'Password is required';
  const strength = getPasswordStrength(password);
  if (strength.score < 5) return 'Password does not meet all requirements';
  return '';
}

export function validateConfirmPassword(password: string, confirmPassword: string): string {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
}

// ---- Form-Level Validators ----

export function validateLoginForm(data: LoginPayload): ValidationErrors {
  const errors: ValidationErrors = {};
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  if (!data.password) errors.password = 'Password is required';
  return errors;
}

export function validateSignupForm(data: SignupPayload): ValidationErrors {
  const errors: ValidationErrors = {};

  const firstNameError = validateRequired(data.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateRequired(data.lastName, 'Last name');
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
