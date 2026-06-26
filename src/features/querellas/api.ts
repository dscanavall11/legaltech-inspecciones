import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import type { Querella, QuerellaDetalle } from './types';

export interface NuevaQuerella {
  querellante: string;
  querellado: string;
  asunto: string;
  direccionInmueble?: string;
  diasTermino: number;
}

/** Claves de query centralizadas para invalidación consistente. */
export const querellasKeys = {
  all: ['querellas'] as const,
  lista: () => [...querellasKeys.all, 'lista'] as const,
  detalle: (id: string) => [...querellasKeys.all, 'detalle', id] as const,
};

export function useQuerellas() {
  return useQuery({
    queryKey: querellasKeys.lista(),
    queryFn: () => apiFetch<Querella[]>('/querellas'),
  });
}

export function useQuerella(id: string) {
  return useQuery({
    queryKey: querellasKeys.detalle(id),
    queryFn: () => apiFetch<QuerellaDetalle>(`/querellas/${id}`),
    enabled: Boolean(id),
  });
}

export function useCrearQuerella() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NuevaQuerella) =>
      apiFetch<Querella>('/querellas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: querellasKeys.lista() });
    },
  });
}
