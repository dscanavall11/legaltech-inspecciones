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
  items: DockItem[];
}

// ─── Nav sections — distribución inspirada en resguardo-saas ────────────────
// Cada sección lleva un color google Material distinto por item.

export const DOCK_SECTIONS: DockSection[] = [
  {
    titulo: 'Casos',
    items: [
      { key: 'inicio', label: 'Inicio', iconKey: 'inicio', ruta: '/panel', color: '#1a73e8' },
      { key: 'querellas', label: 'Querellas', iconKey: 'querellas', ruta: '/panel/querellas', color: '#1967d2' },
      { key: 'quejas', label: 'Quejas', iconKey: 'quejas', ruta: '/panel/quejas', color: '#a142f4' },
      { key: 'audiencias', label: 'Audiencias', iconKey: 'audiencias', ruta: '/panel/audiencias', color: '#0891b2' },
    ],
  },
  {
    titulo: 'Gestión',
    items: [
      {
        key: 'radicador',
        label: 'Radicar',
        iconKey: 'radicar',
        ruta: '/panel/radicador',
        color: '#137333',
        destacado: true,
      },
      { key: 'cola', label: 'Cola', iconKey: 'cola', ruta: '/panel/cola', color: '#fa7b17' },
      { key: 'actas-firmeza', label: 'Actas de firmeza', iconKey: 'actas-firmeza', ruta: '/panel/actas-firmeza', color: '#b06000' },
      { key: 'calendario', label: 'Calendario', iconKey: 'calendario', ruta: '/panel/calendario', color: '#0891b2' },
    ],
  },
  {
    titulo: 'Herramientas',
    items: [
      { key: 'chat-ia', label: 'Chat IA LegalTech', iconKey: 'chat-ia', ruta: '#', color: '#a142f4', enConstruccion: true },
      { key: 'consulta-norma', label: 'Consulta Norma', iconKey: 'consulta-norma', ruta: '/panel/normas', color: '#a142f4' },
    ],
  },
];

/** Todas las rutas del dock (para cobertura de tests). */
export const DOCK_RUTAS: string[] = DOCK_SECTIONS.flatMap((s) =>
  s.items.filter((i) => !i.enConstruccion).map((i) => i.ruta),
);

/** Flat list de items (para el dock icon rendering). */
export const DOCK_ITEMS = DOCK_SECTIONS.flatMap((s) => s.items);
