import { formatCurrency } from './formatters';
import type { TypeAvantage } from '../types/domain';

export type ConventionDemandeDisplayStatus = 'pending' | 'approved' | 'refused' | 'cancelled';

export const CONVENTION_DEMANDE_STATUS_LABEL: Record<ConventionDemandeDisplayStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvee',
  refused: 'Refusee',
  cancelled: 'Annulee',
};

export const CONVENTION_DEMANDE_STATUS_TONE: Record<
  ConventionDemandeDisplayStatus,
  'warning' | 'success' | 'error' | 'neutral'
> = {
  pending: 'warning',
  approved: 'success',
  refused: 'error',
  cancelled: 'neutral',
};

export const TYPE_AVANTAGE_LABEL: Record<TypeAvantage, string> = {
  REMISE_DIRECTE: 'Remise directe',
  ACHAT_TRANCHE: 'Achat tranche',
  ABONNEMENT: 'Abonnement',
  BON_ACHAT: "Bon d'achat",
};

export interface ConventionAvantageInput {
  typeAvantage?: TypeAvantage | string | null;
  remise?: number | null;
  avantage?: string | null;
  montantAvantage?: number | null;
  pourcentageAdherent?: number | null;
  nombreMoisRetenue?: number | null;
  montantTotal?: number | null;
  montantAdherent?: number | null;
  montantAmicale?: number | null;
  retenueNombreMois?: number | null;
  retenueMontantMensuel?: number | null;
}

export interface ConventionAvantageSummary {
  type: TypeAvantage | undefined;
  label: string;
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
}

export function normalizeConventionDemandeStatus(status?: string | null): ConventionDemandeDisplayStatus {
  switch ((status ?? '').toUpperCase()) {
    case 'SOUMISE':
    case 'EN_ATTENTE':
      return 'pending';
    case 'APPROUVEE':
    case 'EN_COURS':
    case 'JUSTIFIEE':
    case 'VALIDEE':
    case 'FACTUREE':
    case 'PAYEE':
      return 'approved';
    case 'REFUSEE':
      return 'refused';
    case 'ANNULEE':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function isConventionDemandePending(status?: string | null) {
  return normalizeConventionDemandeStatus(status) === 'pending';
}

export function getConventionAvantageSummary(input: ConventionAvantageInput): ConventionAvantageSummary {
  const type = normalizeTypeAvantage(input.typeAvantage);
  const label = type ? TYPE_AVANTAGE_LABEL[type] : 'Avantage';
  const total = input.montantTotal ?? input.montantAvantage ?? 0;
  const pct = input.pourcentageAdherent ?? percentageFromAmounts(input.montantAdherent, total);
  const adherent = input.montantAdherent ?? amountFromPercentage(total, pct);
  const amicale = input.montantAmicale ?? amountDiff(total, adherent);
  const months = input.retenueNombreMois ?? input.nombreMoisRetenue ?? (type && type !== 'REMISE_DIRECTE' ? 1 : undefined);
  const monthly = input.retenueMontantMensuel ?? (adherent != null && months ? adherent / months : undefined);

  if (type === 'REMISE_DIRECTE' || !type) {
    const remiseLabel = input.remise != null && input.remise > 0 ? `${input.remise}% de remise` : 'Remise directe';
    return {
      type,
      label,
      title: input.avantage || remiseLabel,
      subtitle: input.remise != null && input.remise > 0 ? `Remise effective : ${input.remise}%` : undefined,
      rows: [
        { label: "Type d'avantage", value: label },
        { label: 'Remise', value: input.remise != null && input.remise > 0 ? `${input.remise}%` : 'Selon conditions fournisseur' },
      ],
    };
  }

  const rows: { label: string; value: string }[] = [
    { label: "Type d'avantage", value: label },
    { label: 'Montant total', value: formatMoneyOrDash(total) },
    { label: 'Part adherent', value: formatPart(adherent, pct) },
    { label: 'Part amicale', value: formatMoneyOrDash(amicale) },
  ];

  if (type === 'ABONNEMENT') {
    rows.splice(2, 0, { label: 'Montant mensuel', value: formatMoneyOrDash(months && months > 1 ? total / months : total) });
  }

  if (type === 'ACHAT_TRANCHE') {
    rows.push(
      { label: 'Mois de retenue', value: months ? `${months} mois` : '-' },
      { label: 'Retenue mensuelle', value: formatMoneyOrDash(monthly) },
    );
  } else if (months && monthly) {
    rows.push({ label: 'Retenue', value: formatRetenue(monthly, months) });
  }

  return {
    type,
    label,
    title: `${label}${total > 0 ? ` - ${formatCurrency(total)}` : ''}`,
    subtitle: amicale != null ? `Pris en charge par l'amicale : ${formatCurrency(amicale)}` : undefined,
    rows,
  };
}

export function formatConventionAvantageCompact(input: ConventionAvantageInput) {
  const summary = getConventionAvantageSummary(input);
  return summary.subtitle ? `${summary.title} | ${summary.subtitle}` : summary.title;
}

function normalizeTypeAvantage(value?: TypeAvantage | string | null): TypeAvantage | undefined {
  if (!value) return undefined;
  return value in TYPE_AVANTAGE_LABEL ? value as TypeAvantage : undefined;
}

function amountFromPercentage(total: number, pct?: number | null) {
  if (pct == null || total <= 0) return undefined;
  return round2(total * pct / 100);
}

function amountDiff(total: number, part?: number | null) {
  if (total <= 0 || part == null) return undefined;
  return round2(total - part);
}

function percentageFromAmounts(part?: number | null, total?: number | null) {
  if (part == null || total == null || total <= 0) return undefined;
  return round2(part * 100 / total);
}

function formatMoneyOrDash(value?: number | null) {
  return value != null && value > 0 ? formatCurrency(value) : '-';
}

function formatPart(value?: number | null, pct?: number | null) {
  const money = formatMoneyOrDash(value);
  return pct != null ? `${money} (${pct}%)` : money;
}

function formatRetenue(monthly?: number | null, months?: number | null) {
  if (!monthly || !months) return '-';
  return `${formatCurrency(monthly)} / mois pendant ${months} mois`;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
