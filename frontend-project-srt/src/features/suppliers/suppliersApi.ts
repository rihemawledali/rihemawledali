/* ============================================
   Suppliers (Fournisseurs) API — Real backend
   ============================================ */

import type { ConventionType, Fournisseur, PageQuery, PageResult } from '../../types/domain';
import { get, post, put, del } from '../../lib/apiClient';

interface BackendFournisseurDto {
  id: string;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  categorie: string;
  status: string;
  createdAt: string | null;
}

function fromDto(dto: BackendFournisseurDto): Fournisseur {
  return {
    id: dto.id,
    nom: dto.nom,
    adresse: dto.adresse ?? '',
    telephone: dto.telephone ?? '',
    email: dto.email ?? '',
    categorie: (dto.categorie as ConventionType) ?? 'commerce',
    status: (dto.status as 'actif' | 'inactif') ?? 'actif',
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

function clientPaginate(rows: Fournisseur[], q: PageQuery = {}): PageResult<Fournisseur> {
  let result = [...rows];
  const search = q.search?.trim().toLowerCase();
  if (search) {
    result = result.filter((r) =>
      [r.nom, r.email, r.telephone, r.adresse]
        .some((v) => String(v ?? '').toLowerCase().includes(search))
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
    const key = q.sortBy as keyof Fournisseur;
    result.sort((a, b) => {
      const av = a[key]; const bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }
  const total = result.length;
  const page = q.page ?? 1;
  const size = q.size ?? 10;
  const items = result.slice((page - 1) * size, page * size);
  return { items, total, page, size };
}

export const suppliersApi = {
  async list(q?: PageQuery): Promise<PageResult<Fournisseur>> {
    const { data } = await get<BackendFournisseurDto[]>('/api/fournisseurs');
    return clientPaginate(data.map(fromDto), q);
  },

  async create(data: Omit<Fournisseur, 'id' | 'createdAt'>): Promise<Fournisseur> {
    const { data: dto } = await post<BackendFournisseurDto>('/api/fournisseurs', data);
    return fromDto(dto);
  },

  async update(id: string, patch: Partial<Fournisseur>): Promise<Fournisseur> {
    const { data: dto } = await put<BackendFournisseurDto>(`/api/fournisseurs/${id}`, patch);
    return fromDto(dto);
  },

  async remove(id: string): Promise<{ success: true }> {
    await del<{ message: string }>(`/api/fournisseurs/${id}`);
    return { success: true };
  },
};
