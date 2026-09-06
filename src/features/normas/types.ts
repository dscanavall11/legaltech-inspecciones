/** Contratos del microservicio legalbases / national-norms (portados de Angular). */

export interface LegalBasis {
  id: string | number;
  title: string;
  type: string;
  publishedAt: string;
  sourceUrl: string;
}

export interface NormArticle {
  id: number;
  articleNumber: number;
  articleSuffix?: string;
  title: string;
  content: string;
}

export interface LegalBasisDetail extends LegalBasis {
  description: string;
  articles?: NormArticle[];
}

/** Página estilo PagedResponseDTO del BFF. */
export interface NationalNormsPage {
  content: LegalBasis[];
  totalElements: number;
  totalPages: number;
  /** Spring-side page index (0-based). El BFF lo expone como `page`. */
  page: number;
  size: number;
}

export interface DigitalArchiveRequest {
  title: string;
  description: string;
  type: 'Querella' | 'Queja' | 'Apelacion';
}

export interface DigitalArchiveResponse {
  status: string;
  message: string;
  id?: string;
}
