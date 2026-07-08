export type EstadoQueja =
  | 'radicada'
  | 'en_tramite'
  | 'conciliacion_programada'
  | 'conciliada'
  | 'sin_acuerdo'
  | 'archivada';

export const ESTADO_QUEJA_LABEL: Record<EstadoQueja, string> = {
  radicada: 'Radicada',
  en_tramite: 'En trámite',
  conciliacion_programada: 'Conciliación programada',
  conciliada: 'Conciliada',
  sin_acuerdo: 'Sin acuerdo',
  archivada: 'Archivada',
};

export const ESTADO_QUEJA_COLOR: Record<EstadoQueja, string> = {
  radicada: 'blue',
  en_tramite: 'gold',
  conciliacion_programada: 'purple',
  conciliada: 'green',
  sin_acuerdo: 'volcano',
  archivada: 'default',
};

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
}
