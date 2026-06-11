/* ============================================
   Conventions API - Adherent Portal
   ============================================ */

import { get, post } from '../../../shared/api/apiClient';
import type {
  Convention,
  ConventionDemande,
  ConventionAdherentStatus,
} from '../../../shared/types/domain';

export interface CreateDemandeRequest {
  conventionId: string;
  commentaire?: string;
  /** Attachment id obtained from POST /api/files. */
  attachmentId?: number | string;
}

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
  if (['validee', 'APPROUVEE', 'EN_COURS', 'JUSTIFIEE', 'VALIDEE', 'FACTUREE', 'PAYEE'].includes(myDemande?.statut ?? '')) return 'active';
  if (['en_attente', 'SOUMISE'].includes(myDemande?.statut ?? '')) return 'deja_demandee';
  if (convention.adherentStatus) return convention.adherentStatus;
  return 'disponible';
}

export const conventionsApi = {
  async getConventions(): Promise<Convention[]> {
    const { data } = await get<Convention[]>('/api/adherent/conventions');
    return data;
  },

  async getConvention(id: string): Promise<Convention | null> {
    const { data } = await get<Convention>(`/api/adherent/conventions/${id}`);
    return data;
  },

  async getMyDemandes(): Promise<ConventionDemande[]> {
    const { data } = await get<ConventionDemande[]>('/api/adherent/conventions/demandes');
    return data;
  },

  async createDemande(req: CreateDemandeRequest): Promise<ConventionDemande> {
    const { data } = await post<ConventionDemande>('/api/adherent/conventions/demandes', req);
    return data;
  },

  async cancelDemande(demandeId: string): Promise<ConventionDemande> {
    const { data } = await post<ConventionDemande>(
      `/api/adherent/conventions/demandes/${demandeId}/cancel`, {}
    );
    return data;
  },
};
