/* ============================================
   Offers API — backed by /api/treasurer/tickets + /bons-commande
   --------------------------------------------------
   Same contract as before: `list / create / update / remove`. Pagination
   is applied client-side on top of the full backend list via paginate().
   ============================================ */

import type {
  BonCommande,
  BonCommandeDetail,
  BonStatus,
  PageQuery,
  TicketAssignPayload,
  TicketRestaurant,
  TicketType,
  Utilisateur,
} from '../../../shared/types/domain';
import { get, post, put, del, downloadBlob, triggerBlobDownload } from '../../../shared/lib/apiClient';
import { paginate } from '../../../shared/lib/paginate';

// ---------------- Backend DTOs ----------------

interface BonCommandeDtoBE {
  id: string;
  numero: string;
  fournisseurId?: string | null;
  fournisseurNom?: string | null;
  adherentId?: string | null;
  adherentNom?: string | null;
  typeBon?: string | null;
  montant: number;
  valeurUnitaire?: number | null;
  quantiteTotale?: number | null;
  quantiteRestante?: number | null;
  quantiteAttribuee?: number | null;
  statut: string;
  dateEmission?: string | null;
  dateExpiration?: string | null;
}

interface BonCommandeDetailDtoBE {
  bon: BonCommandeDtoBE;
  tickets: TicketDtoBE[];
}

interface TicketDtoBE {
  id: string;
  numero: string;
  typeBon: string;
  montant: number;
  statut: string;
  adherentId?: string | null;
  adherentNom?: string | null;
  adherentMatricule?: string | null;
  bonCommandeId?: string | null;
  bonCommandeNumero?: string | null;
  dateEmission?: string | null;
  dateAttribution?: string | null;
  dateDecision?: string | null;
}

interface TreasurerAdherentDtoBE {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: string;
  statut: string;
  matricule?: string | null;
  createdAt?: string | null;
}

// ---------------- Mappers ----------------

function mapBon(b: BonCommandeDtoBE): BonCommande {
  return {
    id: b.id,
    numero: b.numero,
    fournisseurId: b.fournisseurId ?? '',
    fournisseurNom: b.fournisseurNom ?? '',
    adherentId: b.adherentId ?? undefined,
    adherentNom: b.adherentNom ?? undefined,
    typeBon: (b.typeBon as TicketType) ?? 'restaurant',
    montant: b.montant,
    valeurUnitaire: b.valeurUnitaire ?? undefined,
    quantiteTotale: b.quantiteTotale ?? undefined,
    quantiteRestante: b.quantiteRestante ?? undefined,
    quantiteAttribuee: b.quantiteAttribuee ?? undefined,
    statut: (b.statut as BonStatus) ?? 'brouillon',
    dateEmission: b.dateEmission ?? '',
    dateExpiration: b.dateExpiration ?? '',
  };
}

function mapTicket(t: TicketDtoBE): TicketRestaurant {
  return {
    id: t.id,
    numero: t.numero,
    typeBon: (t.typeBon as TicketType) ?? 'restaurant',
    montant: t.montant,
    statut: (t.statut as BonStatus) ?? 'en_attente',
    adherentId: t.adherentId ?? undefined,
    adherentNom: t.adherentNom ?? undefined,
    adherentMatricule: t.adherentMatricule ?? undefined,
    bonCommandeId: t.bonCommandeId ?? undefined,
    bonCommandeNumero: t.bonCommandeNumero ?? undefined,
    dateEmission: t.dateEmission ?? '',
    dateAttribution: t.dateAttribution ?? undefined,
    dateDecision: t.dateDecision ?? undefined,
  };
}

function mapAdherent(u: TreasurerAdherentDtoBE): Utilisateur {
  return {
    id: u.id,
    nom: u.lastName,
    prenom: u.firstName,
    email: u.email,
    telephone: u.phone ?? '',
    role: 'adherent',
    status: (u.statut?.toLowerCase() as Utilisateur['status']) ?? 'actif',
    matricule: u.matricule ?? undefined,
    createdAt: u.createdAt ?? new Date().toISOString(),
  };
}

const toLong = (v?: string | number | null): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

// ---------------- Bons de commande ----------------

export const bonsCommandeApi = {
  list: async (q?: PageQuery) => {
    const { data } = await get<BonCommandeDtoBE[]>('/api/treasurer/bons-commande');
    return paginate<BonCommande>(data.map(mapBon), q, ['numero', 'fournisseurNom', 'adherentNom', 'typeBon']);
  },

  detail: async (id: string): Promise<BonCommandeDetail> => {
    const { data } = await get<BonCommandeDetailDtoBE>(`/api/treasurer/bons-commande/${id}`);
    return {
      bon: mapBon(data.bon),
      tickets: data.tickets.map(mapTicket),
    };
  },

  valider: async (id: string): Promise<BonCommande> => {
    const { data } = await post<BonCommandeDtoBE>(`/api/treasurer/bons-commande/${id}/valider`, {});
    return mapBon(data);
  },

  create: async (data: Omit<BonCommande, 'id'>): Promise<BonCommande> => {
    const body = {
      numero: data.numero,
      fournisseurId: toLong(data.fournisseurId),
      adherentId: toLong(data.adherentId),
      typeBon: data.typeBon,
      montant: data.montant,
      valeurUnitaire: data.valeurUnitaire,
      quantiteTotale: data.quantiteTotale,
      statut: data.statut,
      dateEmission: data.dateEmission,
      dateExpiration: data.dateExpiration,
    };
    const { data: out } = await post<BonCommandeDtoBE>('/api/treasurer/bons-commande', body);
    return mapBon(out);
  },

  update: async (id: string, patch: Partial<BonCommande>): Promise<BonCommande> => {
    const body = {
      numero: patch.numero,
      fournisseurId: toLong(patch.fournisseurId),
      adherentId: toLong(patch.adherentId),
      typeBon: patch.typeBon,
      montant: patch.montant,
      valeurUnitaire: patch.valeurUnitaire,
      quantiteTotale: patch.quantiteTotale,
      statut: patch.statut,
      dateEmission: patch.dateEmission,
      dateExpiration: patch.dateExpiration,
    };
    const { data: out } = await put<BonCommandeDtoBE>(`/api/treasurer/bons-commande/${id}`, body);
    return mapBon(out);
  },

  remove: async (id: string): Promise<{ success: true }> => {
    await del(`/api/treasurer/bons-commande/${id}`);
    return { success: true as const };
  },

  /**
   * Download the purchase-order PDF for a bon de commande. The backend
   * restricts this to bons still in {@code brouillon}; other statuts
   * return a 404 with a JSON error body.
   */
  downloadPdf: async (id: string): Promise<{ filename: string }> => {
    const { blob, filename } = await downloadBlob(
      `/api/treasurer/bons-commande/${id}/pdf`,
      { method: 'GET', headers: { Accept: 'application/pdf' } },
    );
    const finalName = filename || `bon-commande-${id}.pdf`;
    triggerBlobDownload(blob, finalName);
    return { filename: finalName };
  },
};

// ---------------- Tickets restaurant ----------------

export const ticketsApi = {
  list: async (q?: PageQuery) => {
    const { data } = await get<TicketDtoBE[]>('/api/treasurer/tickets');
    return paginate<TicketRestaurant>(data.map(mapTicket), q, ['numero', 'adherentNom', 'bonCommandeNumero']);
  },

  detail: async (id: string): Promise<TicketRestaurant> => {
    const { data } = await get<TicketDtoBE>(`/api/treasurer/tickets/${id}`);
    return mapTicket(data);
  },

  listByBon: async (bonCommandeId: string, q?: PageQuery) => {
    const { data } = await get<TicketDtoBE[]>(`/api/treasurer/tickets/by-bon/${bonCommandeId}`);
    return paginate<TicketRestaurant>(data.map(mapTicket), q, ['numero', 'adherentNom', 'adherentMatricule']);
  },

  assign: async (payload: TicketAssignPayload): Promise<TicketRestaurant[]> => {
    const body = {
      bonCommandeId: toLong(payload.bonCommandeId),
      adherentId: toLong(payload.adherentId),
      quantite: payload.quantite,
    };
    const { data } = await post<TicketDtoBE[]>('/api/treasurer/tickets/assign', body);
    return data.map(mapTicket);
  },

  create: async (data: Omit<TicketRestaurant, 'id'>): Promise<TicketRestaurant> => {
    const body = {
      numero: data.numero,
      typeBon: data.typeBon,
      montant: data.montant,
      statut: data.statut,
      adherentId: toLong(data.adherentId),
      dateEmission: data.dateEmission,
    };
    const { data: out } = await post<TicketDtoBE>('/api/treasurer/tickets', body);
    return mapTicket(out);
  },

  update: async (id: string, patch: Partial<TicketRestaurant>): Promise<TicketRestaurant> => {
    const body = {
      numero: patch.numero,
      typeBon: patch.typeBon,
      montant: patch.montant,
      statut: patch.statut,
      adherentId: toLong(patch.adherentId),
      dateEmission: patch.dateEmission,
    };
    const { data: out } = await put<TicketDtoBE>(`/api/treasurer/tickets/${id}`, body);
    return mapTicket(out);
  },

  remove: async (id: string): Promise<{ success: true }> => {
    await del(`/api/treasurer/tickets/${id}`);
    return { success: true as const };
  },
};

export const treasurerAdherentsApi = {
  list: async (q?: PageQuery) => {
    const { data } = await get<TreasurerAdherentDtoBE[]>('/api/treasurer/adherents');
    return paginate<Utilisateur>(data.map(mapAdherent), q, ['nom', 'prenom', 'email', 'matricule']);
  },
};
