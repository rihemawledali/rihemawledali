/* ============================================
   Users Admin API — Real backend (Spring Boot)
   ============================================ */

import type { PageQuery, PageResult, Utilisateur, UserRole, UserStatus } from '../../types/domain';
import { get, post, put, del } from '../../lib/apiClient';

/** Backend DTO returned by /api/admin/users */
interface BackendUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;       // admin | adherent | treasurer | manager
  statut: string;     // actif | inactif | suspendu (lowercase)
  matricule: string | null;
  createdAt: string | null;
}

/** Payload sent to backend on create / update */
export interface AdminUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  statut?: UserStatus;
  matricule?: string;
  password?: string;
}

function mapDtoToUtilisateur(dto: BackendUserDto): Utilisateur {
  return {
    id: dto.id,
    nom: dto.lastName,
    prenom: dto.firstName,
    email: dto.email,
    telephone: dto.phone ?? '',
    role: (dto.role as UserRole) ?? 'adherent',
    status: (dto.statut as UserStatus) ?? 'actif',
    matricule: dto.matricule ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

/** Client-side pagination/filter/sort over the list fetched from the API. */
function clientPaginate(rows: Utilisateur[], q: PageQuery = {}): PageResult<Utilisateur> {
  let result = [...rows];

  const search = q.search?.trim().toLowerCase();
  if (search) {
    result = result.filter((r) =>
      [r.nom, r.prenom, r.email, r.matricule]
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
    const key = q.sortBy as keyof Utilisateur;
    result.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
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

export const usersApi = {
  async list(q?: PageQuery): Promise<PageResult<Utilisateur>> {
    const { data } = await get<BackendUserDto[]>('/api/admin/users');
    const rows = data.map(mapDtoToUtilisateur);
    return clientPaginate(rows, q);
  },

  async create(data: AdminUserPayload): Promise<Utilisateur> {
    const { data: dto } = await post<BackendUserDto>('/api/admin/users', data);
    return mapDtoToUtilisateur(dto);
  },

  async update(id: string, patch: Partial<AdminUserPayload>): Promise<Utilisateur> {
    const { data: dto } = await put<BackendUserDto>(`/api/admin/users/${id}`, patch);
    return mapDtoToUtilisateur(dto);
  },

  async remove(id: string): Promise<{ success: true }> {
    await del<{ message: string }>(`/api/admin/users/${id}`);
    return { success: true };
  },

  async activate(id: string): Promise<Utilisateur> {
    const { data: dto } = await put<BackendUserDto>(`/api/admin/users/${id}/activate`, {});
    return mapDtoToUtilisateur(dto);
  },

  async deactivate(id: string): Promise<Utilisateur> {
    const { data: dto } = await put<BackendUserDto>(`/api/admin/users/${id}/deactivate`, {});
    return mapDtoToUtilisateur(dto);
  },
};
