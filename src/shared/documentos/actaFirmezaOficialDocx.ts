import { generarDocxDesdeMergeFields } from './mergeFieldDocx';
import { repararValoresFijosActaFirmeza } from './textoFijoDocx';
import { descargarBlob } from './descargarBlob';
import { rutaPlantillaActaFirmeza } from '@/derecho/plantillas/catalogoActaFirmeza';

export class PlantillaActaFirmezaNoDisponibleError extends Error {
  constructor(archivo: string) {
    super(
      `No se encontró la plantilla oficial "${archivo}" en public/Plantillas/Actas de firmeza/. ` +
        'Debe cargarse el archivo real del despacho antes de generar el acta.',
    );
    this.name = 'PlantillaActaFirmezaNoDisponibleError';
  }
}

const RAIZ = '/Plantillas';

/** Descarga la plantilla oficial (por nombre de archivo real) servida como asset estático. */
export async function cargarPlantillaActaFirmeza(archivo: string): Promise<ArrayBuffer> {
  const ruta = `${RAIZ}/${rutaPlantillaActaFirmeza(archivo)}`;
  const respuesta = await fetch(encodeURI(ruta));
  if (!respuesta.ok) throw new PlantillaActaFirmezaNoDisponibleError(archivo);
  const buffer = await respuesta.arrayBuffer();
  const firma = new Uint8Array(buffer.slice(0, 2));
  if (firma[0] !== 0x50 || firma[1] !== 0x4b) throw new PlantillaActaFirmezaNoDisponibleError(archivo);
  return buffer;
}

export interface ResultadoActaFirmezaOficial {
  blob: Blob;
  camposSinDato: string[];
}

export interface ValoresFijosActa {
  /** "dos mil veintiséis (2026)" — año de vigencia real, calculado, nunca el que traía la plantilla. */
  anioVigenciaLetras: string;
  /** Solo cuando hay reincidencia: valor base + incremento, calculado. En "sin reincidencia" no se pasa (no hay frase que reparar). */
  valorTotalLetras?: string;
}

/**
 * Además de los MERGEFIELD, repara el texto fijo residual conocido (año de
 * vigencia y, en reincidencia, el "VALOR TOTAL A RECAUDAR") — ninguno de los
 * dos es un campo, así que sin esto quedarían con el valor del último caso
 * real combinado en la plantilla. Ver textoFijoDocx.ts.
 */
export async function generarActaFirmezaOficialDocxBlob(
  plantilla: ArrayBuffer,
  campos: Record<string, string>,
  valoresFijos: ValoresFijosActa,
): Promise<ResultadoActaFirmezaOficial> {
  const { blob, camposSinDato } = await generarDocxDesdeMergeFields(plantilla, campos, (_parte, xml) =>
    repararValoresFijosActaFirmeza(xml, valoresFijos).xml,
  );
  return { blob, camposSinDato };
}

export async function descargarActaFirmezaOficialDocx(
  plantilla: ArrayBuffer,
  campos: Record<string, string>,
  valoresFijos: ValoresFijosActa,
  nombreArchivo: string,
): Promise<ResultadoActaFirmezaOficial> {
  const resultado = await generarActaFirmezaOficialDocxBlob(plantilla, campos, valoresFijos);
  descargarBlob(resultado.blob, nombreArchivo);
  return resultado;
}
