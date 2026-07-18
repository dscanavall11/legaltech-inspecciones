export type LaunchpadIconKey = 'cola' | 'medidas-correctivas' | 'asistente-ia' | 'config-inspeccion';

export type LaunchpadAccion =
  | { tipo: 'ruta'; ruta: string }
  | { tipo: 'ai-assistant' }
  | { tipo: 'config-assistant' };

export interface LaunchpadItem {
  key: string;
  label: string;
  iconKey: LaunchpadIconKey;
  accion: LaunchpadAccion;
}

export const LAUNCHPAD_ITEMS: LaunchpadItem[] = [
  {
    key: 'cola',
    label: 'Cola de trabajo',
    iconKey: 'cola',
    accion: { tipo: 'ruta', ruta: '/panel/cola' },
  },
  {
    key: 'medidas-correctivas',
    label: 'Medidas correctivas',
    iconKey: 'medidas-correctivas',
    accion: { tipo: 'ruta', ruta: '/panel/medidas-correctivas' },
  },
  {
    key: 'asistente-ia',
    label: 'Asistente IA',
    iconKey: 'asistente-ia',
    accion: { tipo: 'ai-assistant' },
  },
  {
    key: 'config-inspeccion',
    label: 'Configurar inspección',
    iconKey: 'config-inspeccion',
    accion: { tipo: 'config-assistant' },
  },
];

export const LAUNCHPAD_RUTAS: string[] = LAUNCHPAD_ITEMS.filter(
  (item): item is LaunchpadItem & { accion: { tipo: 'ruta'; ruta: string } } =>
    item.accion.tipo === 'ruta',
).map((item) => item.accion.ruta);
