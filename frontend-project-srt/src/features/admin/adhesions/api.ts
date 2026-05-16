import { paginate } from '../../../shared/lib/paginate';
import { get, put } from '../../../shared/api/apiClient';
import type { Adhesion, AdhesionStatus, PageQuery } from '../../../shared/types/domain';

export interface AdhesionRow extends Adhesion {
  adherentNom: string;
  adherentEmail?: string;
  adherentTelephone?: string;
  adherentMatricule?: string;
  adherentStatut?: string;
  createdAt?: string;
}

interface AdhesionDtoBE {
  id: string;
  adherentId: string;
  adherentNom: string;
  adherentEmail?: string;
  adherentTelephone?: string;
  adherentMatricule?: string;
  adherentStatut?: string;
  dateDebut: string;
  dateFin: string;
  montantCotisation: number;
  statut: AdhesionStatus | string;
  createdAt?: string;
}

function mapAdhesion(adhesion: AdhesionDtoBE): AdhesionRow {
  return {
    id: adhesion.id,
    adherentId: adhesion.adherentId,
    adherentNom: adhesion.adherentNom,
    adherentEmail: adhesion.adherentEmail,
    adherentTelephone: adhesion.adherentTelephone,
    adherentMatricule: adhesion.adherentMatricule,
    adherentStatut: adhesion.adherentStatut,
    dateDebut: adhesion.dateDebut,
    dateFin: adhesion.dateFin,
    montantCotisation: adhesion.montantCotisation,
    statut: adhesion.statut as AdhesionStatus,
    createdAt: adhesion.createdAt,
  };
}

export const adminAdhesionsApi = {
  list: async (query?: PageQuery) => {
    const { data } = await get<AdhesionDtoBE[]>('/api/admin/adhesions');
    return paginate<AdhesionRow>(data.map(mapAdhesion), query, ['adherentNom', 'statut']);
  },

  getById: async (id: string): Promise<AdhesionRow | undefined> => {
    try {
      const { data } = await get<AdhesionDtoBE>(`/api/admin/adhesions/${id}`);
      return mapAdhesion(data);
    } catch {
      return undefined;
    }
  },

  valider: async (id: string): Promise<AdhesionRow> => {
    const { data } = await put<AdhesionDtoBE>(`/api/admin/adhesions/${id}/valider`, {});
    return mapAdhesion(data);
  },

  rejeter: async (id: string, motif?: string): Promise<AdhesionRow> => {
    const { data } = await put<AdhesionDtoBE>(
      `/api/admin/adhesions/${id}/rejeter`,
      motif ? { motif } : {},
    );
    return mapAdhesion(data);
  },
};
