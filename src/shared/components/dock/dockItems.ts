export type DockIconKey =
  | 'inicio'
  | 'querellas'
  | 'quejas'
  | 'audiencias'
  | 'actas-firmeza'
  | 'normas'
  | 'radicar';

export interface DockItem {
  key: string;
  label: string;
  iconKey: DockIconKey;
  ruta: string;
  destacado?: boolean;
}

export const DOCK_ITEMS: DockItem[] = [
  { key: 'inicio', label: 'Inicio', iconKey: 'inicio', ruta: '/panel' },
  { key: 'querellas', label: 'Querellas', iconKey: 'querellas', ruta: '/panel/querellas' },
  { key: 'quejas', label: 'Quejas', iconKey: 'quejas', ruta: '/panel/quejas' },
  { key: 'audiencias', label: 'Audiencias', iconKey: 'audiencias', ruta: '/panel/audiencias' },
  {
    key: 'actas-firmeza',
    label: 'Actas de firmeza',
    iconKey: 'actas-firmeza',
    ruta: '/panel/actas-firmeza',
  },
  { key: 'normas', label: 'Normas nacionales', iconKey: 'normas', ruta: '/panel/normas' },
  {
    key: 'radicador',
    label: 'Radicar',
    iconKey: 'radicar',
    ruta: '/panel/radicador',
    destacado: true,
  },
];

export const DOCK_RUTAS: string[] = DOCK_ITEMS.map((item) => item.ruta);
