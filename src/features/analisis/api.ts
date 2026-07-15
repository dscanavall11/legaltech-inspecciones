import { apiFetch } from '@/shared/api/client';

/** Respuesta del análisis con IA (microservicio legal / orchestrator). */
export interface ProcessResponse {
  status?: string;
  message?: string;
  analisisResult?: string;
  [key: string]: unknown; // el backend puede añadir campos dinámicos
}

/**
 * Envía un proceso (documentos + información general) para análisis con
 * historial. Multipart: el navegador fija el boundary automáticamente.
 */
export function analizarConHistorial(data: FormData) {
  return apiFetch<ProcessResponse>('/legal/analize-with-history', {
    method: 'POST',
    body: data,
  });
}

/** Resumen lateral generado por el tier suave de IA. */
export interface ResumenDocumento {
  resumen: string;
  acapites: { titulo: string; sintesis: string }[];
  razonesDePeso: string[];
  normasCitadas: string[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Resumen con acápites y razones de peso de un documento del expediente.
 * Va por el BFF (/api/legal/summarize) al servicio legal, tier suave.
 */
export async function resumirDocumento(req: {
  tipoDocumento: string;
  texto: string;
}): Promise<ResumenDocumento> {
  const res = await apiFetch<ApiEnvelope<ResumenDocumento>>('/legal/summarize', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return res.data;
}
