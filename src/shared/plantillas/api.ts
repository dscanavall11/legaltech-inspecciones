import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import type { StructuredTemplate } from './tipos';

export const plantillaKeys = {
  porClave: (key: string) => ['plantilla', key] as const,
};

/** La plantilla vigente para este despacho. El texto jurídico vive en OKF, no aquí. */
export function usePlantilla(key: string) {
  return useQuery({
    queryKey: plantillaKeys.porClave(key),
    queryFn: () => apiFetch<StructuredTemplate>(`/templates/${key}/plantilla`),
    enabled: Boolean(key),
    staleTime: 5 * 60 * 1000,
  });
}
