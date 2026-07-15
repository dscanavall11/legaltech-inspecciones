/** Contratos del microservicio legalcase (portados del frontend Angular). */

export interface LegalCase {
  id: string;
  filingNumber: string;
  judicialOfficeId: string;
  caseType: string;
  rulingDate: string; // ISO string (LocalDate)
}

export interface CaseBackground {
  allegedFacts: string;
  reliefSought: string;
  defensesAndObjections: string;
}

export interface CaseRuling {
  dispositiveDecision: string;
  orderedInjunctions: string;
  monetaryAwards: number;
  legalCosts: number;
  attorneyFeesAward: number;
}

export interface CaseParty {
  partyRole: string;
  identificationType: string;
  identificationNumber: string;
  fullName: string;
}

export interface LegalCaseDetail extends LegalCase {
  venueCity: string;
  evidenceAssessment: string;
  legalReasoning: string;
  background: CaseBackground;
  ruling: CaseRuling;
  parties: CaseParty[];
}
