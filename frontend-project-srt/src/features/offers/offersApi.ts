/* ============================================
   Offers API — backed by /api/treasurer/tickets + /bons-commande
   --------------------------------------------------
   Same contract as before: `list / create / update / remove`. Pagination
   is applied client-side on top of the full backend list via paginate().
   ============================================ */

import type {
  BonCommande, BonStatus, TicketRestaurant, TicketType, PageQuery,
} from '../../types/domain';
import { get, post, put, del } from '../../lib/apiClient';
import { paginate } from '../../lib/paginate';

// ---------------- Backend DTOs ----------------

interface BonCommandeDtoBE {
  id: string;
  numero: string;
  fournisseurId?: string | null;
  fournisseurNom?: string | null;
  adherentId?: string | null;
  adherentNom?: string | null;
  montant: number;
  statut: string;
  dateEmission?: string | null;
  dateExpiration?: string | null;
}

interface TicketDtoBE {
  id: string;
  numero: string;
  typeBon: string;
  montant: number;
  statut: string;
  adherentId?: string | null;
  adherentNom?: string | null;
  dateEmission?: string | null;
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
    montant: b.montant,
    statut: (b.statut as BonStatus) ?? 'en_attente',
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
    dateEmission: t.dateEmission ?? '',
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
    return paginate<BonCommande>(data.map(mapBon), q, ['numero', 'fournisseurNom', 'adherentNom']);
  },

  create: async (data: Omit<BonCommande, 'id'>): Promise<BonCommande> => {
    const body = {
      numero: data.numero,
      fournisseurId: toLong(data.fournisseurId),
      adherentId: toLong(data.adherentId),
      montant: data.montant,
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
      montant: patch.montant,
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
};

// ---------------- Tickets restaurant ----------------

export const ticketsApi = {
  list: async (q?: PageQuery) => {
    const { data } = await get<TicketDtoBE[]>('/api/treasurer/tickets');
    return paginate<TicketRestaurant>(data.map(mapTicket), q, ['numero', 'adherentNom']);
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
