import type { CausalIncremento } from '@/derecho';

export type EstadoActa = 'pendiente' | 'generada' | 'revisada' | 'expedida';

export const ESTADO_ACTA_LABEL: Record<EstadoActa, string> = {
  pendiente: 'Pendiente',
  generada: 'Generada',
  revisada: 'Revisada',
  expedida: 'Expedida',
};

export const ESTADO_ACTA_COLOR: Record<EstadoActa, 'blue' | 'green' | 'orange' | 'purple'> = {
  pendiente: 'blue',
  generada: 'green',
  revisada: 'orange',
  expedida: 'purple',
};

export interface ItemCola {
  id: string;
  tipo: 'querella' | 'queja' | 'acta_firmeza' | 'apelacion' | 'fallo';
  radicado: string;
  titulo: string;
  estado: string;
  estadoActa?: EstadoActa;
  fecha: string;
  responsable?: string;
  datosActa?: {
    comparendo: string;
    solicitado: string;
    cedula: string;
    liquidacion: {
      valorTotal: number;
      smdlvLetras: string;
      tipo: number;
      porcentajeIncremento: number;
    };
    causal?: CausalIncremento;
  };
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
  en_firmeza: 'En firmeza',
  fallada: 'Fallada',
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
  en_firmeza: 'purple',
  fallada: 'red',
  apelada: 'orange',
  archivada: 'default',
  pendiente: 'blue',
  generada: 'green',
  revisada: 'orange',
  expedida: 'purple',
};