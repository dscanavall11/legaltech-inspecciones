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

export const ESTADO_LABEL: Record<EstadoQuerella, string> = {
  radicada: 'Radicada',
  en_tramite: 'En trámite',
  audiencia_programada: 'Audiencia programada',
  fallo_emitido: 'Fallo emitido',
  apelado: 'Apelada — en alzada',
  confirmado: 'Confirmada en 2ª instancia',
  revocado: 'Revocada en 2ª instancia',
  en_firmeza: 'En firmeza',
  archivada: 'Archivada',
};

// Colores de Tag (AntD) por estado — compartido entre listado y detalle.
export const ESTADO_COLOR: Record<EstadoQuerella, string> = {
  radicada: 'blue',
  en_tramite: 'gold',
  audiencia_programada: 'purple',
  fallo_emitido: 'cyan',
  apelado: 'orange',
  confirmado: 'green',
  revocado: 'red',
  en_firmeza: 'green',
  archivada: 'default',
};

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
