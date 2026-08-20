/**
 * Los datos de una parte de un proceso, sea cual sea el trámite. Vive aquí y
 * no en una feature porque la ficha del querellante, la del querellado y la
 * del presunto infractor de una queja son la misma ficha: cambia el rótulo y
 * la norma que la exige, no los campos.
 *
 * `case_parties` en legalcase solo guarda rol, tipo y número de documento y
 * nombre. El resto —contacto, apoderado, calidad— vive en `caseMetadata`, el
 * blob opaco. Sin migración.
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

export const PARTE_VACIA: DatosParte = {
  nombre: '',
  tipoIdentificacion: 'CC',
  identificacion: '',
  direccion: '',
  telefono: '',
  correo: '',
  apoderado: '',
};

/** Documentos de identidad que admiten los formularios del despacho. */
export const TIPOS_IDENTIFICACION = ['CC', 'CE', 'NIT', 'TI', 'PPT', 'PAS'];

/** Nombre para el encabezado de un documento; nunca inventa uno. */
export function rotuloParte(parte: DatosParte): string {
  const nombre = parte.nombre.trim();
  const id = parte.identificacion.trim();
  return nombre.length === 0
    ? 'No identificado'
    : id.length === 0
      ? nombre
      : `${nombre}, ${parte.tipoIdentificacion} ${id}`;
}

/** Lo que impide que un documento identifique a esta parte. */
export function faltantesDeParte(rotulo: string, parte: DatosParte): string[] {
  return [
    ...(parte.nombre.trim().length === 0 ? [`Nombre del ${rotulo}`] : []),
    ...(parte.identificacion.trim().length === 0 ? [`Identificación del ${rotulo}`] : []),
  ];
}
