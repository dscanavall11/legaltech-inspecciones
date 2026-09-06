import { pesosALetras } from './letras';
import { diasHabilesDesde } from './diasHabiles';

/**
 * Multas generales (art. 180, Ley 1801 de 2016) y régimen de firmeza de la
 * orden de comparendo (art. 223A, adicionado por el art. 47 de la Ley 2197
 * de 2022).
 *
 * Los valores por tipo replican la BD de comparendos del despacho de
 * Manizales (vigencia 2026): SMDLV $58.363,5 y equivalencias 2/4/8/16 SMDLV
 * para los tipos 1 a 4. ⚠️ El texto del art. 180 señala 4/8/16/32 SMDLV;
 * la equivalencia vigente debe confirmarla el equipo jurídico — por eso el
 * SMDLV y los multiplicadores viven aquí como única fuente y no en la UI.
 */
export type TipoMulta = 1 | 2 | 3 | 4;

export const VIGENCIA_MULTAS = 2026;

/** Salario mínimo diario legal vigente usado por la BD del despacho (2026). */
export const SMDLV_VIGENTE = 58_363.5;

export const MULTA_GENERAL: Record<TipoMulta, { smdlv: number; smdlvLetras: string }> = {
  1: { smdlv: 2, smdlvLetras: 'dos (02)' },
  2: { smdlv: 4, smdlvLetras: 'cuatro (04)' },
  3: { smdlv: 8, smdlvLetras: 'ocho (08)' },
  4: { smdlv: 16, smdlvLetras: 'dieciséis (16)' },
};

/** Términos del art. 223A y art. 180 par. (días hábiles). */
export const TERMINOS_COMPARENDO = {
  /** Lit. b): término para objetar la orden de comparendo. */
  objecionDias: 3,
  /** Lit. e): vencidos, sin objeción ni beneficios del art. 180, la multa queda en firme. */
  firmezaDias: 5,
  /** Art. 180 par.: término para acogerse al pronto pago (descuento del 50%). */
  prontoPagoDias: 5,
  /** Art. 180 par.: término para acogerse a la conmutación (solo tipos 1 y 2). */
  conmutacionDias: 5,
} as const;

/** Tipos de multa a los que aplica la conmutación (art. 180 par.). */
export const TIPOS_CONMUTACION_PERMITIDOS: readonly TipoMulta[] = [1, 2];

// Nota de alcance: el módulo expide únicamente el ACTA DE FIRMEZA. El pronto
// pago y la conmutación (art. 180) no generan acta alguna: solo explican el
// término de 5 días y se recitan en los considerandos, como en los modelos
// del despacho.

/** Causales de incremento del valor de la multa (art. 223A, lits. i y j). */
export type CausalIncremento =
  | 'ninguna'
  | 'reiteracion_dentro_del_anio' // lit. j: mismo comportamiento dentro del año siguiente a la firmeza → +75%
  | 'reiteracion_despues_del_anio' // lit. j: reiteración después de un año → +50%
  | 'moroso_bdme'; // lit. i: reportado en el Boletín de Deudores Morosos sin pagar multa anterior → +50%

export const INCREMENTO_LABEL: Record<CausalIncremento, string> = {
  ninguna: 'Sin incremento',
  reiteracion_dentro_del_anio: 'Reiteración dentro del año (+75%, lit. j)',
  reiteracion_despues_del_anio: 'Reiteración después del año (+50%, lit. j)',
  moroso_bdme: 'Moroso en el BDME (+50%, lit. i)',
};

export const INCREMENTO_PORCENTAJE: Record<CausalIncremento, number> = {
  ninguna: 0,
  reiteracion_dentro_del_anio: 75,
  reiteracion_despues_del_anio: 50,
  moroso_bdme: 50,
};

export interface LiquidacionMulta {
  tipo: TipoMulta;
  smdlv: number;
  smdlvLetras: string;
  valorBase: number;
  valorBaseLetras: string;
  causal: CausalIncremento;
  porcentajeIncremento: number;
  valorIncremento: number;
  valorTotal: number;
  valorTotalLetras: string;
}

/** Liquida la multa general: valor base por tipo + incremento por reincidencia. */
export function liquidarMulta(tipo: TipoMulta, causal: CausalIncremento = 'ninguna'): LiquidacionMulta {
  const { smdlv, smdlvLetras } = MULTA_GENERAL[tipo];
  const valorBase = Math.round(smdlv * SMDLV_VIGENTE);
  const porcentaje = INCREMENTO_PORCENTAJE[causal];
  const valorIncremento = Math.round((valorBase * porcentaje) / 100);
  const valorTotal = valorBase + valorIncremento;
  return {
    tipo,
    smdlv,
    smdlvLetras,
    valorBase,
    valorBaseLetras: pesosALetras(valorBase),
    causal,
    porcentajeIncremento: porcentaje,
    valorIncremento,
    valorTotal,
    valorTotalLetras: pesosALetras(valorTotal),
  };
}

export interface LiquidacionProntoPago extends LiquidacionMulta {
  /** Descuento del 50% (art. 180 par.), aplicado sobre el valor ya incrementado. */
  descuento: number;
  descuentoLetras: string;
  /** Total a pagar tras el descuento de pronto pago. */
  valorAPagar: number;
  valorAPagarLetras: string;
}

/** Liquida el valor a pagar con el descuento de pronto pago del 50% (art. 180 par.). */
export function liquidarProntoPago(tipo: TipoMulta, causal: CausalIncremento = 'ninguna'): LiquidacionProntoPago {
  const liquidacion = liquidarMulta(tipo, causal);
  const descuento = Math.round(liquidacion.valorTotal * 0.5);
  const valorAPagar = liquidacion.valorTotal - descuento;
  return {
    ...liquidacion,
    descuento,
    descuentoLetras: pesosALetras(descuento),
    valorAPagar,
    valorAPagarLetras: pesosALetras(valorAPagar),
  };
}

export type RutaComparendo = 'pronto_pago' | 'conmutacion' | 'objecion' | 'firmeza';

export interface RutasDisponibles {
  rutas: RutaComparendo[];
  /** Advertencia informativa: multas pendientes NO bloquean la ruta, el inspector decide. */
  advertencia?: string;
}

/**
 * Rutas disponibles para un comparendo según tipo, fecha del comparendo,
 * fecha actual y si el infractor tiene multas pendientes.
 *
 * Objeción vence a los 3 días hábiles; pronto pago y conmutación a los 5
 * (art. 180 par.; art. 223A). Conmutación solo aplica a tipos 1 y 2 (par.
 * art. 180). Multas pendientes se devuelven como advertencia, no bloqueo.
 */
export function rutasDisponibles(
  tipo: TipoMulta,
  fechaComparendo: Date,
  fechaActual: Date,
  tieneMultasPendientes: boolean,
): RutasDisponibles {
  const soloFecha = (f: Date) => new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
  const dentroDe = (dias: number) =>
    soloFecha(fechaActual) <= soloFecha(diasHabilesDesde(fechaComparendo, dias));

  const rutas: RutaComparendo[] = [];
  if (dentroDe(TERMINOS_COMPARENDO.objecionDias)) rutas.push('objecion');
  if (dentroDe(TERMINOS_COMPARENDO.prontoPagoDias)) rutas.push('pronto_pago');
  if (dentroDe(TERMINOS_COMPARENDO.conmutacionDias) && TIPOS_CONMUTACION_PERMITIDOS.includes(tipo)) {
    rutas.push('conmutacion');
  }
  if (!dentroDe(TERMINOS_COMPARENDO.firmezaDias)) rutas.push('firmeza');

  return {
    rutas,
    advertencia: tieneMultasPendientes
      ? 'El infractor registra multas pendientes: no bloquea la ruta, queda a criterio del inspector.'
      : undefined,
  };
}
