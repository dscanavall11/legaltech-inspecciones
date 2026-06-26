/**
 * Medidas correctivas — Multas Generales (Art. 180, Ley 1801 de 2016).
 *
 * Los valores se expresan en Salarios Mínimos Diarios Legales Vigentes (SMDLV).
 * El SMDLV se deriva del salario mínimo mensual (SMMLV / 30) y cambia cada año,
 * por eso es configurable: el inspector/administrador confirma el valor vigente.
 *
 * ⚠️ Verificar el SMMLV vigente y la tipificación con el equipo legal.
 */
export type MultaTipo = 1 | 2 | 3 | 4;

/** SMDLV que corresponde a cada tipo de multa general (Art. 180). */
export const SMDLV_POR_TIPO: Record<MultaTipo, number> = {
  1: 4,
  2: 8,
  3: 16,
  4: 32,
};

/**
 * Salario mínimo mensual legal vigente de referencia. Debe actualizarse cada
 * año. Se usa como valor por defecto; la interfaz permite ajustarlo.
 */
export const SMMLV_REFERENCIA = 1_423_500; // referencia 2025 — confirmar el vigente

/** SMDLV = SMMLV / 30 (redondeado al peso). */
export function smdlv(smmlv: number = SMMLV_REFERENCIA): number {
  return Math.round(smmlv / 30);
}

/** Valor en pesos de una multa de cierto tipo, según el SMMLV indicado. */
export function valorMulta(
  tipo: MultaTipo,
  smmlv: number = SMMLV_REFERENCIA,
): number {
  return SMDLV_POR_TIPO[tipo] * smdlv(smmlv);
}

export const MULTA_LABEL: Record<MultaTipo, string> = {
  1: 'Multa General Tipo 1',
  2: 'Multa General Tipo 2',
  3: 'Multa General Tipo 3',
  4: 'Multa General Tipo 4',
};

/** Ejemplos orientativos de comportamientos por tipo (no exhaustivo). */
export const MULTA_EJEMPLOS: Record<MultaTipo, string> = {
  1: 'Comportamientos de menor afectación a la convivencia.',
  2: 'Irrespeto a las autoridades, consumo en lugares no permitidos.',
  3: 'Riñas, porte de armas no letales, perturbación de la tranquilidad.',
  4: 'Comportamientos de mayor gravedad para la convivencia.',
};

const FORMATO_PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatearPesos(valor: number): string {
  return FORMATO_PESOS.format(valor);
}
