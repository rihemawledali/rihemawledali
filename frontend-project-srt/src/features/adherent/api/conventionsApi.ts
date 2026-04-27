/* ============================================
   Conventions API — Adherent Portal
   ============================================ */

import { get, post } from '../../../lib/apiClient';
import type {
  Convention,
  ConventionDemande,
  ConventionAdherentStatus,
} from '../../../types/domain';
import {
  mockConventions,
  mockConventionDemandes,
  mockAdherent,
  delay,
} from './mockData';

const USE_MOCKS = true;

export interface CreateDemandeRequest {
  conventionId: string;
  commentaire?: string;
  documentNom?: string;
}

// ----- In-memory mock state -----
let conventionsState: Convention[] = mockConventions.map((c) => ({ ...c }));
let demandesState: ConventionDemande[] = mockConventionDemandes.map((d) => ({ ...d }));

// ----- Helpers (also exported for component use) -----

/**
 * Compute the convention status as seen by the current adherent, based on
 * the convention's own status, its dates and any pending/active demande.
 */
export function getAdherentConventionStatus(
  convention: Convention,
  demandes: ConventionDemande[],
  today: Date = new Date()
): ConventionAdherentStatus {
  const fin = new Date(convention.dateFin);
  if (fin < today || convention.statut === 'expiree') return 'expiree';
  if (convention.statut === 'suspendue' || convention.statut === 'en_negociation') {
    return 'non_disponible';
  }

  const myDemande = demandes.find((d) => d.conventionId === convention.id);
  if (myDemande) {
    if (myDemande.statut === 'validee') return 'active';
    if (myDemande.statut === 'en_attente') return 'deja_demandee';
    // refusee / annulee → can request again if convention still valid
  }
  return 'disponible';
}

// ----- API surface -----
export const conventionsApi = {
  /** All conventions visible to the adherent (active + expired + non disponibles). */
  async getConventions(): Promise<Convention[]> {
    if (USE_MOCKS) {
      return delay(conventionsState.map((c) => ({ ...c })), 350);
    }
    const { data } = await get<Convention[]>('/api/adherent/conventions');
    return data;
  },

  async getConvention(id: string): Promise<Convention | null> {
    if (USE_MOCKS) {
      const found = conventionsState.find((c) => c.id === id);
      return delay(found ? { ...found } : null, 250);
    }
    const { data } = await get<Convention>(`/api/adherent/conventions/${id}`);
    return data;
  },

  async getMyDemandes(): Promise<ConventionDemande[]> {
    if (USE_MOCKS) {
      const mine = demandesState.filter((d) => d.adherentId === mockAdherent.id);
      return delay(mine.map((d) => ({ ...d })), 300);
    }
    const { data } = await get<ConventionDemande[]>('/api/adherent/conventions/demandes');
    return data;
  },

  async createDemande(req: CreateDemandeRequest): Promise<ConventionDemande> {
    if (USE_MOCKS) {
      const conv = conventionsState.find((c) => c.id === req.conventionId);
      if (!conv) throw new Error('Convention introuvable');

      const finDate = new Date(conv.dateFin);
      if (finDate < new Date() || conv.statut === 'expiree') {
        throw new Error('Cette convention est expirée et ne peut plus faire l\u2019objet d\u2019une demande.');
      }
      if (conv.statut === 'suspendue' || conv.statut === 'en_negociation') {
        throw new Error('Cette convention n\u2019est pas disponible actuellement.');
      }
      const existing = demandesState.find(
        (d) => d.conventionId === req.conventionId
          && d.adherentId === mockAdherent.id
          && (d.statut === 'en_attente' || d.statut === 'validee')
      );
      if (existing) {
        throw new Error('Vous avez déjà une demande active pour cette convention.');
      }

      const newDemande: ConventionDemande = {
        id: `demc-${Date.now()}`,
        conventionId: req.conventionId,
        adherentId: mockAdherent.id,
        adherentNom: `${mockAdherent.prenom} ${mockAdherent.nom}`,
        dateDemande: new Date().toISOString().slice(0, 10),
        statut: 'en_attente',
        commentaire: req.commentaire,
        documentNom: req.documentNom,
        conventionSnapshot: {
          fournisseurNom: conv.fournisseurNom,
          type: conv.type,
          remise: conv.remise,
          dateDebut: conv.dateDebut,
          dateFin: conv.dateFin,
          avantage: conv.avantage,
        },
      };
      demandesState = [newDemande, ...demandesState];
      return delay({ ...newDemande }, 600);
    }
    const { data } = await post<ConventionDemande>('/api/adherent/conventions/demandes', req);
    return data;
  },

  async cancelDemande(demandeId: string): Promise<ConventionDemande> {
    if (USE_MOCKS) {
      const demande = demandesState.find((d) => d.id === demandeId);
      if (!demande) throw new Error('Demande introuvable');
      if (demande.statut !== 'en_attente') {
        throw new Error('Seules les demandes en attente peuvent être annulées.');
      }
      demandesState = demandesState.map((d) =>
        d.id === demandeId
          ? { ...d, statut: 'annulee', dateDecision: new Date().toISOString().slice(0, 10) }
          : d
      );
      const updated = demandesState.find((d) => d.id === demandeId)!;
      return delay({ ...updated }, 400);
    }
    const { data } = await post<ConventionDemande>(
      `/api/adherent/conventions/demandes/${demandeId}/cancel`, {}
    );
    return data;
  },
};
