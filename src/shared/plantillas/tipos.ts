/** La plantilla OKF tal como la sirve legalcase. Espejo de StructuredTemplate.java. */
export interface StructuredTemplate {
  key: string;
  documentType: string;
  slots: string[];
  header: { entity: string; title: string; epigraph: string };
  sections: { id: string; title: string; content: string }[];
  commonOperativeClauses: string[];
}
