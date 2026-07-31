import type { VarianteFallo } from '@/derecho';

export interface RequisitoFallo {
  key: string;
  label: string;
  cumplido: boolean;
}

export interface EntradaRequisitosFallo {
  modalFallo: 'emitir_fallo' | 'fallo_por_inasistencia' | null;
  sentido: 'absuelve' | 'sanciona' | null;
  varianteFallo: VarianteFallo | '';
  cuentaRecaudo: string;
  titularCuenta: string;
  nitTitular: string;
  tieneFechaAudienciaAnterior: boolean;
}

const lleno = (v: string): boolean => v.trim().length > 0;

/**
 * Requisitos mínimos para habilitar el OK del modal de fallo
 * (fallo-comparendo.yaml): sentido/variante solo aplican a emitir_fallo;
 * datos de recaudo cuando el fallo sanciona (incluye fallo_por_inasistencia,
 * que siempre sanciona); fecha de la audiencia previa cuando la variante es
 * de continuación (o fallo_por_inasistencia, que siempre lo es).
 */
export function derivarRequisitosFallo(entrada: EntradaRequisitosFallo): RequisitoFallo[] {
  const falloEsSancion =
    entrada.modalFallo === 'fallo_por_inasistencia' ||
    (entrada.modalFallo === 'emitir_fallo' && entrada.sentido === 'sanciona');
  const falloEsContinuacion =
    entrada.varianteFallo === 'absuelve_continuacion' ||
    entrada.varianteFallo === 'sanciona_continuacion' ||
    entrada.varianteFallo === 'inasistencia';

  const requisitos: RequisitoFallo[] = [];

  if (entrada.modalFallo === 'emitir_fallo') {
    requisitos.push({
      key: 'sentido-variante',
      label: 'Sentido y variante de la decisión',
      cumplido: Boolean(entrada.sentido) && Boolean(entrada.varianteFallo),
    });
  }

  if (falloEsContinuacion) {
    requisitos.push({
      key: 'fecha-audiencia-anterior',
      label: 'Fecha de la audiencia previa',
      cumplido: entrada.tieneFechaAudienciaAnterior,
    });
  }

  if (falloEsSancion) {
    requisitos.push(
      { key: 'cuenta-recaudo', label: 'Cuenta de recaudo', cumplido: lleno(entrada.cuentaRecaudo) },
      { key: 'titular-cuenta', label: 'Titular de la cuenta', cumplido: lleno(entrada.titularCuenta) },
      { key: 'nit-titular', label: 'NIT del titular', cumplido: lleno(entrada.nitTitular) },
    );
  }

  return requisitos;
}

export function requisitosFalloCumplidos(requisitos: RequisitoFallo[]): boolean {
  return requisitos.every((r) => r.cumplido);
}
