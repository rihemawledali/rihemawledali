/* ============================================
   Generic mock CRUD helpers with artificial latency
   ============================================ */

import type { PageQuery, PageResult } from '../types/domain';
import { uid } from './db';

const LATENCY = 280; // ms

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

interface HasId { id: string }

export function paginate<T extends HasId>(
  rows: T[],
  query: PageQuery = {},
  searchFields: (keyof T)[] = []
): Promise<PageResult<T>> {
  let result = [...rows];
  const search = query.search?.trim().toLowerCase();
  if (search && searchFields.length) {
    result = result.filter((row) =>
      searchFields.some((f) => String(row[f] ?? '').toLowerCase().includes(search))
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
  return delay({ items, total, page, size });
}

export function findById<T extends HasId>(rows: T[], id: string): Promise<T> {
  const found = rows.find((r) => r.id === id);
  if (!found) return Promise.reject(new Error('Not found'));
  return delay(found);
}

export function createRow<T extends HasId>(rows: T[], data: Omit<T, 'id'>, prefix = 'id'): Promise<T> {
  const row = { ...(data as object), id: uid(prefix) } as T;
  rows.unshift(row);
  return delay(row);
}

export function updateRow<T extends HasId>(rows: T[], id: string, patch: Partial<T>): Promise<T> {
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return Promise.reject(new Error('Not found'));
  rows[idx] = { ...rows[idx], ...patch } as T;
  return delay(rows[idx]);
}

export function removeRow<T extends HasId>(rows: T[], id: string): Promise<{ success: true }> {
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return Promise.reject(new Error('Not found'));
  rows.splice(idx, 1);
  return delay({ success: true as const });
}
