/** Coordenadas de la cascada de resolución inspector → oficina → sistema (todas opcionales). */
export interface ContextoPlantilla {
  workspaceId?: string;
  instanceId?: string;
  inspectorId?: string;
}

// Módulo sin dependencias (ni store, ni auth) a propósito: así el test de esta
// función no arrastra sessionStorage/jsdom, que el entorno 'node' de vitest no tiene.
/** Solo los valores presentes; ausentes se omiten (nunca se envía un param vacío). */
export function queryStringContexto(contexto: ContextoPlantilla): string {
  const params = new URLSearchParams();
  if (contexto.workspaceId) params.set('workspaceId', contexto.workspaceId);
  if (contexto.instanceId) params.set('instanceId', contexto.instanceId);
  if (contexto.inspectorId) params.set('inspectorId', contexto.inspectorId);
  const query = params.toString();
  return query ? `?${query}` : '';
}
