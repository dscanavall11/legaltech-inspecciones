import { limpiarSesion, tokenActual } from '@/shared/auth/auth';
import { useWorkspaceContextStore } from '@/store/workspaceContextStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Los endpoints públicos de auth no llevan Authorization (mismo criterio
// que el interceptor del frontend Angular anterior).
const AUTH_ENDPOINT_RE = /\/public\/auth\/(login|register)/;

/**
 * Wrapper de fetch con base URL, JSON, Bearer token y manejo de errores
 * uniforme. Con FormData no fija Content-Type: el navegador pone el
 * multipart boundary correcto.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenActual();
  if (token && !AUTH_ENDPOINT_RE.test(path)) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Resuelto una vez al arrancar (ver src/main.tsx); ausente hasta entonces
  // o si el subdominio no matchea ningun workspace.
  const contextId = useWorkspaceContextStore.getState().context?.contextId;
  if (contextId) {
    headers.set('X-Workspace-Context', contextId);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !AUTH_ENDPOINT_RE.test(path)) {
    // Sesión vencida o inválida: limpiar y volver al login.
    limpiarSesion();
    window.location.assign('/login');
    throw new ApiError(401, 'Sesión expirada');
  }

  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    try {
      const body = await res.json();
      mensaje = body.message ?? mensaje;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new ApiError(res.status, mensaje);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
