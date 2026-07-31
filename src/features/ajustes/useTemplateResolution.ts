import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { useWorkspaceContextStore } from '@/store/workspaceContextStore';
import { useAuth } from '@/shared/auth/auth';

export type NivelResolucionPlantilla = 'sistema' | 'oficina' | 'inspector';

/** Espejo de TemplateResolution (legalcase, Task 7) — cascada inspector → oficina → sistema. */
export interface TemplateResolution {
  documentKey: string;
  resolvedConceptId: string;
  resolvedSourceKey: string;
  level: NivelResolucionPlantilla;
}

/**
 * Resolución de plantillas del despacho (GET /template-resolution). No se
 * condiciona a que workspaceId ya esté resuelto: bajo mocks/localhost la
 * microsite del subdominio no siempre resuelve (ver resolveWorkspaceContext),
 * y los 3 parámetros son opcionales en el backend real — se envían los que
 * haya disponibles.
 *
 * `instanceId`: el frontend todavía no modela una "instancia" del despacho
 * distinta del workspace — se reutiliza workspaceId hasta que exista ese
 * concepto propio.
 */
export function useTemplateResolution() {
  const workspaceId = useWorkspaceContextStore((s) => s.context?.workspaceId);
  const inspectorId = useAuth((s) => s.usuario?.id);
  const instanceId = workspaceId;

  return useQuery({
    queryKey: ['template-resolution', workspaceId, instanceId, inspectorId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (workspaceId) params.set('workspaceId', workspaceId);
      if (instanceId) params.set('instanceId', instanceId);
      if (inspectorId) params.set('inspectorId', inspectorId);
      const query = params.toString();
      return apiFetch<TemplateResolution[]>(`/template-resolution${query ? `?${query}` : ''}`);
    },
    staleTime: 60_000,
  });
}
