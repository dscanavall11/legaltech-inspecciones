import { generarDocxDesdeMergeFields } from './mergeFieldDocx';
import { descargarBlob } from './descargarBlob';

/** Falla explícita, sin generar un documento con datos inventados, si la plantilla oficial no está disponible. */
export class PlantillaExpedienteNoDisponibleError extends Error {
  constructor() {
    super(
      'No se encontró la plantilla oficial en public/Plantillas/expediente-oficial.docx. ' +
        'Debe cargarse el archivo EXPEDIENTE PLANTILLA.docx suministrado por el despacho antes de generar el expediente.',
    );
    this.name = 'PlantillaExpedienteNoDisponibleError';
  }
}

const RUTA_PLANTILLA = '/Plantillas/expediente-oficial.docx';

/** Descarga la plantilla oficial servida como asset estático. Lanza `PlantillaExpedienteNoDisponibleError` si no está cargada. */
export async function cargarPlantillaExpedienteOficial(): Promise<ArrayBuffer> {
  const respuesta = await fetch(encodeURI(RUTA_PLANTILLA));
  if (!respuesta.ok) throw new PlantillaExpedienteNoDisponibleError();
  const buffer = await respuesta.arrayBuffer();
  // Un 404 servido como index.html por el router SPA no siempre da status != 200;
  // un DOCX real empieza por la firma ZIP "PK".
  const firma = new Uint8Array(buffer.slice(0, 2));
  if (firma[0] !== 0x50 || firma[1] !== 0x4b) throw new PlantillaExpedienteNoDisponibleError();
  return buffer;
}

export interface ResultadoExpedienteOficial {
  blob: Blob;
  /** Campos de la plantilla para los que no había valor en el mapa — se generaron en blanco, nunca con el dato de ejemplo cacheado. Debe estar vacío en uso normal; si no, hay un campo nuevo sin mapear. */
  camposSinDato: string[];
}

export async function generarExpedienteOficialDocxBlob(
  plantilla: ArrayBuffer,
  campos: Record<string, string>,
): Promise<ResultadoExpedienteOficial> {
  const { blob, camposSinDato } = await generarDocxDesdeMergeFields(plantilla, campos);
  return { blob, camposSinDato };
}

export async function descargarExpedienteOficialDocx(
  plantilla: ArrayBuffer,
  campos: Record<string, string>,
  nombreArchivo: string,
): Promise<ResultadoExpedienteOficial> {
  const resultado = await generarExpedienteOficialDocxBlob(plantilla, campos);
  descargarBlob(resultado.blob, nombreArchivo);
  return resultado;
}
