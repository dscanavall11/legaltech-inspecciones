import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Configuración de la inspección (contexto del despacho/inspector).
 *
 * Persistencia fuerte mockeada: la 1ª vez se guarda aquí vía `persist`
 * (localStorage, clave `legaltech-inspeccion`). Luego se hidrata
 * automáticamente al iniciar sesión, de modo que el acta de firmeza
 * (y cualquier pantalla) tome municipio/inspector/inspección/membrete
 * de este store SIN re-consultar el backend en cada acta.
 *
 * Patrón copiado de `src/store/settingsStore.ts` (Zustand + persist).
 */
export interface ConfigInspeccion {
  municipio: string; // alcaldía
  inspectorNombre: string; // nombre del inspector
  inspeccion: string; // código/nombre de la inspección
  membreteDataUrl: string | null; // imagen del encabezado (PNG/JPG dataURL)
  configurado: boolean; // true tras el 1er guardado fuerte
}

interface InspeccionState {
  config: ConfigInspeccion;
  /** Hook para futura carga remota; `persist` ya hidrata al importar. */
  cargarDesdeStorage: () => void;
  /** Persistencia fuerte (1ra vez + updates). */
  guardarConfig: (c: Partial<ConfigInspeccion>) => void;
  limpiarConfig: () => void;
}

const VACIO: ConfigInspeccion = {
  municipio: '',
  inspectorNombre: '',
  inspeccion: '',
  membreteDataUrl: null,
  configurado: false,
};

export const useInspeccionStore = create<InspeccionState>()(
  persist(
    (set) => ({
      config: VACIO,
      cargarDesdeStorage: () => {
        /* persist ya hidrata al importar el módulo; este método queda
           como punto de extensión para una carga remota futura. */
      },
      guardarConfig: (c) =>
        set((s) => ({ config: { ...s.config, ...c, configurado: true } })),
      limpiarConfig: () => set({ config: VACIO }),
    }),
    { name: 'legaltech-inspeccion' },
  ),
);
