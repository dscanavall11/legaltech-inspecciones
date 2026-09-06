import type { EstadoQuerella } from '@/features/querellas/types';
import type { EstadoQueja } from '@/features/quejas/types';
import type { EstadoComparendo } from './flujoComparendo';

/**
 * Etapas de cada trámite, en el orden en que ocurren. Alimentan el riel de
 * progreso procesal de los expedientes (componente EtapaProcesal).
 *
 * - Querella (proceso verbal abreviado, art. 223 Ley 1801 de 2016):
 *   Radicación → Audiencia pública → Decisión → Firmeza → Archivo
 * - Queja (mediación / conciliación, arts. 231 a 233):
 *   Radicación → Conciliación → Resultado → Archivo
 * - Comparendo (arts. 180, 222, 223 y 223A):
 *   Recepción → Objeción → Audiencia → Decisión → Firmeza → Archivo
 */
export const ETAPAS_QUERELLA = [
  'Radicación',
  'Audiencia',
  'Decisión',
  'Firmeza',
  'Archivo',
] as const;

export const ETAPA_QUERELLA_ACTIVA: Record<EstadoQuerella, number> = {
  radicada: 0,
  en_tramite: 0,
  audiencia_programada: 1,
  fallo_emitido: 2,
  apelado: 2,
  confirmado: 3,
  revocado: 3,
  en_firmeza: 3,
  archivada: 4,
};

/** Los 9 EstadoQuerella, en el mismo orden declarativo de ETAPA_QUERELLA_ACTIVA — para el mapa navegable (Task 20). */
export const TODOS_LOS_ESTADOS_QUERELLA = Object.keys(ETAPA_QUERELLA_ACTIVA) as EstadoQuerella[];

export const ETAPAS_QUEJA = [
  'Radicación',
  'Conciliación',
  'Resultado',
  'Archivo',
] as const;

export const ETAPA_QUEJA_ACTIVA: Record<EstadoQueja, number> = {
  radicada: 0,
  en_tramite: 0,
  conciliacion_programada: 1,
  conciliada: 2,
  sin_acuerdo: 2,
  archivada: 3,
};

export const ETAPAS_COMPARENDO = [
  'Recepción',
  'Objeción',
  'Audiencia',
  'Decisión',
  'Firmeza',
  'Archivo',
] as const;

export const ETAPA_COMPARENDO_ACTIVA: Record<EstadoComparendo, number> = {
  recibido: 0,
  verificado: 0,
  en_espera_objecion: 1,
  objetado: 1,
  pronto_pago_acordado: 1,
  conmutacion_acordada: 1,
  sin_objecion: 1,
  audiencia_programada: 2,
  en_audiencia: 2,
  suspendida_pruebas: 2,
  suspendida_inasistencia: 2,
  fallo_emitido: 3,
  en_recurso: 3,
  en_firmeza: 4,
  incumplimiento_constatado: 4,
  terminado_inactividad: 5,
  archivado: 5,
};

/** Los 17 EstadoComparendo, en el mismo orden declarativo de ETAPA_COMPARENDO_ACTIVA — para el mapa navegable (Task 15/20). */
export const TODOS_LOS_ESTADOS_COMPARENDO = Object.keys(ETAPA_COMPARENDO_ACTIVA) as EstadoComparendo[];
