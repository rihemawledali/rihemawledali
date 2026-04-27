/* ============================================
   Formatters — currency, dates, numbers
   ============================================ */

import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const currency = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const numberFmt = new Intl.NumberFormat('fr-FR');

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

export function formatDate(iso: string, pattern = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(iso), pattern, { locale: fr });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  return formatDate(iso, 'dd MMM yyyy, HH:mm');
}

export function formatRelative(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: fr });
  } catch {
    return iso;
  }
}

export function daysUntil(iso: string): number {
  const ms = parseISO(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}
