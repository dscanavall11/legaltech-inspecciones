/**
 * Mirrors legalcase's real, generic /api/legal-cases resource - the single
 * source of truth behind querellas/quejas/audiencias/fallos/actas. The
 * backend is agnostic to caseType: it never knows "querella" from "queja",
 * only a free-text caseType string. Anything workspace/case-type-specific
 * (e.g. a querella's "asunto") is opaque to the backend and lives in
 * caseMetadata (raw JSON the backend never reads).
 */
export interface CaseParty {
  partyRole: string;
  identificationType: string;
  identificationNumber: string;
  fullName: string;
}

export interface CaseBackground {
  allegedFacts: string | null;
  reliefSought: string | null;
  defensesAndObjections: string | null;
}

export interface CaseRuling {
  dispositiveDecision: string | null;
  orderedInjunctions: string | null;
  monetaryAwards: number | null;
  legalCosts: number | null;
  attorneyFeesAward: number | null;
}

export interface CaseStateHistoryEntry {
  stateCode: string | null;
  stateName: string | null;
  changedAt: string; // ISO datetime
  reason: string | null;
}

/** Ciclo de vida tecnico del expediente (Querellas Fase 2/3) - no es un estado procesal. */
export type CaseLifecycleStatus = 'ACTIVO' | 'FINALIZADO';

export interface LegalCase {
  id: string;
  createdAt: string | null; // ISO datetime
  /** Nulo hasta que exista un radicado real (Fase 3: el expediente puede crearse antes). */
  filingNumber: string | null;
  judicialOfficeId: string;
  caseType: string;
  rulingDate: string | null;
  venueCity: string;
  evidenceAssessment: string | null;
  legalReasoning: string | null;
  /**
   * @deprecated legalcase no expone este campo hoy (queda reservado para un futuro
   * estado procesal). Usar `status` (ACTIVO/FINALIZADO) para el ciclo de vida real.
   */
  currentStateCode?: string;
  /** Raw JSON string - parse with parseCaseMetadata()/serialize with buildCaseMetadata(). */
  caseMetadata: string | null;
  background: CaseBackground | null;
  ruling: CaseRuling | null;
  parties: CaseParty[];
  stateHistory: CaseStateHistoryEntry[];
  /** Ciclo de vida real (Fase 2/3): ACTIVO o FINALIZADO. */
  status: CaseLifecycleStatus;
  finalizedAt: string | null;
  finalizedReason: string | null;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * legalcase (Fase 3) solo acepta judicialOfficeId/caseType/venueCity/className -- sin
 * filingNumber, sin rulingDate, sin ruling: el expediente nace sin radicado ni fallo, se
 * completan despues con datos reales. userId lo deriva el servidor de la sesion, nunca
 * viaja aqui.
 *
 * caseMetadata/background/parties quedan como opcionales por compatibilidad de tipos con
 * otras features (comparendos) que todavia no migraron a este contrato -- legalcase real
 * puede rechazar (400) una propiedad que no reconoce: no las envies para una querella
 * nueva.
 */
export interface CreateLegalCaseInput {
  judicialOfficeId: string;
  caseType: string;
  venueCity: string;
  className: string;
  filingNumber?: string;
  caseMetadata?: string;
  background?: CaseBackground;
  parties?: CaseParty[];
}

/** caseMetadata is an opaque blob to the backend; each feature defines its own shape client-side. */
export function parseCaseMetadata<T>(raw: string | null): Partial<T> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<T>;
  } catch {
    return {};
  }
}

export function buildCaseMetadata(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}
