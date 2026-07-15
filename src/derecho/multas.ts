import { pesosALetras } from './letras';

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

/** Términos del art. 223A (días hábiles). */
export const TERMINOS_COMPARENDO = {
  /** Lit. b): término para objetar la orden de comparendo. */
  objecionDias: 3,
  /** Lit. e): vencidos, sin objeción ni beneficios del art. 180, la multa queda en firme. */
  firmezaDias: 5,
} as const;

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
