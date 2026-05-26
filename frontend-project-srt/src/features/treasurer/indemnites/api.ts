import { get, put } from '../../../shared/api/apiClient';
import { paginate } from '../../../shared/lib/paginate';
import type {
  Indemnite,
  IndemniteStatus,
  IndemniteType,
  PageQuery,
  PaiementMode,
} from '../../../shared/types/domain';
import { paiementsApi } from '../paiements/api';

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
}

function mapIndemnite(indemnite: IndemniteDtoBE): Indemnite {
  return {
    id: indemnite.id,
    adherentId: indemnite.adherentId,
    adherentNom: indemnite.adherentNom,
    type: indemnite.type,
    montant: indemnite.montant,
    statut: indemnite.statut,
    dateDemande: indemnite.dateDemande,
    motif: indemnite.motif ?? undefined,
    documentNom: indemnite.documentNom ?? undefined,
    documentSize: indemnite.documentSize ?? undefined,
  };
}

export const treasurerIndemnitesApi = {
  async list(q?: PageQuery) {
    const { data } = await get<IndemniteDtoBE[]>('/api/treasurer/indemnites');
    return paginate<Indemnite>(data.map(mapIndemnite), q, ['adherentNom', 'type', 'statut', 'motif']);
  },

  async getById(id: string): Promise<Indemnite | undefined> {
    try {
      const { data } = await get<IndemniteDtoBE>(`/api/treasurer/indemnites/${id}`);
      return mapIndemnite(data);
    } catch {
      return undefined;
    }
  },

  async valider(id: string): Promise<Indemnite> {
    const { data } = await put<IndemniteDtoBE>(`/api/treasurer/indemnites/${id}/valider`, {});
    return mapIndemnite(data);
  },

  async rejeter(id: string, motif?: string): Promise<Indemnite> {
    const { data } = await put<IndemniteDtoBE>(
      `/api/treasurer/indemnites/${id}/rejeter`,
      motif ? { motif } : {},
    );
    return mapIndemnite(data);
  },

  async annuler(id: string): Promise<Indemnite> {
    const { data } = await put<IndemniteDtoBE>(`/api/treasurer/indemnites/${id}/annuler`, {});
    return mapIndemnite(data);
  },

  payer(
    id: string,
    payload: { montant: number; mode: PaiementMode; compteBancaireId: string; description?: string; reference?: string },
  ) {
    return paiementsApi.payIndemnite(id, payload);
  },
};
