import type { PartesQuerella } from './partes';
import {
  buscarPorCasilla,
  etiquetasPropuestas,
  fusionarParte,
  sinUbicar,
  texto,
  type ParteExtraida,
  type Vocabulario,
} from '@/shared/partes/rolesExtraidos';

export type { ParteExtraida };

/**
 * El rol libre que devuelve el analizador, traducido al vocabulario de la
 * querella. Esta correspondencia es negocio de inspecciones y por eso vive
 * aquí, en la feature, y no en el contrato del servicio ni en el módulo
 * compartido que hace el emparejamiento.
 */
const VOCABULARIO: Vocabulario<'querellante' | 'querellado'> = {
  querellante: ['querellant', 'demandant', 'accionant', 'quejos', 'denunciant', 'plaintiff'],
  querellado: [
    'querellad',
    'infractor',
    'demandad',
    'accionad',
    'denunciad',
    'investigad',
    'defendant',
  ],
};

/** Partes que el analizador leyó pero cuyo rol no cae en ninguna casilla. */
export const partesSinUbicar = (extraidas: readonly ParteExtraida[] | undefined): string[] =>
  sinUbicar(extraidas, VOCABULARIO);

/**
 * Vuelca lo extraído sobre la ficha **sin pisar lo que el inspector ya
 * escribió**: lo que él puso manda sobre lo que leyó la máquina. Solo rellena
 * huecos.
 */
export function fusionarExtraidas(
  actuales: PartesQuerella,
  extraidas: readonly ParteExtraida[] | undefined,
): PartesQuerella {
  if (!extraidas || extraidas.length === 0) return actuales;

  const querellante = buscarPorCasilla(extraidas, VOCABULARIO, 'querellante');
  const querellado = buscarPorCasilla(extraidas, VOCABULARIO, 'querellado');

  return {
    ...actuales,
    querellante: fusionarParte(actuales.querellante, querellante),
    querellado: fusionarParte(actuales.querellado, querellado),
    calidadQuerellante:
      actuales.calidadQuerellante.trim().length > 0
        ? actuales.calidadQuerellante
        : texto(querellante?.capacity),
  };
}

/** Qué campos vienen de la máquina y el inspector todavía no ha confirmado. */
export function camposPorVerificar(extraidas: readonly ParteExtraida[] | undefined): string[] {
  if (!extraidas || extraidas.length === 0) return [];
  const querellante = buscarPorCasilla(extraidas, VOCABULARIO, 'querellante');
  const querellado = buscarPorCasilla(extraidas, VOCABULARIO, 'querellado');

  return etiquetasPropuestas([
    [querellante?.fullName, 'nombre del querellante'],
    [querellante?.identificationNumber, 'identificación del querellante'],
    [querellante?.address, 'dirección del querellante'],
    [querellante?.capacity, 'calidad en que actúa'],
    [querellado?.fullName, 'nombre del querellado'],
    [querellado?.identificationNumber, 'identificación del querellado'],
    [querellado?.address, 'dirección del querellado'],
  ]);
}
