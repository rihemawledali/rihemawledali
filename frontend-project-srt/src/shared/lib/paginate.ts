/* ============================================
   Client-side pagination / search / sort helper
   --------------------------------------------------
   Used by API modules that fetch a full backend list and want to apply
   page-level filters locally (keeps backend endpoints simple).
   ============================================ */

import type { PageQuery, PageResult } from '../types/domain';

interface HasId { id: string }

export function paginate<T extends HasId>(
  rows: T[],
  query: PageQuery = {},
  searchFields: (keyof T)[] = [],
): Promise<PageResult<T>> {
  let result = [...rows];

  const search = query.search?.trim().toLowerCase();
  if (search && searchFields.length) {
    result = result.filter((row) =>
      searchFields.some((f) => String(row[f] ?? '').toLowerCase().includes(search)),
    );
  }

  if (query.filters) {
    for (const [k, v] of Object.entries(query.filters)) {
      if (!v) continue;
      result = result.filter((row) => String((row as Record<string, unknown>)[k] ?? '') === v);
    }
  }

  if (query.sortBy) {
    const dir = query.sortDir === 'desc' ? -1 : 1;
    const key = query.sortBy as keyof T;
    result.sort((a, b) => {
      const av = a[key]; const bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  const total = result.length;
  const page = query.page ?? 1;
  const size = query.size ?? 10;
  const items = result.slice((page - 1) * size, page * size);

  return Promise.resolve({ items, total, page, size });
}
