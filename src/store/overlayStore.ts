import { create } from 'zustand';

export interface ContextoCaso {
  tipo: string;
  id: string;
  radicado: string;
}

interface OverlayState {
  aiAssistantAbierto: boolean;
  aiAssistantContexto: ContextoCaso | null;
  configAssistantAbierto: boolean;
  agendaAbierta: boolean;
  abrirAiAssistant: (contexto?: ContextoCaso) => void;
  cerrarAiAssistant: () => void;
  abrirConfigAssistant: () => void;
  cerrarConfigAssistant: () => void;
  abrirAgenda: () => void;
  cerrarAgenda: () => void;
}

export const useOverlayStore = create<OverlayState>()((set) => ({
  aiAssistantAbierto: false,
  aiAssistantContexto: null,
  configAssistantAbierto: false,
  agendaAbierta: false,
  abrirAiAssistant: (contexto) => set({ aiAssistantAbierto: true, aiAssistantContexto: contexto ?? null }),
  cerrarAiAssistant: () => set({ aiAssistantAbierto: false }),
  abrirConfigAssistant: () => set({ configAssistantAbierto: true }),
  cerrarConfigAssistant: () => set({ configAssistantAbierto: false }),
  abrirAgenda: () => set({ agendaAbierta: true }),
  cerrarAgenda: () => set({ agendaAbierta: false }),
}));
