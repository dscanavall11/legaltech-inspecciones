import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import type { Fallo } from './types';

export interface FallosPage {
  content: Fallo[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export function getFallos(opts: {
  search?: string;
  page?: number;
  size?: number;
  decision?: string;
} = {}) {
  const params = new URLSearchParams({
    page: String(opts.page ?? 0),
    size: String(opts.size ?? 20),
  });
  if (opts.search) params.set('search', opts.search);
  if (opts.decision) params.set('decision', opts.decision);
  return apiFetch<FallosPage>(`/fallos?${params}`);
}

export function getFalloPorId(id: string) {
  return apiFetch<Fallo>(`/fallos/${id}`);
}

export function useFallos(opts: { search?: string; decision?: string } = {}) {
  return useQuery({
    queryKey: ['fallos', opts],
    queryFn: () => getFallos(opts),
  });
}

export function useFallo(id: string) {
  return useQuery({
    queryKey: ['fallos', id],
    queryFn: () => getFalloPorId(id),
    enabled: !!id,
  });
}
