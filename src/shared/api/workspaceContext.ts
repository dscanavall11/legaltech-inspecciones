import { apiFetch } from './client';

export interface WorkspaceContext {
  workspaceId: string;
  brainId: string;
  displayName: string;
  contextId: string;
}

/**
 * Microsite bootstrap: resuelve el workspace a partir del hostname una sola
 * vez al arrancar (demo: inspeccionconvivenciaypaz.legaltech.com.co) contra
 * el orchestrator (BFF). Si el subdominio no matchea ningun workspace, o el
 * backend no responde, la app arranca igual, sin workspace.
 */
export async function resolveWorkspaceContext(): Promise<WorkspaceContext | null> {
  try {
    return await apiFetch<WorkspaceContext>(
      `/workspace-context?host=${encodeURIComponent(window.location.hostname)}`,
    );
  } catch {
    return null;
  }
}
