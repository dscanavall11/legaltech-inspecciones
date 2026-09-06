/**
 * Núcleo normativo de la plataforma — Código Nacional de Seguridad y
 * Convivencia Ciudadana (Ley 1801 de 2016).
 *
 * Este módulo es la única fuente de verdad para referencias legales,
 * términos procesales y vías de trámite. La interfaz y los mocks consumen
 * estas constantes; ninguna pantalla debe volver a escribir un artículo o
 * un término "a mano".
 *
 * ⚠️ Las reglas definitivas las valida el equipo jurídico y las aplica el
 * backend; aquí se modela la guía de la interfaz.
 */

export const CNSCC = {
  nombre: 'Código Nacional de Seguridad y Convivencia Ciudadana',
  ley: 'Ley 1801 de 2016',
} as const;

export const DESPACHO = {
  nombre: 'Inspección de Convivencia y Paz',
  titular: 'Inspector de Convivencia y Paz',
  plural: 'Inspecciones de Convivencia y Paz',
} as const;

/** Artículos citados por la interfaz. */
export const ARTICULOS = {
  /** Proceso verbal abreviado: trámite de la querella ante el inspector. */
  procesoVerbalAbreviado: 'art. 223, Ley 1801 de 2016',
  /** Decisión en ausencia del querellado que no comparece. */
  decisionEnAusencia: 'art. 223, parágrafo 1, Ley 1801 de 2016',
  /** Mediación y conciliación como mecanismos de la queja. */
  conciliacion: 'arts. 231 a 233, Ley 1801 de 2016',
  /** Registro Nacional de Medidas Correctivas. */
  rnmc: 'art. 184, Ley 1801 de 2016',
} as const;

/** Términos procesales de referencia, en días hábiles. */
export const TERMINOS = {
  /** Término de referencia para resolver la querella (proceso verbal abreviado). */
  querellaDias: 15,
  /** Término de referencia para agotar la etapa de conciliación de la queja. */
  quejaDias: 10,
} as const;

/** Vías procesales por las que puede tramitarse una solicitud. */
export type ViaProcesal = 'verbal_abreviado' | 'verbal';

export const VIA_PROCESAL_LABEL: Record<ViaProcesal, string> = {
  verbal_abreviado: 'Proceso verbal abreviado',
  verbal: 'Proceso verbal',
};

/** Tipos de solicitud que recibe el despacho. */
export type TipoSolicitud = 'querella' | 'queja';

export const TIPO_SOLICITUD_LABEL: Record<TipoSolicitud, string> = {
  querella: 'Querella',
  queja: 'Queja',
};
