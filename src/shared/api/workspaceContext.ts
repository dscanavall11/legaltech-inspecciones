import { apiFetch } from './client';

export interface WorkspaceContext {
  workspaceId: string;
  brainId: string;
  displayName: string;
  contextId: string;
}

/** Microsite demo por defecto cuando el host no es una microsite real (localhost, túnel). */
const MICROSITE_DEMO = 'inspeccionconvivenciaypaz.legaltech.com.co';

/** Solo los subdominios .legaltech.com.co mapean a un workspace; el resto (localhost, *.trycloudflare.com) no. */
function esMicrositeReal(host: string): boolean {
  return host.endsWith('.legaltech.com.co');
}

/**
 * Microsite bootstrap: resuelve el workspace a partir del hostname una sola
 * vez al arrancar (demo: inspeccionconvivenciaypaz.legaltech.com.co) contra
 * el orchestrator (BFF). Si el subdominio no matchea ningun workspace, o el
 * backend no responde, la app arranca igual, sin workspace.
 */
export async function resolveWorkspaceContext(): Promise<WorkspaceContext | null> {
  // Prioridad: VITE_WORKSPACE_HOST (override explícito) > host real .legaltech.com.co
  // > microsite demo. Así el contexto (OKF de Legal) carga también sobre localhost
  // y túneles trycloudflare, donde el hostname no mapea a ningún workspace.
  const host =
    import.meta.env.VITE_WORKSPACE_HOST ??
    (esMicrositeReal(window.location.hostname) ? window.location.hostname : MICROSITE_DEMO);
  try {
    return await apiFetch<WorkspaceContext>(
      `/workspace-context?host=${encodeURIComponent(host)}`,
    );
  } catch {
    return null;
  }
}
