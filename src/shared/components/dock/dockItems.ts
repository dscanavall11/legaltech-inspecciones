export type DockIconKey = 'inicio' | 'querellas' | 'audiencias' | 'actas-firmeza' | 'radicar';

export interface DockItem {
  key: string;
  label: string;
  iconKey: DockIconKey;
  ruta: string;
  destacado?: boolean;
}

// Set reducido a lo esencial — el resto (quejas, normas, cola, medidas
// correctivas, config) vive en el Launchpad. Iconos monocromos, sin tiles de
// color; solo "Radicar" lleva el acento (círculo oscuro).
export const DOCK_ITEMS: DockItem[] = [
  { key: 'inicio', label: 'Inicio', iconKey: 'inicio', ruta: '/panel' },
  { key: 'querellas', label: 'Querellas', iconKey: 'querellas', ruta: '/panel/querellas' },
  { key: 'audiencias', label: 'Audiencias', iconKey: 'audiencias', ruta: '/panel/audiencias' },
  {
    key: 'actas-firmeza',
    label: 'Actas de firmeza',
    iconKey: 'actas-firmeza',
    ruta: '/panel/actas-firmeza',
  },
  {
    key: 'radicador',
    label: 'Radicar',
    iconKey: 'radicar',
    ruta: '/panel/radicador',
    destacado: true,
  },
];

export const DOCK_RUTAS: string[] = DOCK_ITEMS.map((item) => item.ruta);
