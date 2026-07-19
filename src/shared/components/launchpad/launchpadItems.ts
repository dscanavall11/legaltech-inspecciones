export type LaunchpadIconKey =
  | 'medidas-correctivas'
  | 'asistente-ia'
  | 'config-inspeccion';

export type LaunchpadArea = 'consultas' | 'sistema';

export type LaunchpadAccion =
  | { tipo: 'ruta'; ruta: string }
  | { tipo: 'ai-assistant' }
  | { tipo: 'config-assistant' };

export interface LaunchpadItem {
  key: string;
  label: string;
  iconKey: LaunchpadIconKey;
  area: LaunchpadArea;
  accion: LaunchpadAccion;
}

export const LAUNCHPAD_AREAS: { id: LaunchpadArea; label: string }[] = [
  { id: 'consultas', label: 'Consultas' },
  { id: 'sistema', label: 'Sistema' },
];

export const LAUNCHPAD_ITEMS: LaunchpadItem[] = [
  {
    key: 'medidas-correctivas',
    label: 'Medidas correctivas',
    iconKey: 'medidas-correctivas',
    area: 'consultas',
    accion: { tipo: 'ruta', ruta: '/panel/medidas-correctivas' },
  },
  {
    key: 'asistente-ia',
    label: 'Chat IA',
    iconKey: 'asistente-ia',
    area: 'consultas',
    accion: { tipo: 'ai-assistant' },
  },
  {
    key: 'config-inspeccion',
    label: 'Configurar inspección',
    iconKey: 'config-inspeccion',
    area: 'sistema',
    accion: { tipo: 'config-assistant' },
  },
];

export const LAUNCHPAD_RUTAS: string[] = LAUNCHPAD_ITEMS.filter(
  (item): item is LaunchpadItem & { accion: { tipo: 'ruta'; ruta: string } } =>
    item.accion.tipo === 'ruta',
).map((item) => item.accion.ruta);