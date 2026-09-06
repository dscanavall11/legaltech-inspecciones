import { PARTE_VACIA, type DatosParte } from './parte';

/**
 * Una parte del proceso leída de los documentos. Espejo de
 * ComplaintResponse.ExtractedParty en el servicio legal, que es
 * deliberadamente genérico: `role` es texto libre porque ese servicio no sabe
 * de querellas ni de quejas.
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
  address?: string;
  phone?: string;
  email?: string;
}

/** Raíces de rol por casilla del trámite. La define cada feature, no este módulo. */
export type Vocabulario<C extends string> = Record<C, readonly string[]>;

export const texto = (v?: string) => (v ?? '').trim();

/** Sin tildes y en minúscula: el rol viene del documento y "Querellada" es "querellado". */
const normalizar = (v?: string) =>
  texto(v)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Quien comparece por una parte no ES la parte. Sin esta exclusión
 * "apoderado del querellante" caía en la casilla del querellante y el fallo
 * habría identificado al abogado como el sujeto procesal.
 */
const NO_SON_PARTE = [
  'apoderad',
  'abogad',
  'testig',
  'perit',
  'autoridad',
  'inspector',
  'secretari',
  'traductor',
  'interprete',
  'ministerio publico',
  'personero',
];

export const esParte = (p: ParteExtraida) => {
  const rol = normalizar(p.role);
  return rol.length > 0 && !NO_SON_PARTE.some((t) => rol.includes(t));
};

/**
 * La casilla a la que pertenece un rol libre. Se comparan RAÍCES por
 * subcadena, no cadenas completas: el prompt le ordena al modelo copiar el rol
 * tal como lo escribe el documento, y un acta escribe "parte querellante",
 * "querellada" o "querellado (propietario)" donde otra escribe "querellante" a
 * secas. Comparar por igualdad exacta dejaba la ficha vacía sin decir por qué.
 */
export function casillaDe<C extends string>(
  p: ParteExtraida,
  vocabulario: Vocabulario<C>,
): C | undefined {
  const rol = normalizar(p.role);
  return (Object.keys(vocabulario) as C[]).find((c) =>
    vocabulario[c].some((raiz) => rol.includes(raiz)),
  );
}

export function buscarPorCasilla<C extends string>(
  extraidas: readonly ParteExtraida[],
  vocabulario: Vocabulario<C>,
  casilla: C,
): ParteExtraida | undefined {
  return extraidas.filter(esParte).find((p) => casillaDe(p, vocabulario) === casilla);
}

/** Partes que el analizador leyó pero cuyo rol no cae en ninguna casilla. */
export function sinUbicar<C extends string>(
  extraidas: readonly ParteExtraida[] | undefined,
  vocabulario: Vocabulario<C>,
): string[] {
  return (extraidas ?? [])
    .filter((p) => texto(p.fullName).length > 0 && esParte(p) && !casillaDe(p, vocabulario))
    .map((p) => `${texto(p.fullName)} (${texto(p.role) || 'sin rol'})`);
}

/**
 * Lo que la máquina propone, campo a campo, **sin pisar lo que el inspector ya
 * escribió**: lo que él puso manda sobre lo que leyó la máquina.
 */
export function fusionarParte(actual: DatosParte, propuesta: ParteExtraida | undefined): DatosParte {
  const rellenar = (valor: string, propuesto?: string) =>
    valor.trim().length > 0 ? valor : texto(propuesto);
  return {
    ...PARTE_VACIA,
    ...actual,
    nombre: rellenar(actual.nombre, propuesta?.fullName),
    tipoIdentificacion:
      texto(propuesta?.identificationType).toUpperCase() || actual.tipoIdentificacion,
    identificacion: rellenar(actual.identificacion, propuesta?.identificationNumber),
    direccion: rellenar(actual.direccion, propuesta?.address),
    telefono: rellenar(actual.telefono, propuesta?.phone),
    correo: rellenar(actual.correo, propuesta?.email),
  };
}

/** Los campos que la máquina propuso y el inspector todavía no ha cotejado. */
export function etiquetasPropuestas(
  pares: readonly (readonly [string | undefined, string])[],
): string[] {
  return pares.filter(([valor]) => texto(valor).length > 0).map(([, etiqueta]) => etiqueta);
}
