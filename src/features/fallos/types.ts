/** Dominio: Fallos proferidos por el Inspector de Policía (Ley 1801/2016). */

export type EstadoFallo = 'fallo_emitido' | 'en_firmeza' | 'apelado' | 'archivada';

export interface Fallo {
  id: string;
  radicado: string;
  tipo: string; // caseType real (querella, queja...)
  fechaFallo: string; // ISO date
  querellante: string;
  querellado: string;
  comportamiento: string;
  /** Texto libre de la decisión (legalReasoning del caso) - no hay un enum de decisión estructurado todavía. */
  fundamentacion: string;
  /** Pruebas valoradas (evidenceAssessment del caso). */
  pruebas: string;
  estado: EstadoFallo;
}

export const ESTADO_FALLO_LABEL: Record<EstadoFallo, string> = {
  fallo_emitido: 'Emitido',
  en_firmeza: 'En firmeza',
  apelado: 'Apelado',
  archivada: 'Archivado',
};

export const ESTADO_FALLO_COLOR: Record<EstadoFallo, string> = {
  fallo_emitido: 'gold',
  en_firmeza: 'green',
  apelado: 'purple',
  archivada: 'default',
};
