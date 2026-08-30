import { create } from 'zustand';
import type { WorkspaceContext } from '@/shared/api/workspaceContext';

/**
 * Contexto del workspace resuelto una sola vez al arrancar (ver
 * src/main.tsx), a partir del subdominio de la microsite. Sin `persist`:
 * se re-resuelve en cada carga, ya que depende del host actual.
 */
interface WorkspaceContextState {
  context: WorkspaceContext | null;
  setContext: (context: WorkspaceContext | null) => void;
}

export const useWorkspaceContextStore = create<WorkspaceContextState>()((set) => ({
  context: null,
  setContext: (context) => set({ context }),
}));
