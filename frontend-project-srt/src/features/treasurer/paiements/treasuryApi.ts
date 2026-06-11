/* Treasurer finance workflows backed by /api/treasurer/* endpoints. */

import type {
  Paiement,
  Facture,
  HistoriqueFinanciere,
  PageQuery,
  TypePaiement,
  BeneficiaireType,
  PaiementMode,
  PaiementStatus,
  HistoriqueSourceType,
  FactureStatus,
} from '../../../shared/types/domain';
import { get, post, put, del, downloadBlob, triggerBlobDownload } from '../../../shared/api/apiClient';
import { paginate } from '../../../shared/lib/paginate';
import { normalizeConventionDemandeStatus } from '../../../shared/lib/conventionWorkflow';
import type { ConventionDemandeRow, ConventionDemandeStatutBE } from '../api/treasurerListApi';

// ---------------- DTO shapes returned by the backend ----------------

interface PaiementDtoBE {
  id: string;
  reference: string;
  typePaiement: TypePaiement;
  beneficiaireType: BeneficiaireType;
  beneficiaireId?: string | null;
  beneficiaire: string;
  factureId?: string | null;
  factureNumero?: string | null;
  indemniteId?: string | null;
  montant: number;
  mode: PaiementMode;
  statut: PaiementStatus;
  description?: string | null;
  date: string;
  compteBancaireId?: string | null;
  compteBancaireBanque?: string | null;
}

interface FactureDtoBE {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseurNom: string;
  montant: number;
  statut: FactureStatus;
  dateEmission: string;
  dateEcheance: string;
  description?: string | null;
  sourceType?: 'MANUEL' | 'CONVENTION' | null;
  mois?: number | null;
  annee?: number | null;
}

interface ConventionDemandeDtoBE {
  id: string;
  conventionId: string;
  adherentId: string;
  adherentNom: string;
  dateDemande: string;
  statut: string;
  dateDecision?: string | null;
  motifRefus?: string | null;
  commentaire?: string | null;
  documentNom?: string | null;
  attachmentId?: string | null;
  typeAvantage?: string | null;
  montantAvantage?: number | null;
  pourcentageAdherent?: number | null;
  nombreMoisRetenue?: number | null;
  factureId?: string | null;
  factureNumero?: string | null;
  factureMois?: number | null;
  factureAnnee?: number | null;
  montantTotal?: number | null;
  montantAdherent?: number | null;
  montantAmicale?: number | null;
  retenueMoisDebut?: number | null;
  retenueAnneeDebut?: number | null;
  retenueNombreMois?: number | null;
  retenueMontantMensuel?: number | null;
  conventionSnapshot?: ConventionDemandeRow['conventionSnapshot'] | null;
}

interface HistoriqueTresorerieDtoBE {
  id: string;
  type: 'entree' | 'sortie';
  sourceType?: HistoriqueSourceType | null;
  sourceRefId?: string | null;
  description?: string | null;
  montant: number;
  date: string;
  reference?: string | null;
  modePaiement?: PaiementMode | null;
  statut?: PaiementStatus | null;
  utilisateur?: string | null;
  typeOperation?: string | null;
  compteBancaireId?: string | null;
  compteBancaireBanque?: string | null;
}

// ---------------- mappers ----------------

const nz = <T,>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);

function mapPaiement(p: PaiementDtoBE): Paiement {
  return {
    id: p.id,
    reference: p.reference,
    typePaiement: p.typePaiement,
    beneficiaireType: p.beneficiaireType,
    beneficiaireId: nz(p.beneficiaireId),
    beneficiaire: p.beneficiaire,
    factureId: nz(p.factureId),
    factureNumero: nz(p.factureNumero),
    indemniteId: nz(p.indemniteId),
    description: nz(p.description),
    montant: p.montant,
    mode: p.mode,
    statut: p.statut,
    date: p.date,
    compteBancaireId: nz(p.compteBancaireId),
    compteBancaireBanque: nz(p.compteBancaireBanque),
  };
}

function mapFacture(f: FactureDtoBE): Facture {
  return {
    id: f.id,
    numero: f.numero,
    fournisseurId: f.fournisseurId,
    fournisseurNom: f.fournisseurNom,
    montant: f.montant,
    statut: f.statut,
    dateEmission: f.dateEmission,
    dateEcheance: f.dateEcheance,
    dateFacture: f.dateEmission,
    description: nz(f.description),
    sourceType: nz(f.sourceType),
    mois: nz(f.mois),
    annee: nz(f.annee),
  };
}

function mapConventionDemande(d: ConventionDemandeDtoBE): ConventionDemandeRow {
  return {
    id: d.id,
    conventionId: d.conventionId,
    adherentId: d.adherentId,
    adherentNom: d.adherentNom,
    dateDemande: d.dateDemande,
    statut: (d.statut as ConventionDemandeStatutBE) ?? 'SOUMISE',
    statutNormalise: normalizeConventionDemandeStatus(d.statut),
    dateDecision: nz(d.dateDecision),
    motifRefus: nz(d.motifRefus),
    commentaire: nz(d.commentaire),
    documentNom: nz(d.documentNom),
    attachmentId: nz(d.attachmentId),
    typeAvantage: nz(d.typeAvantage),
    montantAvantage: nz(d.montantAvantage),
    pourcentageAdherent: nz(d.pourcentageAdherent),
    nombreMoisRetenue: nz(d.nombreMoisRetenue),
    factureId: nz(d.factureId),
    factureNumero: nz(d.factureNumero),
    factureMois: nz(d.factureMois),
    factureAnnee: nz(d.factureAnnee),
    montantTotal: nz(d.montantTotal),
    montantAdherent: nz(d.montantAdherent),
    montantAmicale: nz(d.montantAmicale),
    retenueMoisDebut: nz(d.retenueMoisDebut),
    retenueAnneeDebut: nz(d.retenueAnneeDebut),
    retenueNombreMois: nz(d.retenueNombreMois),
    retenueMontantMensuel: nz(d.retenueMontantMensuel),
    conventionSnapshot: nz(d.conventionSnapshot),
  };
}

function mapHistorique(h: HistoriqueTresorerieDtoBE): HistoriqueFinanciere {
  return {
    id: h.id,
    type: h.type,
    sourceType: nz(h.sourceType),
    sourceRefId: nz(h.sourceRefId),
    description: h.description ?? '',
    montant: h.montant,
    date: h.date,
    reference: nz(h.reference),
    modePaiement: nz(h.modePaiement),
    statut: nz(h.statut),
    utilisateur: nz(h.utilisateur),
    typeOperation: nz(h.typeOperation),
    compteBancaireId: nz(h.compteBancaireId),
    compteBancaireBanque: nz(h.compteBancaireBanque),
  };
}

// ---------------- paiements ----------------

export interface CreatePaiementInput {
  reference?: string;
  typePaiement: TypePaiement;
  beneficiaireType?: BeneficiaireType;
  beneficiaireId?: string;
  beneficiaire: string;
  montant: number;
  mode: PaiementMode;
  statut?: PaiementStatus;
  factureId?: string;
  factureNumero?: string; // ignored by backend (resolved server-side)
  indemniteId?: string;
  description?: string;
  date?: string;
  compteBancaireId: string;
}

interface PayWorkflowPayload {
  reference?: string;
  montant: number;
  mode: PaiementMode;
  description?: string;
  beneficiaire?: string;
  compteBancaireId: string;
}

export const paiementsApi = {
  list: async (q?: PageQuery) => {
    const { data } = await get<PaiementDtoBE[]>('/api/treasurer/paiements');
    const items = data.map(mapPaiement);
    return paginate<Paiement>(items, q, ['reference', 'beneficiaire', 'factureNumero']);
  },

  getById: async (id: string): Promise<Paiement | undefined> => {
    try {
      const { data } = await get<PaiementDtoBE>(`/api/treasurer/paiements/${id}`);
      return mapPaiement(data);
    } catch {
      return undefined;
    }
  },

  /** Generic creation (preferred for AUTRE_SORTIE; workflow paths handle the rest). */
  create: async (input: CreatePaiementInput): Promise<Paiement> => {
    const body = {
      reference: input.reference,
      typePaiement: input.typePaiement,
      beneficiaireType: input.beneficiaireType,
      beneficiaireId: input.beneficiaireId ? Number(input.beneficiaireId) : undefined,
      beneficiaire: input.beneficiaire,
      factureId: input.factureId ? Number(input.factureId) : undefined,
      indemniteId: input.indemniteId ? Number(input.indemniteId) : undefined,
      montant: input.montant,
      mode: input.mode,
      statut: input.statut,
      description: input.description,
      date: input.date,
      compteBancaireId: input.compteBancaireId ? Number(input.compteBancaireId) : undefined,
    };
    const { data } = await post<PaiementDtoBE>('/api/treasurer/paiements', body);
    return mapPaiement(data);
  },

  payFacture: async (factureId: string, payload: PayWorkflowPayload): Promise<Paiement> => {
    const { data } = await post<PaiementDtoBE>(`/api/treasurer/factures/${factureId}/payer`, payload);
    return mapPaiement(data);
  },

  payIndemnite: async (indemniteId: string, payload: PayWorkflowPayload): Promise<Paiement> => {
    const { data } = await post<PaiementDtoBE>(
      `/api/treasurer/paiements/payer-indemnite/${indemniteId}`,
      payload,
    );
    return mapPaiement(data);
  },

  /**
   * Update a paiement. Only statut transitions are supported by the backend
   * (route through /valider). Editing other fields throws.
   */
  update: async (id: string, patch: Partial<Paiement>): Promise<Paiement> => {
    const keys = Object.keys(patch).filter((k) => (patch as Record<string, unknown>)[k] !== undefined);
    const onlyStatut = keys.length === 1 && keys[0] === 'statut';
    if (!onlyStatut) {
      throw new Error("L'édition des paiements existants n'est pas supportée. Recréez le paiement.");
    }
    if (patch.statut === 'reussi') return paiementsApi.valider(id);
    throw new Error(`Transition de statut non supportée : ${patch.statut}`);
  },

  valider: async (id: string): Promise<Paiement> => {
    const { data } = await put<PaiementDtoBE>(`/api/treasurer/paiements/${id}/valider`, {});
    return mapPaiement(data);
  },

  remove: async (id: string): Promise<{ success: true }> => {
    await del(`/api/treasurer/paiements/${id}`);
    return { success: true as const };
  },
};

// ---------------- factures ----------------

export const facturesApi = {
  list: async (q?: PageQuery) => {
    const { data } = await get<FactureDtoBE[]>('/api/treasurer/factures');
    const items = data.map(mapFacture);
    return paginate<Facture>(items, q, ['numero', 'fournisseurNom', 'description']);
  },

  getById: async (id: string): Promise<Facture | undefined> => {
    try {
      const { data } = await get<FactureDtoBE>(`/api/treasurer/factures/${id}`);
      return mapFacture(data);
    } catch {
      return undefined;
    }
  },

  create: async (data: Omit<Facture, 'id'>): Promise<Facture> => {
    const body = {
      numero: data.numero,
      fournisseurId: Number(data.fournisseurId),
      montant: data.montant,
      statut: data.statut,
      dateEmission: data.dateEmission,
      dateEcheance: data.dateEcheance,
      description: data.description,
      sourceType: data.sourceType,
      mois: data.mois,
      annee: data.annee,
    };
    const { data: out } = await post<FactureDtoBE>('/api/treasurer/factures', body);
    return mapFacture(out);
  },

  eligibleConventionDemandes: async (input: { fournisseurId: string; mois: number; annee: number }): Promise<ConventionDemandeRow[]> => {
    const params = new URLSearchParams({
      fournisseurId: input.fournisseurId,
      mois: String(input.mois),
      annee: String(input.annee),
    });
    const { data } = await get<ConventionDemandeDtoBE[]>(`/api/treasurer/factures/conventions/eligible?${params.toString()}`);
    return data.map(mapConventionDemande);
  },

  generateConventionFacture: async (input: {
    fournisseurId: string;
    mois: number;
    annee: number;
    demandeIds: string[];
  }): Promise<Facture> => {
    const { data } = await post<FactureDtoBE>('/api/treasurer/factures/conventions/generer', {
      fournisseurId: Number(input.fournisseurId),
      mois: input.mois,
      annee: input.annee,
      demandeIds: input.demandeIds.map(Number),
    });
    return mapFacture(data);
  },

  conventionDemandes: async (factureId: string): Promise<ConventionDemandeRow[]> => {
    const { data } = await get<ConventionDemandeDtoBE[]>(`/api/treasurer/factures/${factureId}/convention-demandes`);
    return data.map(mapConventionDemande);
  },

  validerConvention: async (id: string): Promise<Facture> => {
    const { data } = await put<FactureDtoBE>(`/api/treasurer/factures/${id}/valider-convention`, {});
    return mapFacture(data);
  },

  update: async (id: string, patch: Partial<Facture>): Promise<Facture> => {
    const body = {
      numero: patch.numero,
      fournisseurId: patch.fournisseurId ? Number(patch.fournisseurId) : undefined,
      montant: patch.montant,
      statut: patch.statut,
      dateEmission: patch.dateEmission,
      dateEcheance: patch.dateEcheance,
      description: patch.description,
      sourceType: patch.sourceType,
      mois: patch.mois,
      annee: patch.annee,
    };
    const { data: out } = await put<FactureDtoBE>(`/api/treasurer/factures/${id}`, body);
    return mapFacture(out);
  },

  annuler: async (id: string): Promise<Facture> => {
    const { data } = await put<FactureDtoBE>(`/api/treasurer/factures/${id}/annuler`, {});
    return mapFacture(data);
  },

  remove: async (id: string): Promise<{ success: true }> => {
    await del(`/api/treasurer/factures/${id}`);
    return { success: true as const };
  },

  /**
   * Fetches the freshly-rendered PDF for the given facture and triggers a
   * browser download. The filename comes from the `Content-Disposition`
   * header (falls back to `facture-<id>.pdf`).
   */
  downloadPdf: async (id: string): Promise<{ filename: string }> => {
    const { blob, filename } = await downloadBlob(
      `/api/treasurer/factures/${id}/pdf`,
      { method: 'GET', headers: { Accept: 'application/pdf' } },
    );
    const finalName = filename || `facture-${id}.pdf`;
    triggerBlobDownload(blob, finalName);
    return { filename: finalName };
  },
};

// ---------------- historique ----------------

export const historiqueApi = {
  list: async (q?: PageQuery) => {
    const params = new URLSearchParams();
    const t = q?.filters?.type;
    if (t) params.set('type', t);
    const url = `/api/treasurer/historique${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await get<HistoriqueTresorerieDtoBE[]>(url);
    const items = data.map(mapHistorique);
    return paginate<HistoriqueFinanciere>(items, q, ['description', 'reference', 'utilisateur']);
  },
};
