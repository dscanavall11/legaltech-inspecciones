/**
 * Pruebas del expediente: módulo 1 del apoyo a la decisión del inspector.
 * legalcase asigna un identificador legible (P-01, P-02...) por cada pieza;
 * el archivo, si existe, vive en S3 (legaltech-tools) igual que documentos
 * - ver shared/pruebas/api.ts.
 */
export type EvidenceType =
  | 'documento_publico'
  | 'documento_privado'
  | 'fotografia'
  | 'video'
  | 'audio'
  | 'testimonio'
  | 'declaracion'
  | 'informe_policial'
  | 'informe_tecnico'
  | 'certificado'
  | 'argumentos_parte'
  | 'otro';

export const EVIDENCE_TYPE_LABEL: Record<EvidenceType, string> = {
  documento_publico: 'Documento público',
  documento_privado: 'Documento privado',
  fotografia: 'Fotografía',
  video: 'Video',
  audio: 'Audio',
  testimonio: 'Testimonio',
  declaracion: 'Declaración',
  informe_policial: 'Informe policial',
  informe_tecnico: 'Informe técnico',
  certificado: 'Certificado',
  argumentos_parte: 'Argumentos de parte en audiencia',
  otro: 'Otro',
};

export type EvidenceContributor = 'querellante' | 'querellado' | 'despacho_oficio' | 'policia' | 'testigo';

export const EVIDENCE_CONTRIBUTOR_LABEL: Record<EvidenceContributor, string> = {
  querellante: 'Querellante',
  querellado: 'Querellado',
  despacho_oficio: 'Despacho, de oficio',
  policia: 'Policía',
  testigo: 'Testigo',
};

export interface CaseEvidence {
  id: string;
  identifier: string;
  evidenceType: EvidenceType;
  description: string | null;
  date: string | null; // ISO date
  contributor: EvidenceContributor | null;
  purpose: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: string | null;
  storageKey: string | null;
  uploadedAt: string | null;
  hasFile: boolean;
}
