import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { parseChecklistYaml, type ChecklistItemOkf } from './checklistDespacho';

export const CHECKLIST_DESPACHO_CONCEPT_ID = 'inspector-policia-checklist-configuracion-despacho';

/**
 * Espejo mínimo de KnowledgeNodeEntity (legalcase) — solo los campos que esta
 * página consume. El body del checklist viaja como YAML crudo en `documentBody`.
 */
interface KnowledgeNodeDTO {
  conceptId: string;
  title: string;
  documentBody: string | null;
}

/** Checklist "Configuración del despacho", leído del nodo OKF sincronizado en legalcase — nunca hardcodeado. */
export function useChecklistDespacho() {
  return useQuery({
    queryKey: ['knowledge-node', CHECKLIST_DESPACHO_CONCEPT_ID],
    queryFn: async () => {
      const nodo = await apiFetch<KnowledgeNodeDTO>(`/knowledge-nodes/${CHECKLIST_DESPACHO_CONCEPT_ID}`);
      const items: ChecklistItemOkf[] = parseChecklistYaml(nodo.documentBody ?? '');
      return { titulo: nodo.title, items };
    },
    staleTime: 5 * 60_000,
  });
}
