import { create } from 'zustand';

interface OverlayState {
  aiAssistantAbierto: boolean;
  configAssistantAbierto: boolean;
  abrirAiAssistant: () => void;
  cerrarAiAssistant: () => void;
  abrirConfigAssistant: () => void;
  cerrarConfigAssistant: () => void;
}

export const useOverlayStore = create<OverlayState>()((set) => ({
  aiAssistantAbierto: false,
  configAssistantAbierto: false,
  abrirAiAssistant: () => set({ aiAssistantAbierto: true }),
  cerrarAiAssistant: () => set({ aiAssistantAbierto: false }),
  abrirConfigAssistant: () => set({ configAssistantAbierto: true }),
  cerrarConfigAssistant: () => set({ configAssistantAbierto: false }),
}));
