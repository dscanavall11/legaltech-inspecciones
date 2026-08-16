import { parseCaseMetadata } from '@/shared/legalCases/types';

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
export interface DatosParte {
  nombre: string;
  tipoIdentificacion: string;
  identificacion: string;
  direccion: string;
  telefono: string;
  correo: string;
  /** Opcional: el art. 2.2.8.18.4.3 no exige abogado y prohíbe alegar falta de defensa técnica por no tenerlo. */
  apoderado: string;
}

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

const PARTE_VACIA: DatosParte = {
  nombre: '',
  tipoIdentificacion: 'CC',
  identificacion: '',
  direccion: '',
  telefono: '',
  correo: '',
  apoderado: '',
};

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
  const sinNombre = (p: DatosParte) => p.nombre.trim().length === 0;
  const sinIdentificacion = (p: DatosParte) => p.identificacion.trim().length === 0;
  return [
    ...(sinNombre(partes.querellante) ? ['Nombre del querellante'] : []),
    ...(sinIdentificacion(partes.querellante) ? ['Identificación del querellante'] : []),
    ...(partes.calidadQuerellante.trim().length === 0
      ? ['Calidad en que actúa el querellante (art. 2.2.8.18.4.1)']
      : []),
    ...(sinNombre(partes.querellado) ? ['Nombre del querellado'] : []),
    ...(sinIdentificacion(partes.querellado) ? ['Identificación del querellado'] : []),
  ];
}

/** Nombre para el encabezado del fallo; nunca inventa uno. */
export function rotuloParte(parte: DatosParte): string {
  const nombre = parte.nombre.trim();
  const id = parte.identificacion.trim();
  return nombre.length === 0
    ? 'No identificado'
    : id.length === 0
      ? nombre
      : `${nombre}, ${parte.tipoIdentificacion} ${id}`;
}
