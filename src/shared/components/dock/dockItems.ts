import { NORMA } from '@/shared/ai/identity';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type DockIconKey =
  | 'inicio'
  | 'querellas'
  | 'quejas'
  | 'audiencias'
  | 'radicar'
  | 'actas-firmeza'
  | 'chat-ia';

export interface DockItem {
  key: string;
  label: string;
  iconKey: DockIconKey;
  ruta: string;
  color: string;
  destacado?: boolean;
  enConstruccion?: boolean;
}

export interface DockSection {
  titulo: string;
  color: string;
  items: DockItem[];
}

// ─── Nav sections ───────────────────────────────────────────────────────────
// Fiel al patron real de resguardo-saas (Sidebar.tsx): el color es una
// propiedad de la SECCION, no de cada item individual (antes era "arcoiris"
// por item, sin relacion con el codigo real de resguardo-saas). Radicar es
// la unica excepcion pedida explicitamente: lleva tratamiento de CTA
// destacado (ver DockIcon.tsx), algo que resguardo-saas no tiene pero que
// aca se justifica por ser la accion mas usada del despacho.

const AZUL = '#2b4c7e'; // Casos — azul tinta, nav primaria
const VERDE = '#137333'; // Gestión — acciones operativas
const MORADO = '#5f4b8b'; // Asistente — violeta de sello, identidad de Legal

export const DOCK_SECTIONS: DockSection[] = [
  {
    titulo: 'Casos',
    color: AZUL,
    items: [
      { key: 'inicio', label: 'Inicio', iconKey: 'inicio', ruta: '/panel', color: AZUL },
      { key: 'querellas', label: 'Querellas', iconKey: 'querellas', ruta: '/panel/querellas', color: AZUL },
      { key: 'quejas', label: 'Quejas', iconKey: 'quejas', ruta: '/panel/quejas', color: AZUL },
      { key: 'audiencias', label: 'Audiencias', iconKey: 'audiencias', ruta: '/panel/audiencias', color: AZUL },
    ],
  },
  {
    titulo: 'Gestión',
    color: VERDE,
    items: [
      {
        key: 'radicador',
        label: 'Radicar',
        iconKey: 'radicar',
        ruta: '/panel/radicador',
        color: VERDE,
        destacado: true,
      },
      { key: 'actas-firmeza', label: 'Actas de firmeza', iconKey: 'actas-firmeza', ruta: '/panel/actas-firmeza', color: VERDE },
    ],
  },
  {
    titulo: 'Asistente',
    color: MORADO,
    items: [
      { key: 'chat-ia', label: NORMA.nombre, iconKey: 'chat-ia', ruta: '/panel/chat', color: MORADO },
    ],
  },
];

/** Todas las rutas del dock (para cobertura de tests). */
export const DOCK_RUTAS: string[] = DOCK_SECTIONS.flatMap((s) =>
  s.items.filter((i) => !i.enConstruccion).map((i) => i.ruta),
);

/** Flat list de items (para el rendering del dock). */
export const DOCK_ITEMS = DOCK_SECTIONS.flatMap((s) => s.items);
