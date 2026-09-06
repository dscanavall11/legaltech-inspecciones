/**
 * Documentos del expediente digital. Cada caso acumula piezas procesales:
 * las aportadas al radicar y las incorporadas después por el despacho.
 * legalcase solo guarda esta ficha (correlación); los bytes viven en S3
 * (legaltech-tools) - ver shared/documentos/api.ts.
 */
export type CaseDocumentType = 'PDF' | 'WORD' | 'IMAGEN' | 'AUDIO' | 'OTRO';

/**
 * origin real de legalcase (Querellas Fase 1): String libre en minúsculas
 * (catálogo-como-dato, no enum). null = no registrado.
 */
export type CaseDocumentOrigin = 'radicacion' | 'actuacion' | 'incorporado';

export interface CaseDocument {
  id: string;
  fileName: string;
  /** Derivado client-side de la extensión del archivo - no es el documentType jurídico de legalcase. */
  fileType: CaseDocumentType;
  origin: CaseDocumentOrigin | null;
  date: string | null; // ISO date
  fileSize?: string | null;
  storageKey: string | null;
}

export const CASE_DOCUMENT_ORIGIN_LABEL: Record<CaseDocumentOrigin, string> = {
  radicacion: 'Aportado al radicar',
  actuacion: 'Incorporado en una actuación',
  incorporado: 'Incorporado al expediente',
};

/** Deduce el tipo de documento a partir de la extensión del archivo (antes de subir). */
export function documentTypeFromFileName(fileName: string): CaseDocumentType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'PDF';
  if (['doc', 'docx', 'rtf'].includes(ext)) return 'WORD';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'heic'].includes(ext)) return 'IMAGEN';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'AUDIO';
  return 'OTRO';
}
