import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import type { CaseLifecycleStatus, CaseParty, CreateLegalCaseInput, LegalCase, PagedResponse } from './types';

export const legalCasesKeys = {
  all: ['legal-cases'] as const,
  lista: (params: LegalCasesQuery) => [...legalCasesKeys.all, 'lista', params] as const,
  detalle: (id: string) => [...legalCasesKeys.all, 'detalle', id] as const,
};

export interface LegalCasesQuery {
  caseType?: string;
  state?: string;
  /** ACTIVO/FINALIZADO (Fase 2/3). Ausente = ambos - ver "Mis procesos". */
  status?: CaseLifecycleStatus;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useLegalCases(query: LegalCasesQuery = {}) {
  return useQuery({
    queryKey: legalCasesKeys.lista(query),
    queryFn: () => {
      const params = new URLSearchParams();
      if (query.search) params.set('search', query.search);
      if (query.caseType) params.set('caseType', query.caseType);
      if (query.state) params.set('state', query.state);
      if (query.status) params.set('status', query.status);
      params.set('page', String(query.page ?? 0));
      params.set('size', String(query.size ?? 50));
      if (query.sortBy) params.set('sortBy', query.sortBy);
      if (query.sortDir) params.set('sortDir', query.sortDir);
      return apiFetch<PagedResponse<LegalCase>>(`/legal-cases/find-by-criteria?${params}`);
    },
  });
}

export function useLegalCase(id: string) {
  return useQuery({
    queryKey: legalCasesKeys.detalle(id),
    queryFn: () => apiFetch<LegalCase>(`/legal-cases/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateLegalCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLegalCaseInput) =>
      apiFetch<LegalCase>('/legal-cases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });
    },
  });
}

export interface FinalizeCaseInput {
  id: string;
  reason?: string;
}

/**
 * Cierra el contexto operativo del expediente (ACTIVO -> FINALIZADO). legalcase
 * rechaza cualquier escritura posterior con 409 -- esto es la accion explicita del
 * boton "Finalizar proceso", no una decision juridica de archivo.
 */
export function useFinalizeCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: FinalizeCaseInput) =>
      apiFetch<LegalCase>(`/legal-cases/${id}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.detalle(variables.id) });
    },
  });
}

export interface ChangeCaseStateInput {
  id: string;
  state: string;
}

/** Advisory: legalcase always applies the requested state - withinFlow=false + warnings means it was off the defined flow, never a rejection. */
export interface StateChangeResult {
  id: string;
  currentState: string;
  withinFlow: boolean;
  warnings: string[];
}

export function useChangeCaseState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, state }: ChangeCaseStateInput) =>
      apiFetch<StateChangeResult>(`/legal-cases/${id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ state }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.detalle(variables.id) });
    },
  });
}

export interface UpdateCaseFieldsInput {
  id: string;
  /** Plain scalar fields only (caseType, venueCity, caseMetadata, ...) - see legalcase's PATCHABLE_FIELDS. */
  fields: Partial<Record<'caseType' | 'filingNumber' | 'judicialOfficeId' | 'venueCity' | 'className' | 'evidenceAssessment' | 'legalReasoning' | 'caseMetadata', string>>;
}

/** Generic partial update - merge blob-shaped fields (caseMetadata) with the existing value before calling this. */
export function useUpdateCaseFields() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: UpdateCaseFieldsInput) =>
      apiFetch<LegalCase>(`/legal-cases/${id}/fields`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.detalle(variables.id) });
    },
  });
}

/**
 * Reemplaza los sujetos procesales del expediente. Reemplazo completo, no
 * parche: quien llama tiene la lista entera del trámite que conoce.
 *
 * `case_parties` no es un duplicado de lo que cada feature guarda en
 * `caseMetadata`: es de donde leen Mis procesos para rotular el expediente, el
 * encabezado del fallo cuando la ficha no trae el dato, y el seudonimizador del
 * servicio legal para saber qué nombres tapar antes de que el expediente salga
 * hacia el modelo. Una ficha llena y `case_parties` vacío deja las tres cosas
 * sin datos.
 */
export function useReplaceCaseParties() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, parties }: { id: string; parties: CaseParty[] }) =>
      apiFetch<LegalCase>(`/legal-cases/${id}/parties`, {
        method: 'PUT',
        body: JSON.stringify(parties),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });
      queryClient.invalidateQueries({ queryKey: legalCasesKeys.detalle(variables.id) });
    },
  });
}
