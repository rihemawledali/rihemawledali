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

export { ApiError, API_BASE_URL };
