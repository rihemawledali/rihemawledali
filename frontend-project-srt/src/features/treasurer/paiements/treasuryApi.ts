/* Treasurer finance workflows backed by /api/treasurer/* endpoints. */

import type {
  Paiement,
  Facture,
  Indemnite,
  HistoriqueFinanciere,
  PageQuery,
  TypePaiement,
  BeneficiaireType,
  PaiementMode,
  PaiementStatus,
  HistoriqueSourceType,
  FactureStatus,
  IndemniteType,
  IndemniteStatus,
} from '../../../shared/types/domain';
import { get, post, put, del, downloadBlob, triggerBlobDownload } from '../../../shared/api/apiClient';
import { paginate } from '../../../shared/lib/paginate';

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
}

interface IndemniteDtoBE {
  id: string;
  adherentId: string;
  adherentNom: string;
  type: IndemniteType;
  montant: number;
  statut: IndemniteStatus;
  dateDemande: string;
  motif?: string | null;
  documentNom?: string | null;
  documentSize?: number | null;
  attachmentId?: string | null;
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
  };
}

function mapIndemnite(i: IndemniteDtoBE): Indemnite {
  return {
    id: i.id,
    adherentId: i.adherentId,
    adherentNom: i.adherentNom,
    type: i.type,
    montant: i.montant,
    statut: i.statut,
    dateDemande: i.dateDemande,
    motif: nz(i.motif),
    documentNom: nz(i.documentNom),
    documentSize: nz(i.documentSize),
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
   * (route through /valider or /annuler). Editing other fields throws.
   */
  update: async (id: string, patch: Partial<Paiement>): Promise<Paiement> => {
    const keys = Object.keys(patch).filter((k) => (patch as Record<string, unknown>)[k] !== undefined);
    const onlyStatut = keys.length === 1 && keys[0] === 'statut';
    if (!onlyStatut) {
      throw new Error("L'édition des paiements existants n'est pas supportée. Annulez et recréez le paiement.");
    }
    if (patch.statut === 'reussi') return paiementsApi.valider(id);
    if (patch.statut === 'rembourse' || patch.statut === 'echoue') return paiementsApi.annuler(id);
    throw new Error(`Transition de statut non supportée : ${patch.statut}`);
  },

  valider: async (id: string): Promise<Paiement> => {
    const { data } = await put<PaiementDtoBE>(`/api/treasurer/paiements/${id}/valider`, {});
    return mapPaiement(data);
  },

  annuler: async (id: string): Promise<Paiement> => {
    const { data } = await put<PaiementDtoBE>(`/api/treasurer/paiements/${id}/annuler`, {});
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
    };
    const { data: out } = await post<FactureDtoBE>('/api/treasurer/factures', body);
    return mapFacture(out);
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

// ---------------- indemnités helpers (cross-feature) ----------------

export const indemnitesWorkflow = {
  list: async (q?: PageQuery) => {
    const { data } = await get<IndemniteDtoBE[]>('/api/treasurer/indemnites');
    const items = data.map(mapIndemnite);
    return paginate<Indemnite>(items, q, ['adherentNom', 'type', 'statut', 'motif']);
  },

  getById: async (id: string): Promise<Indemnite | undefined> => {
    try {
      const { data } = await get<IndemniteDtoBE>(`/api/treasurer/indemnites/${id}`);
      return mapIndemnite(data);
    } catch {
      return undefined;
    }
  },

  valider: async (id: string): Promise<Indemnite> => {
    const { data } = await put<IndemniteDtoBE>(`/api/treasurer/indemnites/${id}/valider`, {});
    return mapIndemnite(data);
  },

  rejeter: async (id: string, motif?: string): Promise<Indemnite> => {
    const { data } = await put<IndemniteDtoBE>(
      `/api/treasurer/indemnites/${id}/rejeter`,
      motif ? { motif } : {},
    );
    return mapIndemnite(data);
  },

  annuler: async (id: string): Promise<Indemnite> => {
    const { data } = await put<IndemniteDtoBE>(`/api/treasurer/indemnites/${id}/annuler`, {});
    return mapIndemnite(data);
  },
};
