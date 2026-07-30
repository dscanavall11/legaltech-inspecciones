import type { EstadoQuerella } from '@/features/querellas/types';
import type { EstadoQueja } from '@/features/quejas/types';

/**
 * Etapas de cada trámite, en el orden en que ocurren. Alimentan el riel de
 * progreso procesal de los expedientes (componente EtapaProcesal).
 *
 * - Querella (proceso verbal abreviado, art. 223 Ley 1801 de 2016):
 *   Radicación → Audiencia pública → Decisión → Firmeza → Archivo
 * - Queja (mediación / conciliación, arts. 231 a 233):
 *   Radicación → Conciliación → Resultado → Archivo
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
