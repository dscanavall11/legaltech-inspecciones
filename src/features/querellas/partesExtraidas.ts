import { PARTE_VACIA, type PartesQuerella } from './partes';

/**
 * Sujetos procesales que el analizador leyó de los documentos. Espejo de
 * ComplaintResponse.ExtractedParties en el servicio legal.
 *
 * Un campo vacío significa "no consta en los documentos", no "no se sabe":
 * el prompt prohíbe deducir e inventar aquí, porque este dato acaba
 * identificando a una persona dentro de una decisión firmada.
 */
export interface PartesExtraidas {
  querellanteNombre?: string;
  querellanteIdentificacion?: string;
  calidadQuerellante?: string;
  querelladoNombre?: string;
  querelladoIdentificacion?: string;
  inmuebleDireccion?: string;
}

const texto = (v?: string) => (v ?? '').trim();

/**
 * Vuelca lo extraído sobre la ficha **sin pisar lo que el inspector ya
 * escribió**: lo que él puso manda sobre lo que leyó la máquina. Solo rellena
 * huecos.
 */
export function fusionarExtraidas(
  actuales: PartesQuerella,
  extraidas: PartesExtraidas | undefined,
): PartesQuerella {
  if (!extraidas) return actuales;

  const rellenar = (actual: string, propuesto?: string) =>
    actual.trim().length > 0 ? actual : texto(propuesto);

  return {
    ...actuales,
    querellante: {
      ...PARTE_VACIA,
      ...actuales.querellante,
      nombre: rellenar(actuales.querellante.nombre, extraidas.querellanteNombre),
      identificacion: rellenar(
        actuales.querellante.identificacion,
        extraidas.querellanteIdentificacion,
      ),
    },
    querellado: {
      ...PARTE_VACIA,
      ...actuales.querellado,
      nombre: rellenar(actuales.querellado.nombre, extraidas.querelladoNombre),
      identificacion: rellenar(
        actuales.querellado.identificacion,
        extraidas.querelladoIdentificacion,
      ),
    },
    calidadQuerellante: rellenar(actuales.calidadQuerellante, extraidas.calidadQuerellante),
    inmuebleDireccion: rellenar(actuales.inmuebleDireccion, extraidas.inmuebleDireccion),
  };
}

/** Qué campos vienen de la máquina y el inspector todavía no ha confirmado. */
export function camposPorVerificar(extraidas: PartesExtraidas | undefined): string[] {
  if (!extraidas) return [];
  return [
    [extraidas.querellanteNombre, 'nombre del querellante'] as const,
    [extraidas.querellanteIdentificacion, 'identificación del querellante'] as const,
    [extraidas.calidadQuerellante, 'calidad en que actúa'] as const,
    [extraidas.querelladoNombre, 'nombre del querellado'] as const,
    [extraidas.querelladoIdentificacion, 'identificación del querellado'] as const,
    [extraidas.inmuebleDireccion, 'dirección del inmueble'] as const,
  ]
    .filter(([valor]) => texto(valor).length > 0)
    .map(([, etiqueta]) => etiqueta);
}
