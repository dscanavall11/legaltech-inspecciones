import dayjs from 'dayjs';
import type { Conversacion } from './useConversaciones';

export type GrupoConversacion = 'Hoy' | 'Ayer' | 'Anteriores';

export const GRUPOS_CONVERSACION: readonly GrupoConversacion[] = ['Hoy', 'Ayer', 'Anteriores'];

export function grupoDe(fecha: string): GrupoConversacion {
  const d = dayjs(fecha);
  if (d.isSame(dayjs(), 'day')) return 'Hoy';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Ayer';
  return 'Anteriores';
}

/** Agrupado por fecha del historial lateral, compartido por el chat y el asistente. */
export function agrupar(conversaciones: Conversacion[]): Record<GrupoConversacion, Conversacion[]> {
  const grupos: Record<GrupoConversacion, Conversacion[]> = { Hoy: [], Ayer: [], Anteriores: [] };
  for (const c of conversaciones) grupos[grupoDe(c.actualizadoEn)].push(c);
  return grupos;
}
