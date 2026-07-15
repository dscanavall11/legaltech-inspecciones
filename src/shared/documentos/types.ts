/**
 * Documentos del expediente digital. Cada caso (querella o queja) acumula
 * las piezas procesales: las aportadas en la radicación, las generadas en
 * cada actuación y las incorporadas después por el despacho.
 */
export type TipoDocumento = 'pdf' | 'imagen' | 'texto' | 'otro';

export type OrigenDocumento = 'radicacion' | 'actuacion' | 'incorporado';

export interface DocumentoCaso {
  id: string;
  nombre: string;
  tipo: TipoDocumento;
  origen: OrigenDocumento;
  fecha: string; // ISO date
  tamano?: string;
}

export const ORIGEN_DOCUMENTO_LABEL: Record<OrigenDocumento, string> = {
  radicacion: 'Aportado en la radicación',
  actuacion: 'Generado en actuación',
  incorporado: 'Incorporado al expediente',
};

/** Deduce el tipo de documento a partir de la extensión del archivo. */
export function tipoDesdeNombre(nombre: string): TipoDocumento {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'heic'].includes(ext)) return 'imagen';
  if (['txt', 'doc', 'docx', 'rtf', 'md'].includes(ext)) return 'texto';
  return 'otro';
}
