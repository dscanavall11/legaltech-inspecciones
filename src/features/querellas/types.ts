import type { DocumentoCaso } from '@/shared/documentos/types';

export type EstadoQuerella =
  | 'radicada'
  | 'en_tramite'
  | 'audiencia_programada'
  | 'fallo_emitido'
  | 'en_firmeza'
  | 'archivada';

export const ESTADO_LABEL: Record<EstadoQuerella, string> = {
  radicada: 'Radicada',
  en_tramite: 'En trámite',
  audiencia_programada: 'Audiencia programada',
  fallo_emitido: 'Fallo emitido',
  en_firmeza: 'En firmeza',
  archivada: 'Archivada',
};

// Colores de Tag (AntD) por estado — compartido entre listado y detalle.
export const ESTADO_COLOR: Record<EstadoQuerella, string> = {
  radicada: 'blue',
  en_tramite: 'gold',
  audiencia_programada: 'purple',
  fallo_emitido: 'cyan',
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
}

/** Detalle completo del expediente: la querella + su historial de actuaciones. */
export interface QuerellaDetalle extends Querella {
  direccionInmueble?: string;
  actuaciones: Actuacion[];
  documentos: DocumentoCaso[];
}
