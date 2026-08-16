import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { useAuth } from '@/shared/auth/auth';
import { useWorkspaceContextStore } from '@/store/workspaceContextStore';
import type { StructuredTemplate } from './tipos';
import { queryStringContexto, type ContextoPlantilla } from './queryStringContexto';

export type { ContextoPlantilla };

export const plantillaKeys = {
  porClave: (key: string, contexto: ContextoPlantilla) =>
    ['plantilla', key, contexto.workspaceId, contexto.instanceId, contexto.inspectorId] as const,
};

/**
 * La plantilla vigente para este despacho, resuelta por el backend en cascada
 * inspector → oficina → sistema. Sin `contexto`, toma workspaceId/inspectorId
 * de las mismas fuentes que useTemplateResolution (workspaceContextStore +
 * useAuth) — instanceId reutiliza workspaceId porque el frontend aún no
 * modela una "instancia" separada. `contexto` gana cuando se pasa, para
 * llamadores que ya la resolvieron. El texto jurídico vive en OKF, no aquí.
 */
export function usePlantilla(key: string, contexto?: ContextoPlantilla) {
  const workspaceIdStore = useWorkspaceContextStore((s) => s.context?.workspaceId);
  const inspectorIdStore = useAuth((s) => s.usuario?.id);
  const workspaceId = contexto?.workspaceId ?? workspaceIdStore;
  const resuelto: ContextoPlantilla = {
    workspaceId,
    instanceId: contexto?.instanceId ?? workspaceId,
    inspectorId: contexto?.inspectorId ?? inspectorIdStore,
  };

  return useQuery({
    queryKey: plantillaKeys.porClave(key, resuelto),
    queryFn: () => apiFetch<StructuredTemplate>(`/templates/${key}/plantilla${queryStringContexto(resuelto)}`),
    enabled: Boolean(key),
    staleTime: 5 * 60 * 1000,
  });
}
