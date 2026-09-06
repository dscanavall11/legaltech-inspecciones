import { contextHeaders } from '@/shared/api/client';
import type { ParteRecepcion } from './partes';

export type { ParteRecepcion } from './partes';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** El `<case_update>` del agente de recepción, campo a campo. */
export interface CaseUpdate {
  tipoSolicitud?: string | null;
  listoParaRadicar?: boolean;
  radicado?: string | null;
  juzgado?: string | null;
  ciudad?: string | null;
  hechos?: string | null;
  pretension?: string | null;
  partes?: ParteRecepcion[];
  estadoSugerido?: string | null;
  categorias?: string[];
  observaciones?: string | null;
}

export interface PeticionRecepcion {
  texto: string;
  archivos?: File[];
  /**
   * El expediente al que pertenece la conversación, cuando YA existe.
   *
   * No es decorativo: sin él, `listoParaRadicar` hace que legal radique un
   * caso nuevo (IntakeCaseCreationGate). Enviándolo, el servidor se salta esa
   * compuerta y el agente solo lee. Un área de trabajo que omita este campo
   * abre un expediente duplicado cada vez que suba documentos.
   */
  caseId?: string;
}

/**
 * Una sola llamada al agente de recepción. La comparten el chat de radicación,
 * el de recursos y la extracción del área de trabajo: es el mismo agente
 * leyendo los mismos documentos, solo cambia quién usa la respuesta.
 */
export async function pedirRecepcion({
  texto,
  archivos,
  caseId,
}: PeticionRecepcion): Promise<string> {
  const body = new FormData();
  body.append('data', texto);
  (archivos ?? []).forEach((archivo) => body.append('files', archivo, archivo.name));

  const ruta = caseId
    ? `${API_BASE}/legal/recepcion?caseId=${encodeURIComponent(caseId)}`
    : `${API_BASE}/legal/recepcion`;

  const res = await fetch(ruta, { method: 'POST', headers: contextHeaders(), body });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data } = (await res.json()) as { data: string };
  return data;
}
