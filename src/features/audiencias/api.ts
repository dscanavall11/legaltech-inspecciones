import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';

export interface Audiencia {
  id: string;
  querellaId: string;
  radicado: string;
  fecha: string; // ISO datetime
  asunto: string;
  querellante: string;
  querellado: string;
}

export function useAudiencias() {
  return useQuery({
    queryKey: ['audiencias'],
    queryFn: () => apiFetch<Audiencia[]>('/audiencias'),
  });
}
