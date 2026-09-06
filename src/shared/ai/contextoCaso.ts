import { apiFetch, contextHeaders } from '@/shared/api/client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Forma mínima del caso que necesita el contexto del chat. */
interface CasoContexto {
  filingNumber?: string;
  caseType?: string;
  currentStateCode?: string;
  background?: {
    allegedFacts?: string | null;
    reliefSought?: string | null;
    defensesAndObjections?: string | null;
  } | null;
  parties?: { partyRole?: string; fullName?: string }[] | null;
}

async function traerCaso(id: string): Promise<CasoContexto | null> {
  try {
    return await apiFetch<CasoContexto>(`/legal-cases/${id}`);
  } catch {
    return null;
  }
}

// Digest saneado del expediente (mismo endpoint que usa el borrador de fallo).
async function traerExpediente(id: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/tools/expedientes/${id}/markdown`, {
      headers: contextHeaders({ Accept: 'text/markdown' }),
    });
    if (!res.ok) return null;
    const texto = (await res.text()).trim();
    return texto.length > 0 ? texto : null;
  } catch {
    return null;
  }
}

/**
 * Arma el contexto textual de un caso (datos + expediente saneado) para
 * anteponerlo al mensaje del chat, de modo que Legal responda sobre el caso
 * real y no solo sobre su id. Devuelve null si no hay nada que aportar.
 */
export async function cargarContextoCaso(id: string): Promise<string | null> {
  const [caso, expediente] = await Promise.all([traerCaso(id), traerExpediente(id)]);

  const lineas = [
    caso?.filingNumber && `Radicado: ${caso.filingNumber}`,
    caso?.caseType && `Tipo: ${caso.caseType}`,
    caso?.currentStateCode && `Estado actual: ${caso.currentStateCode}`,
    caso?.parties?.length &&
      `Partes: ${caso.parties.map((p) => `${p.partyRole ?? 'parte'}: ${p.fullName ?? '—'}`).join('; ')}`,
    caso?.background?.allegedFacts && `Hechos: ${caso.background.allegedFacts}`,
    caso?.background?.reliefSought && `Pretensión: ${caso.background.reliefSought}`,
    caso?.background?.defensesAndObjections && `Descargos: ${caso.background.defensesAndObjections}`,
    expediente && `\nExpediente:\n${expediente}`,
  ].filter((l): l is string => Boolean(l));

  return lineas.length > 0 ? lineas.join('\n') : null;
}
