import { create } from 'zustand';

/**
 * Roles del despacho. Definir desde el día 1 evita reescrituras dolorosas
 * cuando se conecte la autenticación real con el backend.
 */
export type Rol = 'inspector' | 'secretario' | 'admin';

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  despacho: string; // multi-despacho: cada usuario pertenece a una inspección
}

interface AuthState {
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
}

// Usuario simulado mientras no exista login real. Reemplazar al integrar el backend.
const USUARIO_DEMO: Usuario = {
  id: 'u-001',
  nombre: 'Inspector de prueba',
  rol: 'inspector',
  despacho: 'Inspección 1A Distrital',
};

export const useAuth = create<AuthState>((set) => ({
  usuario: USUARIO_DEMO,
  setUsuario: (usuario) => set({ usuario }),
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
