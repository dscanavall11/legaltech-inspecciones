import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import type { Queja, QuejaDetalle, CategoriaQueja } from './types';

export function useQuejas() {
  return useQuery<Queja[]>({
    queryKey: ['quejas'],
    queryFn: () => apiFetch('/quejas'),
  });
}

export function useQueja(id: string) {
  return useQuery<QuejaDetalle>({
    queryKey: ['quejas', id],
    queryFn: () => apiFetch(`/quejas/${id}`),
    enabled: !!id,
  });
}

export interface NuevaQueja {
  quejoso: string;
  acusado: string;
  asunto: string;
  categoria: CategoriaQueja;
  descripcionHechos: string;
  diasTermino?: number;
}

export function useCrearQueja() {
  const qc = useQueryClient();
  return useMutation<Queja, Error, NuevaQueja>({
    mutationFn: (data) =>
      apiFetch('/quejas', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quejas'] }),
  });
}
