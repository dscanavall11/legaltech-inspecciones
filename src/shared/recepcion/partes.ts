import type { ParteExtraida } from '@/shared/partes/rolesExtraidos';

/** Una parte tal como la nombra el agente de recepción (ver recepcionRules.st). */
export interface ParteRecepcion {
  rol?: string;
  tipoId?: string | null;
  numeroId?: string | null;
  nombre?: string;
}

/**
 * Traduce las partes del agente de recepción al mismo contrato que ya usa la
 * extracción del analizador.
 *
 * Es lo que permite que las dos fuentes —el agente de recepción, barato y
 * rápido, y el analizador del fallo, caro y lento— desemboquen en un único
 * emparejador de roles y una única fusión sobre la ficha. Sin esta traducción
 * habría dos vocabularios y dos merges que mantener en paralelo.
 */
export const aPartesExtraidas = (partes: readonly ParteRecepcion[] | undefined): ParteExtraida[] =>
  (partes ?? [])
    .filter((p) => (p.nombre ?? '').trim().length > 0)
    .map((p) => ({
      role: p.rol ?? '',
      fullName: p.nombre ?? '',
      identificationType: p.tipoId ?? '',
      identificationNumber: p.numeroId ?? '',
    }));
