export type DockIconKey =
  | 'inicio'
  | 'querellas'
  | 'quejas'
  | 'audiencias'
  | 'actas-firmeza'
  | 'normas'
  | 'radicar';

export type DockTileColor = 'azul' | 'verde' | 'amarillo' | 'rojo';

export interface DockItem {
  key: string;
  label: string;
  iconKey: DockIconKey;
  ruta: string;
  destacado?: boolean;
  color: DockTileColor;
}

export const DOCK_ITEMS: DockItem[] = [
  { key: 'inicio', label: 'Inicio', iconKey: 'inicio', ruta: '/panel', color: 'azul' },
  { key: 'querellas', label: 'Querellas', iconKey: 'querellas', ruta: '/panel/querellas', color: 'verde' },
  { key: 'quejas', label: 'Quejas', iconKey: 'quejas', ruta: '/panel/quejas', color: 'amarillo' },
  { key: 'audiencias', label: 'Audiencias', iconKey: 'audiencias', ruta: '/panel/audiencias', color: 'rojo' },
  {
    key: 'actas-firmeza',
    label: 'Actas de firmeza',
    iconKey: 'actas-firmeza',
    ruta: '/panel/actas-firmeza',
    color: 'azul',
  },
  { key: 'normas', label: 'Normas nacionales', iconKey: 'normas', ruta: '/panel/normas', color: 'verde' },
  {
    key: 'radicador',
    label: 'Radicar',
    iconKey: 'radicar',
    ruta: '/panel/radicador',
    destacado: true,
    color: 'azul',
  },
];

export const DOCK_RUTAS: string[] = DOCK_ITEMS.map((item) => item.ruta);
