import { create } from 'zustand';
import { DESPACHO } from '@/derecho';

/**
 * Roles del despacho. Definir desde el día 1 evita reescrituras dolorosas
 * cuando el backend empiece a devolver roles reales.
 */
export type Rol = 'inspector' | 'secretario' | 'admin';

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  despacho: string; // multi-despacho: cada usuario pertenece a una inspección
}

/**
 * Sesión persistida en sessionStorage bajo la clave 'authSession'.
 * Mismo contrato que usaba el frontend Angular, para no tocar el backend.
 */
export interface Sesion {
  status: string;
  message: string;
  username: string;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  fullName?: string;
}

const SESSION_KEY = 'authSession';

export function leerSesion(): Sesion | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const sesion = JSON.parse(raw) as Sesion;
    return sesion?.accessToken ? sesion : null;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: Sesion): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

export function limpiarSesion(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Token para el header Authorization; null si no hay sesión. */
export function tokenActual(): string | null {
  return leerSesion()?.accessToken ?? null;
}

/**
 * El backend solo devuelve username por ahora; rol y despacho quedan con
 * valores por defecto hasta que el servicio de autenticación los exponga.
 */
function usuarioDesdeSesion(sesion: Sesion | null): Usuario | null {
  if (!sesion) return null;
  return {
    id: sesion.username,
    nombre: sesion.fullName ?? sesion.username,
    rol: 'inspector',
    despacho: DESPACHO.nombre,
  };
}

interface AuthState {
  sesion: Sesion | null;
  usuario: Usuario | null;
  iniciarSesion: (s: Sesion) => void;
  cerrarSesion: () => void;
}

const sesionInicial = leerSesion();

export const useAuth = create<AuthState>((set) => ({
  sesion: sesionInicial,
  usuario: usuarioDesdeSesion(sesionInicial),
  iniciarSesion: (sesion) => {
    guardarSesion(sesion);
    set({ sesion, usuario: usuarioDesdeSesion(sesion) });
  },
  cerrarSesion: () => {
    limpiarSesion();
    set({ sesion: null, usuario: null });
  },
}));

/** Permisos derivados del rol. Centralizado para no esparcir condicionales. */
export function puede(rol: Rol | undefined, accion: string): boolean {
  if (!rol) return false;
  const matriz: Record<Rol, string[]> = {
    admin: ['*'],
    inspector: ['querella.ver', 'querella.fallar', 'audiencia.gestionar', 'acta.generar'],
    secretario: ['querella.ver', 'audiencia.gestionar', 'acta.generar'],
  };
  const permisos = matriz[rol];
  return permisos.includes('*') || permisos.includes(accion);
}
