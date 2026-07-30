/**
 * Documentos del expediente digital. Cada caso acumula piezas procesales:
 * las aportadas al radicar y las incorporadas después por el despacho.
 * legalcase solo guarda esta ficha (correlación); los bytes viven en S3
 * (legaltech-tools) - ver shared/documentos/api.ts.
 */
export type CaseDocumentType = 'PDF' | 'WORD' | 'IMAGEN' | 'AUDIO' | 'OTRO';

export type CaseDocumentOrigin = 'RADICACION' | 'RECEPCION' | 'MANUAL';

export interface CaseDocument {
  id: string;
  fileName: string;
  fileType: CaseDocumentType;
  origin: CaseDocumentOrigin;
  date: string; // ISO date
  fileSize?: string | null;
  storageKey: string;
}

export const CASE_DOCUMENT_ORIGIN_LABEL: Record<CaseDocumentOrigin, string> = {
  RADICACION: 'Aportado al radicar',
  RECEPCION: 'Aportado al radicar',
  MANUAL: 'Incorporado al expediente',
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
