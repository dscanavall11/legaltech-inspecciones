export interface ItemCola {
  id: string;
  tipo: 'querella' | 'queja' | 'acta_firmeza' | 'apelacion' | 'fallo';
  radicado: string;
  titulo: string;
  /** currentStateCode real del caso - cada tipo define sus propios valores en el bundle OKF. */
  estado: string;
  fecha: string;
}

export const TIPOS_COLA_LABEL: Record<ItemCola['tipo'], string> = {
  querella: 'Querella',
  queja: 'Queja',
  acta_firmeza: 'Acta de firmeza',
  apelacion: 'Apelación',
  fallo: 'Fallo (2.ª inst.)',
};

export const ESTADO_GENERAL_LABEL: Record<string, string> = {
  radicada: 'Radicada',
  en_tramite: 'En trámite',
  audiencia_programada: 'Audiencia programada',
  conciliacion_programada: 'Conciliación programada',
  conciliada: 'Conciliada',
  sin_acuerdo: 'Sin acuerdo',
  fallo_emitido: 'Fallo emitido',
  en_firmeza: 'En firmeza',
  fallada: 'Fallada',
  apelado: 'Apelado',
  apelada: 'Apelada',
  archivada: 'Archivada',
  pendiente: 'Pendiente',
  generada: 'Generada',
  revisada: 'Revisada',
  expedida: 'Expedida',
};

export const ESTADO_GENERAL_COLOR: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'default'> = {
  radicada: 'blue',
  en_tramite: 'green',
  audiencia_programada: 'orange',
  conciliacion_programada: 'orange',
  conciliada: 'green',
  sin_acuerdo: 'red',
  fallo_emitido: 'purple',
  en_firmeza: 'purple',
  fallada: 'red',
  apelado: 'orange',
  apelada: 'orange',
  archivada: 'default',
  pendiente: 'blue',
  generada: 'green',
  revisada: 'orange',
  expedida: 'purple',
};