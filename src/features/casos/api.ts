import { apiFetch } from '@/shared/api/client';
import type { LegalCase, LegalCaseDetail } from './types';

/** Página estilo PagedResponseDTO del BFF (campo `page`, no `number`). */
interface PagedLegalCases {
  content: LegalCase[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  last?: boolean;
}

/** Casos recientes del despacho — el BFF devuelve PagedResponseDTO; extraemos el content. */
export async function getCasosRecientes() {
  const resp = await apiFetch<PagedLegalCases>(
    '/legal-cases?page=0&size=50&sortBy=rulingDate&sortDir=desc',
  );
  return resp.content;
}

/** Detalle de un caso por número de radicado. */
export function getCasoPorRadicado(filingNumber: string) {
  return apiFetch<LegalCaseDetail>(
    `/legal-cases/filing-number/${encodeURIComponent(filingNumber)}`,
  );
}
