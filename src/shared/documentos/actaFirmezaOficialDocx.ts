import { generarDocxDesdeMergeFields } from './mergeFieldDocx';
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

export async function generarActaFirmezaOficialDocxBlob(
  plantilla: ArrayBuffer,
  campos: Record<string, string>,
): Promise<ResultadoActaFirmezaOficial> {
  const { blob, camposSinDato } = await generarDocxDesdeMergeFields(plantilla, campos);
  return { blob, camposSinDato };
}

export async function descargarActaFirmezaOficialDocx(
  plantilla: ArrayBuffer,
  campos: Record<string, string>,
  nombreArchivo: string,
): Promise<ResultadoActaFirmezaOficial> {
  const resultado = await generarActaFirmezaOficialDocxBlob(plantilla, campos);
  descargarBlob(resultado.blob, nombreArchivo);
  return resultado;
}
