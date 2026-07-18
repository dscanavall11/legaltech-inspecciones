import { describe, it, expect, beforeEach } from 'vitest';
import { useOverlayStore } from './overlayStore';

describe('useOverlayStore', () => {
  beforeEach(() => {
    useOverlayStore.setState({ aiAssistantAbierto: false, configAssistantAbierto: false });
  });

  it('arranca cerrado', () => {
    expect(useOverlayStore.getState().aiAssistantAbierto).toBe(false);
    expect(useOverlayStore.getState().configAssistantAbierto).toBe(false);
  });

  it('abre y cierra el asistente IA sin afectar al de configuracion', () => {
    useOverlayStore.getState().abrirAiAssistant();
    expect(useOverlayStore.getState().aiAssistantAbierto).toBe(true);
    expect(useOverlayStore.getState().configAssistantAbierto).toBe(false);

    useOverlayStore.getState().cerrarAiAssistant();
    expect(useOverlayStore.getState().aiAssistantAbierto).toBe(false);
  });

  it('abre y cierra el asistente de configuracion sin afectar al de IA', () => {
    useOverlayStore.getState().abrirConfigAssistant();
    expect(useOverlayStore.getState().configAssistantAbierto).toBe(true);
    expect(useOverlayStore.getState().aiAssistantAbierto).toBe(false);

    useOverlayStore.getState().cerrarConfigAssistant();
    expect(useOverlayStore.getState().configAssistantAbierto).toBe(false);
  });
});
