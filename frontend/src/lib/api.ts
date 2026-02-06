/**
 * API client with JWT authentication, base URL, and 401 handling.
 * All requests include Authorization: Bearer <token> when token is present.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

type OnUnauthorized = () => void;
let onUnauthorized: OnUnauthorized | null = null;

export function setOnUnauthorized(handler: OnUnauthorized): void {
  onUnauthorized = handler;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; ok: boolean; status: number }> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(typeof options.headers === 'object' && !(options.headers instanceof Headers)
      ? (options.headers as Record<string, string>)
      : {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers } as HeadersInit,
    credentials: 'include',
  });
  if (res.status === 401 && onUnauthorized) {
    onUnauthorized();
  }
  let data: T;
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      data = (await res.json()) as T;
    } catch {
      data = {} as T;
    }
  } else {
    data = (await res.text()) as unknown as T;
  }
  return { data, ok: res.ok, status: res.status };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const { data, ok, status } = await request<ApiResponse<T>>(path, { method: 'GET' });
  if (!ok && status !== 401) {
    throw new Error((data as ApiResponse<unknown>)?.message || `Request failed: ${status}`);
  }
  return data as ApiResponse<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data, ok, status } = await request<ApiResponse<T>>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!ok && status !== 401) {
    throw new Error((data as ApiResponse<unknown>)?.message || `Request failed: ${status}`);
  }
  return data as ApiResponse<T>;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data, ok, status } = await request<ApiResponse<T>>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!ok && status !== 401) {
    throw new Error((data as ApiResponse<unknown>)?.message || `Request failed: ${status}`);
  }
  return data as ApiResponse<T>;
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  const { data, ok, status } = await request<ApiResponse<T>>(path, { method: 'DELETE' });
  if (!ok && status !== 401) {
    throw new Error((data as ApiResponse<unknown>)?.message || `Request failed: ${status}`);
  }
  return data as ApiResponse<T>;
}

/** FormData for file uploads - do not set Content-Type; fetch will set multipart boundary */
export async function apiPostForm<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });
  if (res.status === 401 && onUnauthorized) {
    onUnauthorized();
  }
  const data = (await res.json()) as ApiResponse<T>;
  if (!res.ok && res.status !== 401) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }
  return data;
}
