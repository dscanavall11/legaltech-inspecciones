import dayjs from 'dayjs';
import { parseCaseMetadata } from '@/shared/legalCases/types';

/**
 * Datos que el inspector determina, no la IA ni el expediente: el número con
 * que el despacho numera el fallo y la fecha en que lo profiere.
 *
 * Viven en `caseMetadata` (blob opaco, mismo mecanismo que `orientaciones`),
 * y son los que encabezan el documento. Antes el fallo salía numerado con el
 * radicado del caso y fechado con el día en que se abría la pantalla — dos
 * datos que el despacho no elige y que en un documento firmado no pueden ser
 * un accidente.
 */
export interface DatosFallo {
  /** Número del fallo asignado por el despacho. */
  numeroFallo: string;
  /** Fecha en que se profiere, ISO (YYYY-MM-DD). */
  fechaFallo: string;
}

interface MetadataConFallo {
  numeroFallo?: string;
  fechaFallo?: string;
}

export function leerDatosFallo(caseMetadataRaw: string | null | undefined): DatosFallo {
  const meta = parseCaseMetadata<MetadataConFallo>(caseMetadataRaw ?? null);
  return {
    numeroFallo: meta.numeroFallo ?? '',
    fechaFallo: meta.fechaFallo ?? dayjs().format('YYYY-MM-DD'),
  };
}

/** Sin número de fallo no se profiere: el documento quedaría sin identificar. */
export function falloIdentificado(datos: DatosFallo): boolean {
  return datos.numeroFallo.trim().length > 0 && datos.fechaFallo.trim().length > 0;
}
