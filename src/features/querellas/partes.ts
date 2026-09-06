import { parseCaseMetadata, type CaseParty } from '@/shared/legalCases/types';
import { faltantesDeParte, PARTE_VACIA, type DatosParte } from '@/shared/partes/parte';

export { PARTE_VACIA, rotuloParte, type DatosParte } from '@/shared/partes/parte';

/**
 * Sujetos procesales de la querella. Son DOS, no uno: el art. 2.2.8.18.3.3 del
 * Decreto 768 de 2025 define la querella como el trámite que "requiere impulso
 * de parte, y en las mismas serán sujetos procesales el querellante y el
 * querellado" — a diferencia de la queja, que es oficiosa y solo tiene
 * presunto infractor.
 *
 * `case_parties` en legalcase solo guarda rol, tipo y número de documento y
 * nombre. Todo lo demás que el proceso necesita —contacto, apoderado y la
 * calidad en que actúa el querellante— vive en `caseMetadata`, el mismo blob
 * opaco donde ya están orientaciones y datos del fallo. Sin migración.
 */
export interface PartesQuerella {
  querellante: DatosParte;
  querellado: DatosParte;
  /**
   * Art. 2.2.8.18.4.1: "En todas las querellas de policía deberá acreditarse la
   * condición y calidad con la que se actúa". Es requisito de la querella, no
   * un dato accesorio.
   */
  calidadQuerellante: string;
  /** Art. 2.2.8.18.4.2: en querellas sobre inmuebles el querellante prueba posesión o tenencia siquiera sumariamente. */
  inmuebleDireccion: string;
  matriculaInmobiliaria: string;
}

export const PARTES_VACIAS: PartesQuerella = {
  querellante: { ...PARTE_VACIA },
  querellado: { ...PARTE_VACIA },
  calidadQuerellante: '',
  inmuebleDireccion: '',
  matriculaInmobiliaria: '',
};

/** Calidades del art. 2.2.8.18.4.1/4.2 — el inspector puede escribir otra. */
export const CALIDADES_QUERELLANTE = [
  'Propietario',
  'Poseedor',
  'Tenedor',
  'Administrador',
  'Representante legal',
  'Afectado directo',
  'Entidad de derecho público',
];

interface MetadataConPartes {
  partes?: Partial<PartesQuerella>;
}

export function leerPartes(caseMetadataRaw: string | null | undefined): PartesQuerella {
  const guardadas = parseCaseMetadata<MetadataConPartes>(caseMetadataRaw ?? null).partes ?? {};
  return {
    ...PARTES_VACIAS,
    ...guardadas,
    querellante: { ...PARTE_VACIA, ...guardadas.querellante },
    querellado: { ...PARTE_VACIA, ...guardadas.querellado },
  };
}

/**
 * Lo que impide tener por bien formada la querella. No bloquea nada: el
 * inspector decide. Se listan para que el control previo al fallo los muestre
 * en vez de dejar que el documento salga con un sujeto procesal vacío.
 */
export function faltantesParaFallo(partes: PartesQuerella): string[] {
  return [
    ...faltantesDeParte('querellante', partes.querellante),
    ...(partes.calidadQuerellante.trim().length === 0
      ? ['Calidad en que actúa el querellante (art. 2.2.8.18.4.1)']
      : []),
    ...faltantesDeParte('querellado', partes.querellado),
  ];
}


/**
 * La ficha, traducida a los sujetos procesales que guarda legalcase.
 *
 * `case_parties` solo tiene rol, tipo y número de documento y nombre: el resto
 * de la ficha (contacto, apoderado, calidad) se queda en `caseMetadata`. No es
 * duplicación, son dos lecturas distintas del mismo dato — de `case_parties`
 * leen Mis procesos, el encabezado del fallo y el seudonimizador del servicio
 * legal, que no saben nada de querellas.
 *
 * Una parte sin nombre no se envía: legalcase la rechazaría (columna NOT NULL)
 * y media parte no es una parte.
 */
export function aCaseParties(partes: PartesQuerella): CaseParty[] {
  return ([
    ['querellante', partes.querellante],
    ['querellado', partes.querellado],
  ] as const)
    .filter(([, parte]) => parte.nombre.trim().length > 0)
    .map(([partyRole, parte]) => ({
      partyRole,
      identificationType: parte.tipoIdentificacion,
      identificationNumber: parte.identificacion.trim(),
      fullName: parte.nombre.trim(),
    }));
}
