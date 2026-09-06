import { apiFetch, contextHeaders } from '@/shared/api/client';
import { pedirRecepcion, type CaseUpdate } from '@/shared/recepcion/api';
import { aPartesExtraidas } from '@/shared/recepcion/partes';
import { leerCaseUpdate } from '@/shared/recepcion/marcadores';
import type { CaseDocument } from '@/shared/documentos/types';
import { leerDocumentosSinIa } from './cascadaExtraccion';
import type { Extraccion } from './cascadaExtraccion';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type { Extraccion, FuenteExtraccion } from './cascadaExtraccion';
export { ETIQUETA_FUENTE } from './cascadaExtraccion';

const INSTRUCCION =
  'Lee el expediente que sigue y extrae los datos del proceso: las partes con su rol, ' +
  'tipo y número de documento, y los hechos. No radiques nada: el expediente ya existe. ' +
  'Transcribe únicamente lo que aparezca literal; deja vacío lo que no conste.';

/** Baja los PDF del expediente para poder leerlos aquí, sin pasar por el modelo. */
async function pdfsDelExpediente(caseId: string): Promise<File[]> {
  const documentos = await apiFetch<CaseDocument[]>(`/tools/expedientes/${caseId}/documents`);
  const pdfs = documentos.filter((d) => /\.pdf$/i.test(d.fileName));

  const bajados = await Promise.allSettled(
    pdfs.map(async (d) => {
      const { url } = await apiFetch<{ url: string }>(
        `/tools/expedientes/${caseId}/documents/url?key=${encodeURIComponent(d.storageKey)}`,
      );
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return new File([await res.blob()], d.fileName, { type: 'application/pdf' });
    }),
  );

  return bajados.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
}

/** Último recurso: el agente de recepción lee el digest saneado del expediente. */
async function preguntarAlAgente(caseId: string): Promise<Extraccion> {
  const res = await fetch(`${API_BASE}/tools/expedientes/${caseId}/markdown`, {
    headers: contextHeaders(),
  });
  if (!res.ok) throw new Error(`No se pudo leer el expediente (HTTP ${res.status})`);
  const expediente = (await res.text()).trim();
  if (expediente.length === 0) {
    throw new Error('El expediente no tiene documentos legibles de los que extraer datos.');
  }

  // caseId SIEMPRE: es lo que hace que legal se salte la compuerta de
  // radicación. Sin él, cada extracción abriría un expediente duplicado.
  const respuesta = await pedirRecepcion({ texto: `${INSTRUCCION}\n\n${expediente}`, caseId });
  const update = leerCaseUpdate<CaseUpdate>(respuesta);

  return {
    fuente: 'agente',
    partes: aPartesExtraidas(update?.partes),
    hechos: update?.hechos ?? undefined,
  };
}

/**
 * Los datos del proceso, por el camino más barato que funcione.
 *
 * El orden no es capricho. Actas de firmeza lleva tiempo sacando estos mismos
 * datos sin IA —pdfjs extrae el texto del PDF, las expresiones regulares sacan
 * los campos, y si el comparendo ya está en la base del despacho se toma de
 * ahí—: eso es instantáneo, gratis y exacto. El modelo cuesta minutos, cuesta
 * dinero y puede equivocarse, así que entra solo cuando lo anterior no dio
 * nada: un escaneo sin capa de texto, o un documento que no es un comparendo.
 *
 * 1. La base de comparendos cargada, si el documento trae un número conocido.
 * 2. El texto del propio PDF.
 * 3. El agente de recepción sobre el digest saneado.
 */
export async function extraerDatosDelExpediente(caseId: string): Promise<Extraccion> {
  const sinIa = await pdfsDelExpediente(caseId)
    .then(leerDocumentosSinIa)
    .catch(() => null);

  return sinIa ?? preguntarAlAgente(caseId);
}
