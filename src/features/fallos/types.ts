/** Dominio: Fallos proferidos por el Inspector de Policía (Ley 1801/2016). */

export type DecisionFallo =
  | 'FAVORABLE'     // querellado declarado infractor
  | 'DESFAVORABLE'  // hechos no probados
  | 'CONCILIACION'  // acuerdo en audiencia
  | 'DESISTIMIENTO' // querellante desistió
  | 'CADUCIDAD'     // inactividad procesal
  | 'NULIDAD';      // proceso declarado nulo

export type EstadoFallo =
  | 'proferido'
  | 'notificado'
  | 'en_firmeza'
  | 'apelado'
  | 'confirmado'
  | 'revocado';

export interface MedidaCorrectiva {
  tipo: 'multa' | 'decomiso_temporal' | 'suspension' | 'restauracion' | 'trabajo_comunitario' | 'participacion_programa';
  descripcion: string;
  /** Valor en UPM para multas (1 UPM ≈ $37.512 en 2026). */
  valorUPM?: number;
}

export interface Fallo {
  id: string;
  radicado: string;
  tipo: 'querella' | 'proceso_verbal';
  fechaFallo: string;      // ISO date
  inspector: string;
  querellante: string;
  querellado: string;
  comportamiento: string;
  articuloInfringido: string;
  decision: DecisionFallo;
  fundamentacion: string;
  medidasCorrectivas: MedidaCorrectiva[];
  estado: EstadoFallo;
  fechaFirmeza?: string;
  apelacion?: {
    fechaApelacion: string;
    resultado?: 'confirmado' | 'revocado' | 'pendiente';
    fechaResolucion?: string;
  };
}

export const DECISION_LABEL: Record<DecisionFallo, string> = {
  FAVORABLE: 'Favorable',
  DESFAVORABLE: 'Desfavorable',
  CONCILIACION: 'Conciliación',
  DESISTIMIENTO: 'Desistimiento',
  CADUCIDAD: 'Caducidad',
  NULIDAD: 'Nulidad',
};

export const DECISION_COLOR: Record<DecisionFallo, string> = {
  FAVORABLE: 'green',
  DESFAVORABLE: 'red',
  CONCILIACION: 'blue',
  DESISTIMIENTO: 'default',
  CADUCIDAD: 'orange',
  NULIDAD: 'volcano',
};

export const ESTADO_FALLO_LABEL: Record<EstadoFallo, string> = {
  proferido: 'Proferido',
  notificado: 'Notificado',
  en_firmeza: 'En firmeza',
  apelado: 'Apelado',
  confirmado: 'Confirmado',
  revocado: 'Revocado',
};

export const ESTADO_FALLO_COLOR: Record<EstadoFallo, string> = {
  proferido: 'gold',
  notificado: 'blue',
  en_firmeza: 'green',
  apelado: 'purple',
  confirmado: 'cyan',
  revocado: 'volcano',
};
