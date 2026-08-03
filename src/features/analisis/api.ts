import { apiFetch, contextHeaders } from '@/shared/api/client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

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
 * Resumen de un documento del expediente, generado por el tier suave de IA.
 * Va por el BFF (/api/legal/resumen) al servicio legal - el endpoint real
 * solo devuelve texto plano (ApiResponse<String>), no la estructura con
 * acápites/razonesDePeso/normasCitadas que se pedía antes: eso nunca lo
 * produjo el backend, era una forma inventada del lado del frontend.
 */
export async function resumirDocumento(req: {
  tipoDocumento: string;
  texto: string;
}): Promise<string> {
  const res = await apiFetch<ApiEnvelope<string>>('/legal/resumen', {
    method: 'POST',
    body: JSON.stringify(`${req.tipoDocumento}: ${req.texto}`),
  });
  return res.data;
}

// ── Caso / expediente / fallo ──────────────────────────────────────────

export interface CaseParty {
  partyRole: string;
  identificationType: string;
  identificationNumber: string;
  fullName: string;
}

export interface CaseBackground {
  allegedFacts: string;
  reliefSought: string;
  defensesAndObjections: string;
}

export interface LegalCase {
  id: string;
  filingNumber: string;
  judicialOfficeId: string;
  caseType: string;
  rulingDate: string | null;
  venueCity: string;
  evidenceAssessment: string | null;
  legalReasoning: string | null;
  currentStateCode: string;
  caseMetadata: string | null;
  background: CaseBackground | null;
  parties: CaseParty[];
}

export function getLegalCase(caseId: string) {
  return apiFetch<LegalCase>(`/legal-cases/${caseId}`);
}

/** El expediente sanitizado (markdown) no es JSON - fetch crudo con el mismo token/base que apiFetch. */
export async function getExpedienteMarkdown(caseId: string): Promise<string> {
  const headers = contextHeaders({ Accept: 'text/markdown' });
  const res = await fetch(`${BASE_URL}/tools/expedientes/${caseId}/markdown`, { headers });
  if (!res.ok) throw new Error(`No se pudo obtener el expediente (HTTP ${res.status})`);
  return res.text();
}

/** Punto de conflicto donde el Auditor corrigió al Analista. */
export interface Discrepancy {
  affectedField: string;
  analystValue: string;
  auditorValue: string;
  legalJustification: string;
}

/** ComplaintResponse crudo (campos separados, no el string ya renderizado). */
export interface ComplaintResponseFields {
  antecedents: string;
  juridicProblem: string;
  juridicResponse: string;
  juridicFundamentals: string;
  evidences: string;
  audiosTranscriptions: string;
  parteResolutiva: string;
  /** false si Analista y Auditor no convergieron: requiere resolución del inspector. */
  consensusReached?: boolean;
  /** Argumentos en conflicto cuando no hubo consenso. */
  discrepancies?: Discrepancy[];
}

/**
 * Pide a la IA que redacte el borrador del fallo a partir de la información
 * general (expediente saneado + hechos del caso). Devuelve los campos por
 * separado para que el inspector los edite individualmente antes de firmar.
 */
/**
 * Pide el borrador estructurado enviando solo el caseId: legal extrae el
 * expediente (datos del caso + .md saneado) server-side. El front ya no baja
 * ni compone la información general (principio de gobernanza de datos).
 *
 * `currentStateCode` es un campo aditivo: el backend prefiere la etapa que
 * resuelva server-side desde legalcase y solo usa este valor como respaldo
 * (p. ej. si legalcase no responde) para que el análisis nunca trate el
 * proceso como si ya estuviera fallado cuando en realidad sigue en curso.
 */
export async function analizarEstructurado(
  caseId: string,
  currentStateCode?: string,
): Promise<ComplaintResponseFields> {
  const data = new FormData();
  data.append(
    'data',
    new Blob(
      [JSON.stringify({ caseId, currentStateCode, processInformation: { processType: 'COMPLAINT' } })],
      { type: 'application/json' },
    ),
  );
  const res = await apiFetch<ApiEnvelope<ComplaintResponseFields>>('/legal/analyze-structured', {
    method: 'POST',
    body: data,
  });
  return res.data;
}
