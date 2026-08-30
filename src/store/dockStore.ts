import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DockState {
  colapsado: boolean;
  toggle: () => void;
  setColapsado: (v: boolean) => void;
}

export const useDockStore = create<DockState>()(
  persist(
    (set) => ({
      colapsado: false,
      toggle: () => set((s) => ({ colapsado: !s.colapsado })),
      setColapsado: (v) => set({ colapsado: v }),
    }),
    { name: 'legaltech-dock' },
  ),
);
