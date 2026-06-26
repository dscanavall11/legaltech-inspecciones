import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Escala de fuente global. Pensado para inspectores de edad avanzada:
 * un control siempre visible (A / A+ / A++) que agranda toda la interfaz.
 */
export type FontScale = 'normal' | 'large' | 'xlarge';

export const FONT_SCALE_VALUES: Record<FontScale, number> = {
  normal: 13,
  large: 15,
  xlarge: 17,
};

interface SettingsState {
  fontScale: FontScale;
  highContrast: boolean;
  setFontScale: (scale: FontScale) => void;
  toggleHighContrast: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontScale: 'normal',
      highContrast: false,
      setFontScale: (fontScale) => set({ fontScale }),
      toggleHighContrast: () =>
        set((state) => ({ highContrast: !state.highContrast })),
    }),
    { name: 'legaltech-settings' },
  ),
);
