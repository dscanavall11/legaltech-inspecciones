/**
 * Escala de texto, forma y espacio. Una sola fuente para lo que antes eran 379
 * `fontSize` literales repartidos en 24 valores distintos (12, 12.5, 13, 13.5,
 * 15.5…) y 14 radios distintos: dos etiquetas del mismo rango se veían
 * distintas según el archivo en que estuvieran.
 *
 * El texto NO va en números sino en variables CSS, y a propósito: el control
 * A / A+ / A++ existe para inspectores con presbicia, y un `fontSize: 15.5`
 * escrito a mano se lo salta. Al derivarse todo del tamaño base, agrandar la
 * interfaz agranda también las etiquetas y los pies de norma.
 *
 * Uso: `style={{ fontSize: TEXTO.menor }}`.
 */
export const TEXTO = {
  /** Pie de norma, unidades, leyendas de autoguardado. */
  nota: 'var(--txt-nota)',
  /** Etiqueta de campo y texto de ayuda. */
  menor: 'var(--txt-menor)',
  /** Cuerpo y contenido de controles. */
  base: 'var(--txt-base)',
  /** Título de una ficha o de un bloque dentro de un paso. */
  titulo: 'var(--txt-titulo)',
  /** Título de un paso del recorrido. */
  seccion: 'var(--txt-seccion)',
  /** Título de la página. */
  pagina: 'var(--txt-pagina)',
} as const;

/**
 * Tres radios, no catorce. Cada uno corresponde a un nivel de anidamiento:
 * el control dentro del bloque, el bloque dentro de la tarjeta.
 */
export const RADIO = {
  control: 8,
  bloque: 12,
  tarjeta: 14,
} as const;

/** Rejilla de 4. `md` es la separación por defecto entre campos de un bloque. */
export const ESPACIO = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

/** Relleno interior por nivel, en la misma rejilla. */
export const RELLENO = {
  bloque: `${ESPACIO.md}px ${ESPACIO.lg}px`,
  tarjeta: `${ESPACIO.lg}px ${ESPACIO.lg}px`,
} as const;

/**
 * Los pasos del texto respecto al tamaño base configurado. Deltas y no
 * factores: un factor sobre 17 (A++) dispara los títulos a 26 px y la página
 * deja de caber; el inspector pidió leer mejor, no ver menos.
 */
const PASOS = {
  nota: -2,
  menor: -1,
  base: 0,
  titulo: 1,
  seccion: 3,
  pagina: 7,
} as const;

/** Las variables que consume TEXTO, derivadas del tamaño base de antd. */
export function variablesDeEscala(base: number): Record<string, string> {
  return Object.fromEntries(
    Object.entries(PASOS).map(([nombre, paso]) => [`--txt-${nombre}`, `${base + paso}px`]),
  );
}
