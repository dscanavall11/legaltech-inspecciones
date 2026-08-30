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

export interface LegalCase {
  id: string;
  createdAt: string | null; // ISO datetime
  filingNumber: string;
  judicialOfficeId: string;
  caseType: string;
  rulingDate: string | null;
  venueCity: string;
  evidenceAssessment: string | null;
  legalReasoning: string | null;
  currentStateCode: string;
  /** Raw JSON string - parse with parseCaseMetadata()/serialize with buildCaseMetadata(). */
  caseMetadata: string | null;
  background: CaseBackground | null;
  ruling: CaseRuling | null;
  parties: CaseParty[];
  stateHistory: CaseStateHistoryEntry[];
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CreateLegalCaseInput {
  filingNumber?: string;
  judicialOfficeId?: string;
  caseType: string;
  venueCity: string;
  className?: string;
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
