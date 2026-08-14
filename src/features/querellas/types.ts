// Estos valores son el flujo real definido en el bundle OKF de convivencia y
// policía (maquinas-estado.yaml) para caseType="querella" - el backend nunca
// valida contra este enum, solo guarda el string que legalcase recibe.
export type EstadoQuerella =
  | 'radicada'
  | 'en_tramite'
  | 'audiencia_programada'
  | 'fallo_emitido'
  | 'apelado'
  | 'confirmado'
  | 'revocado'
  | 'en_firmeza'
  | 'archivada';

// Fuente única de etiquetas/colores de estado: shared/procesos/types.ts
// (antes eran mapas propios de esta feature, hoy solo re-exportados para no
// romper los imports existentes — ver hallazgo Important 6 del fix-round-1).
export { ESTADO_LABEL, ESTADO_COLOR } from '@/shared/procesos/types';

export interface Querella {
  id: string;
  radicado: string; // número de radicado del caso
  querellante: string;
  querellado: string;
  asunto: string;
  estado: EstadoQuerella;
  fechaRadicacion: string; // ISO date
  diasTermino: number; // días hábiles del término aplicable
}

export type TipoActuacion =
  | 'radicacion'
  | 'auto'
  | 'audiencia'
  | 'fallo'
  | 'notificacion'
  | 'firmeza';

export interface Actuacion {
  id: string;
  fecha: string; // ISO date
  tipo: TipoActuacion;
  titulo: string;
  descripcion?: string;
  /** Código de estado al que corresponde esta actuación (para revisitar/retroceder). */
  estadoCodigo?: string;
}

/** Detalle completo del expediente: la querella + su historial de actuaciones. */
export interface QuerellaDetalle extends Querella {
  direccionInmueble?: string;
  actuaciones: Actuacion[];
  /** Blob crudo de metadata (para fusionar antes de escribir cambios, ver SiguientePaso). Ausente en datos mock. */
  caseMetadataRaw?: string | null;
}

/** Forma de caseMetadata para caseType="querella" - opaco para el backend. */
export interface QuerellaMetadata {
  asunto: string;
  direccionInmueble?: string;
  diasTermino: number;
}
