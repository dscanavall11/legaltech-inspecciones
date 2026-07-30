export type LaunchpadIconKey =
  | 'fallos-proferidos'
  | 'cola-trabajo'
  | 'consulta-normas'
  | 'medidas-correctivas'
  | 'config-inspeccion'
  | 'cerrar-sesion';

export type LaunchpadArea = 'modulos' | 'sistema';

export type LaunchpadAccion = { tipo: 'ruta'; ruta: string } | { tipo: 'logout' };

export interface LaunchpadItem {
  key: string;
  label: string;
  iconKey: LaunchpadIconKey;
  area: LaunchpadArea;
  accion: LaunchpadAccion;
}

export const LAUNCHPAD_AREAS: { id: LaunchpadArea; label: string }[] = [
  { id: 'modulos', label: 'Módulos' },
  { id: 'sistema', label: 'Sistema' },
];

// El dock lleva el flujo diario (incluido Legal, el único chat de IA); acá
// viven los módulos secundarios sin espacio en el dock y el sistema.
export const LAUNCHPAD_ITEMS: LaunchpadItem[] = [
  {
    key: 'fallos-proferidos',
    label: 'Fallos proferidos',
    iconKey: 'fallos-proferidos',
    area: 'modulos',
    accion: { tipo: 'ruta', ruta: '/panel/fallos' },
  },
  {
    key: 'cola-trabajo',
    label: 'Cola de trabajo',
    iconKey: 'cola-trabajo',
    area: 'modulos',
    accion: { tipo: 'ruta', ruta: '/panel/cola' },
  },
  {
    key: 'consulta-normas',
    label: 'Normas',
    iconKey: 'consulta-normas',
    area: 'modulos',
    accion: { tipo: 'ruta', ruta: '/panel/normas' },
  },
  {
    key: 'medidas-correctivas',
    label: 'Medidas correctivas',
    iconKey: 'medidas-correctivas',
    area: 'modulos',
    accion: { tipo: 'ruta', ruta: '/panel/medidas-correctivas' },
  },
  {
    key: 'config-inspeccion',
    label: 'Configurar',
    iconKey: 'config-inspeccion',
    area: 'sistema',
    accion: { tipo: 'ruta', ruta: '/panel/ajustes' },
  },
  {
    key: 'cerrar-sesion',
    label: 'Cerrar sesión',
    iconKey: 'cerrar-sesion',
    area: 'sistema',
    accion: { tipo: 'logout' },
  },
];

export const LAUNCHPAD_RUTAS: string[] = LAUNCHPAD_ITEMS.filter(
  (item): item is LaunchpadItem & { accion: { tipo: 'ruta'; ruta: string } } =>
    item.accion.tipo === 'ruta',
).map((item) => item.accion.ruta);
