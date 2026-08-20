import type { Comparendo } from '@/features/actas/comparendos';
import { extraerComparendoPdf } from '@/features/actas/extraerComparendoPdf';
import { buscarEnBd } from '@/shared/comparendos/store';
import type { ParteExtraida } from '@/shared/partes/rolesExtraidos';

/** De dónde salieron los datos. Se le dice al inspector: no es lo mismo un dato leído que uno inferido. */
export type FuenteExtraccion = 'bd' | 'documento' | 'agente';

export interface Extraccion {
  fuente: FuenteExtraccion;
  partes: ParteExtraida[];
  /** Datos del comparendo, cuando el documento era uno. */
  comparendo?: Partial<Comparendo>;
  hechos?: string;
}

export const ETIQUETA_FUENTE: Record<FuenteExtraccion, string> = {
  bd: 'la base de comparendos del despacho',
  documento: 'el texto del documento',
  agente: 'la lectura del expediente con IA',
};

/** El presunto infractor de un comparendo, en el contrato genérico de partes. */
const comoParte = (c: Partial<Comparendo>): ParteExtraida[] =>
  (c.solicitado ?? '').trim().length === 0
    ? []
    : [
        {
          role: 'presunto infractor',
          fullName: c.solicitado,
          identificationType: 'CC',
          identificationNumber: c.cedula ?? '',
          address: c.direccion ?? '',
          phone: c.telefono ?? '',
        },
      ];

const trajoAlgo = (c: Partial<Comparendo>) =>
  Boolean((c.solicitado ?? '').trim() || (c.comparendo ?? '').trim());

/**
 * Lee un documento SIN gastar una llamada al modelo.
 *
 * Es el mismo extractor que usa Actas de firmeza: pdfjs saca el texto y las
 * expresiones regulares sacan los campos. Instantáneo, exacto y gratis. Solo
 * falla con escaneos sin capa de texto, que es justo cuando hace falta la IA.
 *
 * Cuando el documento da el número del comparendo y ese comparendo ya está en
 * la base cargada, gana la base: trae más campos y son los del despacho, no
 * los que se pudieron adivinar de una página.
 */
export async function leerDocumentoSinIa(archivo: File): Promise<Extraccion | null> {
  if (!/\.pdf$/i.test(archivo.name)) return null;

  const { datos, textoDisponible } = await extraerComparendoPdf(archivo);
  if (!textoDisponible || !trajoAlgo(datos)) return null;

  const enBd = buscarEnBd(datos.comparendo);
  const comparendo = enBd ?? datos;

  return {
    fuente: enBd ? 'bd' : 'documento',
    partes: comoParte(comparendo),
    comparendo,
    hechos: comparendo.hechos,
  };
}

/**
 * Lo primero que dé resultado, en orden de coste: la base y el texto del PDF
 * antes que el modelo. Devuelve null cuando ningún documento se dejó leer y hay
 * que preguntarle a la IA.
 */
export async function leerDocumentosSinIa(archivos: readonly File[]): Promise<Extraccion | null> {
  for (const archivo of archivos) {
    const leido = await leerDocumentoSinIa(archivo).catch(() => null);
    if (leido) return leido;
  }
  return null;
}
