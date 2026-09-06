import { apiFetch } from '@/shared/api/client';
import type {
  DigitalArchiveRequest,
  DigitalArchiveResponse,
  LegalBasisDetail,
  NationalNormsPage,
} from './types';

/** Búsqueda paginada de normas nacionales (microservicio legalbases). */
export function getNormasNacionales(opts: {
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
} = {}) {
  const params = new URLSearchParams({
    search: opts.search ?? '',
    page: String(opts.page ?? 0),
    size: String(opts.size ?? 10),
    sortBy: opts.sortBy ?? 'publishedAt',
    sortDir: opts.sortDir ?? 'asc',
  });
  return apiFetch<NationalNormsPage>(`/national-norms?${params}`);
}

export function getNormaPorId(id: string | number) {
  return apiFetch<LegalBasisDetail>(`/national-norms/${id}`);
}

/**
 * Archivo digital: sube un documento (Querella/Queja/Apelación) como
 * multipart. El JSON va en la parte 'data', igual que espera el backend.
 */
export function guardarArchivoDigital(data: DigitalArchiveRequest, file: File) {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  formData.append('file', file);
  return apiFetch<DigitalArchiveResponse>('/national-norms/save', {
    method: 'POST',
    body: formData,
  });
}
