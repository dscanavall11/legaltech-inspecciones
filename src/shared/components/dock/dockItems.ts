// ─── Tipos ──────────────────────────────────────────────────────────────────

export type DockIconKey =
  | 'inicio'
  | 'querellas'
  | 'quejas'
  | 'audiencias'
  | 'consulta-norma'
  | 'radicar'
  | 'cola'
  | 'actas-firmeza'
  | 'calendario'
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

const AZUL = '#1a73e8'; // Casos — nav primaria, como "Principal" en resguardo-saas
const VERDE = '#137333'; // Gestión — acciones operativas, como "Operación" en resguardo-saas
const MORADO = '#a142f4'; // Herramientas — consulta/referencia legal, como "Territorio" en resguardo-saas

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
      { key: 'cola', label: 'Cola', iconKey: 'cola', ruta: '/panel/cola', color: VERDE },
      { key: 'actas-firmeza', label: 'Actas de firmeza', iconKey: 'actas-firmeza', ruta: '/panel/actas-firmeza', color: VERDE },
      { key: 'calendario', label: 'Calendario', iconKey: 'calendario', ruta: '/panel/calendario', color: VERDE },
    ],
  },
  {
    titulo: 'Herramientas',
    color: MORADO,
    items: [
      { key: 'chat-ia', label: 'Chat IA LegalTech', iconKey: 'chat-ia', ruta: '#', color: MORADO, enConstruccion: true },
      { key: 'consulta-norma', label: 'Consulta Norma', iconKey: 'consulta-norma', ruta: '/panel/normas', color: MORADO },
    ],
  },
];

/** Todas las rutas del dock (para cobertura de tests). */
export const DOCK_RUTAS: string[] = DOCK_SECTIONS.flatMap((s) =>
  s.items.filter((i) => !i.enConstruccion).map((i) => i.ruta),
);

/** Flat list de items (para el rendering del dock). */
export const DOCK_ITEMS = DOCK_SECTIONS.flatMap((s) => s.items);
