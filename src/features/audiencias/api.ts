import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { querellasKeys } from '@/features/querellas/api';

export interface Audiencia {
  id: string;
  querellaId: string;
  radicado: string;
  fecha: string; // ISO datetime
  asunto: string;
  querellante: string;
  querellado: string;
}

export const audienciasKeys = {
  all: ['audiencias'] as const,
  lista: () => [...audienciasKeys.all, 'lista'] as const,
};

export function useAudiencias() {
  return useQuery({
    queryKey: audienciasKeys.lista(),
    queryFn: () => apiFetch<Audiencia[]>('/audiencias'),
  });
}

export interface ProgramarAudiencia {
  querellaId: string;
  fecha: string; // ISO datetime
}

/** Asigna fecha de audiencia a un caso que aún no la tiene. */
export function useProgramarAudiencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProgramarAudiencia) =>
      apiFetch<Audiencia>('/audiencias', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: audienciasKeys.lista() });
      queryClient.invalidateQueries({ queryKey: querellasKeys.lista() });
    },
  });
}
