import { NORMA } from '@/shared/ai/identity';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type DockIconKey =
  | 'inicio'
  | 'querellas'
  | 'quejas'
  | 'firmeza'
  | 'conmutacion'
  | 'pronto-pago'
  | 'apelaciones'
  | 'chat-ia'
  | 'asistente'
  | 'configuracion';

export interface DockItem {
  key: string;
  label: string;
  /** Segunda línea: para qué sirve la entrada, en palabras del despacho. */
  ayuda?: string;
  iconKey: DockIconKey;
  ruta: string;
  color: string;
  destacado?: boolean;
}

export interface DockSection {
  /** Vacío = grupo sin encabezado (Inicio). */
  titulo: string;
  color: string;
  items: DockItem[];
}

// ─── Nav sections ───────────────────────────────────────────────────────────
// El riel se lee sin adivinar: cada entrada lleva su nombre visible y una
// segunda línea que dice para qué sirve, porque quien lo usa es un inspector,
// no un usuario de software. Nada de íconos sueltos ni menús escondidos.
//
// El orden es el del trámite tal como lo dictó el despacho: primero los
// procesos que se instruyen (querella, queja), después las tres salidas del
// comparendo (firmeza, conmutación, pronto pago) y al final la segunda
// instancia.
//
// "Queja" es el expediente del comparendo impugnado: así lo numera el despacho
// (las actas imprimen "QUEJA {proceso}" en el encabezado) y es donde se tramita
// el proceso verbal abreviado de los comparendos objetados dentro de los tres
// días hábiles siguientes a la notificación.
//
// Mis procesos NO está aquí: es el archivo del despacho, no un trámite, y vive
// arriba a la derecha (shared/components/TopBar.tsx).
//
// Audiencias, Normas y Medidas correctivas quedan montadas en el router pero
// fuera del menú hasta la V2 (ver app/router.tsx).
//
// El color es una propiedad de la SECCION, no de cada item.

const AZUL = '#2f5fb3'; // Procesos — azul tinta, nav primaria
const VERDE = '#188038'; // Comparendo — las tres salidas operativas
const NARANJA = '#e8710a'; // Segunda instancia
const MORADO = '#7a56c9'; // Asistente — violeta de sello

export const DOCK_SECTIONS: DockSection[] = [
  {
    titulo: '',
    color: AZUL,
    items: [{ key: 'inicio', label: 'Inicio', iconKey: 'inicio', ruta: '/panel', color: AZUL }],
  },
  {
    titulo: 'Procesos',
    color: AZUL,
    items: [
      {
        key: 'querellas',
        label: 'Querellas',
        ayuda: 'Proceso verbal abreviado',
        iconKey: 'querellas',
        ruta: '/panel/querellas',
        color: AZUL,
      },
      {
        key: 'quejas',
        label: 'Quejas',
        ayuda: 'Comparendo impugnado',
        iconKey: 'quejas',
        ruta: '/panel/quejas',
        color: AZUL,
      },
    ],
  },
  {
    titulo: 'Decisión del comparendo',
    color: VERDE,
    items: [
      {
        key: 'firmeza',
        label: 'Firmeza',
        ayuda: 'El ciudadano no impugnó',
        iconKey: 'firmeza',
        ruta: '/panel/actas-firmeza',
        color: VERDE,
        destacado: true,
      },
      {
        key: 'conmutacion',
        label: 'Conmutación',
        ayuda: 'Actividad pedagógica',
        iconKey: 'conmutacion',
        ruta: '/panel/conmutacion',
        color: VERDE,
      },
      {
        key: 'pronto-pago',
        label: 'Pronto pago',
        ayuda: 'Descuento del 50%',
        iconKey: 'pronto-pago',
        ruta: '/panel/pronto-pago',
        color: VERDE,
      },
    ],
  },
  {
    titulo: 'Segunda instancia',
    color: NARANJA,
    items: [
      {
        key: 'apelaciones',
        label: 'Apelaciones',
        ayuda: 'Medida por comparendo',
        iconKey: 'apelaciones',
        ruta: '/panel/apelaciones',
        color: NARANJA,
      },
    ],
  },
  {
    titulo: 'Asistente',
    color: MORADO,
    items: [
      {
        key: 'chat-ia',
        label: NORMA.nombre,
        ayuda: 'Consulta jurídica',
        iconKey: 'chat-ia',
        ruta: '/panel/chat',
        color: MORADO,
      },
      // Demo a evaluar: el asistente con skills jurídicas. No reemplaza al chat
      // todavía — los dos conviven mientras el dueño decide.
      {
        key: 'asistente',
        label: `${NORMA.nombre} con skills`,
        ayuda: 'Demo en evaluación',
        iconKey: 'asistente',
        ruta: '/panel/asistente',
        color: MORADO,
      },
      {
        key: 'ajustes',
        label: 'Configuración',
        ayuda: 'Membrete y plantillas',
        iconKey: 'configuracion',
        ruta: '/panel/ajustes',
        color: MORADO,
      },
    ],
  },
];

/** Todas las rutas del riel (para cobertura de tests). */
export const DOCK_RUTAS: string[] = DOCK_SECTIONS.flatMap((s) => s.items.map((i) => i.ruta));

/** Flat list de items (para el rendering del riel). */
export const DOCK_ITEMS = DOCK_SECTIONS.flatMap((s) => s.items);
