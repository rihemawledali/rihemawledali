/* ============================================
   API Client — Fetch wrapper with auth
   ============================================ */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getToken(): string | null {
  return localStorage.getItem('srt_token') || sessionStorage.getItem('srt_token');
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle non-JSON responses (like 401 with empty body)
  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : typeof data === 'string'
        ? data
        : `HTTP ${response.status}`;
    throw new ApiError(response.status, errorMessage, data);
  }

  return { data: data as T, status: response.status };
}

export async function get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(endpoint, { ...options, method: 'GET' });
}

export async function post<T>(
  endpoint: string,
  body: unknown,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function put<T>(
  endpoint: string,
  body: unknown,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function del<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Upload a file via multipart/form-data and return the created Attachment.
 * The backend exposes POST /api/files which accepts a single 'file' part
 * and responds with { id, fileName, contentType, size, uploadedAt }.
 */
export interface UploadedAttachment {
  id: string;
  fileName: string;
  contentType?: string;
  size: number;
  uploadedAt?: string;
}

export async function uploadFile(
  file: File,
  endpoint: string = '/api/files'
): Promise<UploadedAttachment> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const form = new FormData();
  form.append('file', file);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: form,
  });

  let data: unknown;
  const ct = response.headers.get('content-type');
  if (ct?.includes('application/json')) data = await response.json();
  else data = await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : typeof data === 'string'
        ? data
        : `HTTP ${response.status}`;
    throw new ApiError(response.status, errorMessage, data);
  }

  return data as UploadedAttachment;
}

/**
 * Perform an authenticated request that returns a file (CSV, PDF, …) and
 * expose the response body as a Blob plus a suggested filename parsed
 * from the `Content-Disposition` header.
 */
export async function downloadBlob(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ blob: Blob; filename: string }> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const ct = response.headers.get('content-type');
      if (ct?.includes('application/json')) {
        const data = await response.json();
        if (data && typeof data === 'object' && 'error' in data) {
          errorMessage = String((data as { error: unknown }).error);
        }
      } else {
        const text = await response.text();
        if (text) errorMessage = text;
      }
    } catch {
      /* keep default errorMessage */
    }
    throw new ApiError(response.status, errorMessage);
  }

  const blob = await response.blob();
  const filename = parseFilename(response.headers.get('content-disposition'))
    ?? endpoint.split('/').pop() ?? 'download';
  return { blob, filename };
}

function parseFilename(header: string | null): string | null {
  if (!header) return null;
  // Prefer RFC 5987 form (filename*=UTF-8'' …) when available.
  const starMatch = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (starMatch) {
    try { return decodeURIComponent(starMatch[1].trim().replace(/^"|"$/g, '')); }
    catch { /* fall through */ }
  }
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1].trim() : null;
}

/**
 * Trigger a browser download for an already-fetched Blob. Creates a
 * temporary `<a>` link, clicks it, then revokes the object URL.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export { ApiError, API_BASE_URL };
