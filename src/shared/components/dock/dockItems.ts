import { NORMA } from '@/shared/ai/identity';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type DockIconKey =
  | 'inicio'
  | 'quejas'
  | 'querellas'
  | 'apelaciones'
  | 'mis-procesos'
  | 'actas'
  | 'pronto-pago'
  | 'chat-ia'
  | 'asistente'
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
// Los trámites del comparendo (actas de firmeza, pronto pago y conmutación)
// vuelven al menú: es el flujo por lote más usado del despacho, es
// determinístico y no pasa por la IA. Enterrarlo en el subnav de Quejas fue
// una regresión — ese subnav se conserva igual (app/router.tsx), tener entrada
// propia no le quita el acceso contextual.
//
// Radicar sale del menú: la radicación pasa a ser parte de la conversación con
// el asistente. La ruta /panel/radicador sigue montada en el router y sigue
// enlazada desde las bandejas de Querellas y Quejas.
//
// Audiencias, Normas y Medidas correctivas quedan montadas en el router pero
// fuera del menú hasta la V2 (ver app/router.tsx).
//
// El color es una propiedad de la SECCION, no de cada item. Actas y multas es
// la unica excepcion en tratamiento: lleva el destacado (ver DockIcon.tsx) por
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
        key: 'actas',
        label: 'Actas y multas · cargue de PDF y base mensual',
        iconKey: 'actas',
        ruta: '/panel/actas-firmeza',
        color: VERDE,
        destacado: true,
      },
      {
        key: 'pronto-pago',
        label: 'Pronto pago y conmutación',
        iconKey: 'pronto-pago',
        ruta: '/panel/pronto-pago',
        color: VERDE,
      },
    ],
  },
  {
    titulo: 'Asistente',
    color: MORADO,
    items: [
      { key: 'chat-ia', label: `Asistente jurídico · ${NORMA.nombre}`, iconKey: 'chat-ia', ruta: '/panel/chat', color: MORADO },
      // Demo a evaluar: el asistente con skills jurídicas. No reemplaza al chat
      // todavía — los dos conviven mientras el dueño decide.
      { key: 'asistente', label: `${NORMA.nombre} con skills (demo)`, iconKey: 'asistente', ruta: '/panel/asistente', color: MORADO },
      { key: 'ajustes', label: 'Configuración', iconKey: 'configuracion', ruta: '/panel/ajustes', color: MORADO },
    ],
  },
];

/** Todas las rutas del dock (para cobertura de tests). */
export const DOCK_RUTAS: string[] = DOCK_SECTIONS.flatMap((s) => s.items.map((i) => i.ruta));

/** Flat list de items (para el rendering del dock). */
export const DOCK_ITEMS = DOCK_SECTIONS.flatMap((s) => s.items);
