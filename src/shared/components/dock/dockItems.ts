import { NORMA } from '@/shared/ai/identity';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type DockIconKey =
  | 'inicio'
  | 'quejas'
  | 'querellas'
  | 'apelaciones'
  | 'mis-procesos'
  | 'radicar'
  | 'chat-ia'
  | 'configuracion';

export interface DockItem {
  key: string;
  label: string;
  iconKey: DockIconKey;
  ruta: string;
  color: string;
  destacado?: boolean;
}

export interface DockSection {
  titulo: string;
  color: string;
  items: DockItem[];
}

// ─── Nav sections ───────────────────────────────────────────────────────────
// Siete entradas, ni una más. Los trámites del comparendo (actas de firmeza,
// pronto pago, conmutación) no son entradas del menú: son actuaciones DENTRO
// de una queja, y se alcanzan desde el subnav de esa sección. Audiencias,
// Normas y Medidas correctivas quedan montadas en el router pero fuera del
// menú hasta la V2 (ver app/router.tsx).
//
// El color es una propiedad de la SECCION, no de cada item. Radicar es la
// unica excepcion: lleva tratamiento de CTA destacado (ver DockIcon.tsx) por
// ser la accion mas usada del despacho.

const AZUL = '#2b4c7e'; // Casos — azul tinta, nav primaria
const VERDE = '#137333'; // Gestión — acciones operativas
const MORADO = '#5f4b8b'; // Asistente — violeta de sello, identidad de Legal

export const DOCK_SECTIONS: DockSection[] = [
  {
    titulo: 'Casos',
    color: AZUL,
    items: [
      { key: 'inicio', label: 'Inicio', iconKey: 'inicio', ruta: '/panel', color: AZUL },
      { key: 'quejas', label: 'Quejas', iconKey: 'quejas', ruta: '/panel/quejas', color: AZUL },
      { key: 'querellas', label: 'Querellas', iconKey: 'querellas', ruta: '/panel/querellas', color: AZUL },
      { key: 'apelaciones', label: 'Apelaciones', iconKey: 'apelaciones', ruta: '/panel/apelaciones', color: AZUL },
      { key: 'procesos', label: 'Mis procesos', iconKey: 'mis-procesos', ruta: '/panel/procesos', color: AZUL },
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
    ],
  },
  {
    titulo: 'Asistente',
    color: MORADO,
    items: [
      { key: 'chat-ia', label: `Asistente jurídico · ${NORMA.nombre}`, iconKey: 'chat-ia', ruta: '/panel/chat', color: MORADO },
      { key: 'ajustes', label: 'Configuración', iconKey: 'configuracion', ruta: '/panel/ajustes', color: MORADO },
    ],
  },
];

/** Todas las rutas del dock (para cobertura de tests). */
export const DOCK_RUTAS: string[] = DOCK_SECTIONS.flatMap((s) => s.items.map((i) => i.ruta));

/** Flat list de items (para el rendering del dock). */
export const DOCK_ITEMS = DOCK_SECTIONS.flatMap((s) => s.items);
