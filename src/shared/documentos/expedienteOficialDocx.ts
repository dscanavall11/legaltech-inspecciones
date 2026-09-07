import { PatchType, TextRun, patchDocument } from 'docx';
import { descargarBlob } from './descargarBlob';

/**
 * Reemplaza los tags `{TAG}` de un DOCX real (la plantilla oficial del
 * despacho) por los valores del registro, preservando el resto del archivo
 * byte a byte: membrete, logos, tablas, márgenes, negritas, cursivas,
 * subrayados, alineación, saltos y pie de página no se tocan. `patchDocument`
 * (paquete `docx`, ya instalado) edita directamente el OOXML del archivo en
 * vez de reconstruirlo — a diferencia de `documentoLegalDocx.ts`, que arma un
 * documento nuevo desde cero para las actas.
 */
export async function generarExpedienteOficialDocxBlob(
  plantilla: ArrayBuffer,
  campos: Record<string, string>,
): Promise<Blob> {
  const patches = Object.fromEntries(
    Object.entries(campos).map(([tag, valor]) => [
      tag,
      { type: PatchType.PARAGRAPH, children: [new TextRun(valor ?? '')] },
    ]),
  );
  return patchDocument({
    outputType: 'blob',
    data: plantilla,
    patches,
    keepOriginalStyles: true,
    // La plantilla usa un solo par de llaves ("{TAG}", como en la especificación
    // del despacho) — el valor por defecto de `docx` es "{{TAG}}". Si al cargar
    // la plantilla oficial real sus tags usan otra convención, ajustar aquí.
    placeholderDelimiters: { start: '{', end: '}' },
  });
}

export async function descargarExpedienteOficialDocx(
  plantilla: ArrayBuffer,
  campos: Record<string, string>,
  nombreArchivo: string,
): Promise<void> {
  const blob = await generarExpedienteOficialDocxBlob(plantilla, campos);
  descargarBlob(blob, nombreArchivo);
}

/** Falla explícita, sin generar un documento vacío, si la plantilla oficial aún no fue cargada al proyecto. */
export class PlantillaExpedienteNoDisponibleError extends Error {
  constructor() {
    super(
      'No se encontró la plantilla oficial en public/plantillas/expediente-oficial.docx. ' +
        'Debe cargarse el archivo EXPEDIENTE PLANTILLA.docx suministrado por el despacho antes de generar el expediente.',
    );
    this.name = 'PlantillaExpedienteNoDisponibleError';
  }
}

const RUTA_PLANTILLA = '/plantillas/expediente-oficial.docx';

/** Descarga la plantilla oficial servida como asset estático. Lanza `PlantillaExpedienteNoDisponibleError` si no está cargada. */
export async function cargarPlantillaExpedienteOficial(): Promise<ArrayBuffer> {
  const respuesta = await fetch(RUTA_PLANTILLA);
  if (!respuesta.ok) throw new PlantillaExpedienteNoDisponibleError();
  const buffer = await respuesta.arrayBuffer();
  // Un 404 servido como index.html por el router SPA no siempre da status != 200;
  // un DOCX real empieza por la firma ZIP "PK".
  const firma = new Uint8Array(buffer.slice(0, 2));
  if (firma[0] !== 0x50 || firma[1] !== 0x4b) throw new PlantillaExpedienteNoDisponibleError();
  return buffer;
}
