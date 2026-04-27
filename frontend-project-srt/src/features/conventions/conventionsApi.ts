/* ============================================
   Conventions API — Real backend
   ============================================ */

import type {
  Convention, ConventionStatus, ConventionType, PageQuery, PageResult,
} from '../../types/domain';
import { get, post, put, del } from '../../lib/apiClient';

interface BackendConventionDto {
  id: string;
  fournisseurId: string;
  fournisseurNom: string;
  type: string;
  dateDebut: string;   // yyyy-MM-dd
  dateFin: string;
  remise: number;
  statut: string;
  description: string | null;
}

interface BackendConventionRequest {
  fournisseurId?: string;
  type?: string;
  dateDebut?: string;
  dateFin?: string;
  remise?: number;
  statut?: string;
  description?: string;
}

function fromDto(dto: BackendConventionDto): Convention {
  return {
    id: dto.id,
    fournisseurId: dto.fournisseurId,
    fournisseurNom: dto.fournisseurNom,
    type: dto.type as ConventionType,
    dateDebut: dto.dateDebut,
    dateFin: dto.dateFin,
    remise: dto.remise,
    statut: dto.statut as ConventionStatus,
    description: dto.description ?? undefined,
  };
}

/** Strip a conversion-friendly request object out of a partial Convention. */
function toRequest(c: Partial<Convention>): BackendConventionRequest {
  const r: BackendConventionRequest = {};
  if (c.fournisseurId !== undefined) r.fournisseurId = c.fournisseurId;
  if (c.type !== undefined) r.type = c.type;
  if (c.dateDebut !== undefined) r.dateDebut = c.dateDebut.length >= 10 ? c.dateDebut.slice(0, 10) : c.dateDebut;
  if (c.dateFin !== undefined) r.dateFin = c.dateFin.length >= 10 ? c.dateFin.slice(0, 10) : c.dateFin;
  if (c.remise !== undefined) r.remise = c.remise;
  if (c.statut !== undefined) r.statut = c.statut;
  if (c.description !== undefined) r.description = c.description;
  return r;
}

function clientPaginate(rows: Convention[], q: PageQuery = {}): PageResult<Convention> {
  let result = [...rows];
  const search = q.search?.trim().toLowerCase();
  if (search) {
    result = result.filter((r) =>
      [r.fournisseurNom, r.description].some((v) => String(v ?? '').toLowerCase().includes(search))
    );
  }
  if (q.filters) {
    for (const [k, v] of Object.entries(q.filters)) {
      if (!v) continue;
      result = result.filter((r) => String((r as unknown as Record<string, unknown>)[k] ?? '') === v);
    }
  }
  if (q.sortBy) {
    const dir = q.sortDir === 'desc' ? -1 : 1;
    const key = q.sortBy as keyof Convention;
    result.sort((a, b) => {
      const av = a[key]; const bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }
  const total = result.length;
  const page = q.page ?? 1;
  const size = q.size ?? 10;
  const items = result.slice((page - 1) * size, page * size);
  return { items, total, page, size };
}

export const conventionsApi = {
  async list(q?: PageQuery): Promise<PageResult<Convention>> {
    const { data } = await get<BackendConventionDto[]>('/api/conventions');
    return clientPaginate(data.map(fromDto), q);
  },

  async create(data: Omit<Convention, 'id'>): Promise<Convention> {
    const { data: dto } = await post<BackendConventionDto>('/api/conventions', toRequest(data));
    return fromDto(dto);
  },

  async update(id: string, patch: Partial<Convention>): Promise<Convention> {
    const { data: dto } = await put<BackendConventionDto>(`/api/conventions/${id}`, toRequest(patch));
    return fromDto(dto);
  },

  async remove(id: string): Promise<{ success: true }> {
    await del<{ message: string }>(`/api/conventions/${id}`);
    return { success: true };
  },
};
