/**
 * Forma genérica de un documento jurídico presentado "por acápites"
 * (identificación, hechos, consideraciones, resuelve...) — el formato de
 * navegación/edición que estrenó querellas/documento (fallo, acta, citación,
 * constancia) y que Task 18 promueve a artefacto compartido para que
 * cualquier trámite futuro (comparendo, queja, y los que vengan) lo
 * reutilice sin reinventar la vista de documento.
 */
export interface Acapite {
  id: string;
  titulo: string;
  /** Resumen de una línea para el sidebar. */
  resumen: string;
  /** Párrafos del cuerpo del documento. */
  parrafos: string[];
  /** Origen del contenido: plantilla fija o generado por IA. */
  fuente: 'ia' | 'plantilla';
}

export interface DocumentoGenerado {
  titulo: string;
  inspeccion: string;
  acapites: Acapite[];
}
