import { parseCaseMetadata } from '@/shared/legalCases/types';

/**
 * Orientaciones del inspector: lo que el funcionario le pide al sistema que
 * analice, sus dudas jurídicas y el contexto que no está en las pruebas.
 *
 * Regla que da sentido a este módulo: una orientación NO es un hecho probado.
 * Alimenta el análisis, pero el motor probatorio y el proyecto de fallo tienen
 * que poder distinguirla del expediente. Por eso vive en su propio campo y no
 * mezclada con `background.allegedFacts`.
 *
 * Se guarda en `caseMetadata` (blob opaco para el backend, mismo mecanismo que
 * `documentosEditados` del editor de documentos): no necesita migración ni
 * conoce el caseType.
 */
export interface Orientaciones {
  texto: string;
  /** ISO datetime del último guardado. */
  actualizadoEn: string;
}

interface MetadataConOrientaciones {
  orientaciones?: Orientaciones;
}

export const ORIENTACIONES_VACIAS: Orientaciones = { texto: '', actualizadoEn: '' };

export function leerOrientaciones(caseMetadataRaw: string | null | undefined): Orientaciones {
  return (
    parseCaseMetadata<MetadataConOrientaciones>(caseMetadataRaw ?? null).orientaciones ??
    ORIENTACIONES_VACIAS
  );
}

// El bloque rotulado que ve el analizador NO se arma aquí: lo compone
// CaseContextService en el microservicio `legal`, leyendo este mismo campo del
// caseMetadata. Así el chat y el analizador reciben la misma advertencia sin
// que el frontend tenga que acordarse de mandarla.
