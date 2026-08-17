import { PARTE_VACIA, type PartesQuerella } from './partes';

/**
 * Una parte del proceso leída de los documentos. Espejo de
 * ComplaintResponse.ExtractedParty en el servicio legal, que es
 * deliberadamente genérico: `role` es texto libre porque ese servicio no sabe
 * de querellas.
 *
 * Un campo vacío significa "no consta en los documentos", no "no se sabe":
 * el prompt prohíbe deducir e inventar, porque este dato acaba identificando
 * a una persona dentro de una decisión firmada.
 */
export interface ParteExtraida {
  role?: string;
  fullName?: string;
  identificationType?: string;
  identificationNumber?: string;
  capacity?: string;
}

const texto = (v?: string) => (v ?? '').trim();

/**
 * Traduce el rol libre que devuelve el analizador al vocabulario de la
 * querella. Esta correspondencia es negocio de inspecciones y por eso vive
 * aquí, en la feature, y no en el contrato del servicio.
 *
 * Se aceptan varias grafías porque el rol viene del documento tal cual, y un
 * acta escribe "presunto infractor" donde otra escribe "querellado".
 */
const ROLES: Record<'querellante' | 'querellado', readonly string[]> = {
  querellante: ['querellante', 'demandante', 'accionante', 'quejoso', 'plaintiff'],
  querellado: ['querellado', 'presunto infractor', 'infractor', 'demandado', 'accionado', 'defendant'],
};

function buscarPorRol(
  partes: readonly ParteExtraida[],
  rol: keyof typeof ROLES,
): ParteExtraida | undefined {
  const aceptados = ROLES[rol];
  return partes.find((p) => aceptados.includes(texto(p.role).toLowerCase()));
}

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

  const rellenar = (actual: string, propuesto?: string) =>
    actual.trim().length > 0 ? actual : texto(propuesto);

  const querellante = buscarPorRol(extraidas, 'querellante');
  const querellado = buscarPorRol(extraidas, 'querellado');

  return {
    ...actuales,
    querellante: {
      ...PARTE_VACIA,
      ...actuales.querellante,
      nombre: rellenar(actuales.querellante.nombre, querellante?.fullName),
      identificacion: rellenar(
        actuales.querellante.identificacion,
        querellante?.identificationNumber,
      ),
    },
    querellado: {
      ...PARTE_VACIA,
      ...actuales.querellado,
      nombre: rellenar(actuales.querellado.nombre, querellado?.fullName),
      identificacion: rellenar(actuales.querellado.identificacion, querellado?.identificationNumber),
    },
    calidadQuerellante: rellenar(actuales.calidadQuerellante, querellante?.capacity),
  };
}

/** Qué campos vienen de la máquina y el inspector todavía no ha confirmado. */
export function camposPorVerificar(extraidas: readonly ParteExtraida[] | undefined): string[] {
  if (!extraidas || extraidas.length === 0) return [];
  const querellante = buscarPorRol(extraidas, 'querellante');
  const querellado = buscarPorRol(extraidas, 'querellado');

  return [
    [querellante?.fullName, 'nombre del querellante'] as const,
    [querellante?.identificationNumber, 'identificación del querellante'] as const,
    [querellante?.capacity, 'calidad en que actúa'] as const,
    [querellado?.fullName, 'nombre del querellado'] as const,
    [querellado?.identificationNumber, 'identificación del querellado'] as const,
  ]
    .filter(([valor]) => texto(valor).length > 0)
    .map(([, etiqueta]) => etiqueta);
}
