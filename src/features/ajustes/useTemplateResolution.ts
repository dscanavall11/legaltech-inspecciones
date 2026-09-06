import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

/** workspaceId/instanceId/inspectorId built the same way as useTemplateResolution, so both hooks target the same coordinates. */
function useInspectorTemplateContext() {
  const workspaceId = useWorkspaceContextStore((s) => s.context?.workspaceId);
  const inspectorId = useAuth((s) => s.usuario?.id);
  const instanceId = workspaceId;
  return { workspaceId, instanceId, inspectorId };
}

function inspectorTemplateQuery(workspaceId?: string, instanceId?: string, inspectorId?: string) {
  const params = new URLSearchParams();
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (instanceId) params.set('instanceId', instanceId);
  if (inspectorId) params.set('inspectorId', inspectorId);
  return params.toString();
}

export interface UpsertInspectorTemplateInput {
  documentKey: string;
  content: string;
  title?: string;
}

/** PUT /inspector-templates/{documentKey} — sube la plantilla propia del inspector (v1: solo texto plano/markdown/YAML). */
export function useUpsertInspectorTemplate() {
  const { workspaceId, instanceId, inspectorId } = useInspectorTemplateContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentKey, content, title }: UpsertInspectorTemplateInput) =>
      apiFetch<unknown>(
        `/inspector-templates/${documentKey}?${inspectorTemplateQuery(workspaceId, instanceId, inspectorId)}`,
        { method: 'PUT', body: JSON.stringify({ content, title }) },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-resolution'] });
    },
  });
}

/** DELETE /inspector-templates/{documentKey} — restaura la plantilla de oficina/sistema quitando la del inspector. */
export function useDeleteInspectorTemplate() {
  const { workspaceId, instanceId, inspectorId } = useInspectorTemplateContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentKey: string) =>
      apiFetch<unknown>(
        `/inspector-templates/${documentKey}?${inspectorTemplateQuery(workspaceId, instanceId, inspectorId)}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-resolution'] });
    },
  });
}
