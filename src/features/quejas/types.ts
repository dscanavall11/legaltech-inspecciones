export type EstadoQueja =
  | 'radicada'
  | 'en_tramite'
  | 'conciliacion_programada'
  | 'conciliada'
  | 'sin_acuerdo'
  | 'archivada';

// Fuente única de etiquetas/colores de estado: shared/procesos/types.ts
// (antes eran mapas propios de esta feature, hoy solo re-exportados para no
// romper los imports existentes — ver hallazgo Important 6 del fix-round-1).
export {
  ESTADO_LABEL as ESTADO_QUEJA_LABEL,
  ESTADO_COLOR as ESTADO_QUEJA_COLOR,
} from '@/shared/procesos/types';

export type CategoriaQueja =
  | 'ruido'
  | 'mascotas'
  | 'basuras'
  | 'construccion'
  | 'espacio_publico'
  | 'vecindad'
  | 'otro';

export const CATEGORIA_QUEJA_LABEL: Record<CategoriaQueja, string> = {
  ruido: 'Ruido / contaminación auditiva',
  mascotas: 'Tenencia de mascotas',
  basuras: 'Manejo de basuras',
  construccion: 'Construcción u obra',
  espacio_publico: 'Espacio público',
  vecindad: 'Conflicto de vecindad',
  otro: 'Otro comportamiento',
};

export type TipoActuacionQueja =
  | 'radicacion'
  | 'avoca'
  | 'citacion'
  | 'conciliacion'
  | 'acuerdo'
  | 'sin_acuerdo'
  | 'archivo';

export interface ActuacionQueja {
  id: string;
  fecha: string;
  tipo: TipoActuacionQueja;
  titulo: string;
  descripcion?: string;
}

export interface Queja {
  id: string;
  radicado: string;
  quejoso: string;
  acusado: string;
  asunto: string;
  categoria: CategoriaQueja;
  estado: EstadoQueja;
  fechaRadicacion: string;
  diasTermino: number;
}

export interface QuejaDetalle extends Queja {
  descripcionHechos: string;
  actuaciones: ActuacionQueja[];
  /** Blob crudo de metadata (para fusionar antes de escribir cambios). Ausente en datos mock. */
  caseMetadataRaw?: string | null;
}

/** Forma de caseMetadata para caseType="queja" - opaco para el backend. */
export interface QuejaMetadata {
  asunto: string;
  categoria: CategoriaQueja;
  diasTermino: number;
}
