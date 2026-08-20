import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { COMPARENDOS_DEMO, type Comparendo } from '@/features/actas/comparendos';

interface ComparendosState {
  comparendos: Comparendo[];
  /** Cuándo se cargó la BD (ISO). Sirve para decir en pantalla si está vieja. */
  cargadaEn: string | null;
  cargar: (comparendos: Comparendo[]) => void;
}

/**
 * La base de comparendos del despacho, una sola vez para toda la app.
 *
 * Vivía en un `useState` dentro de Actas de firmeza y otro dentro de Acogida:
 * dos copias, y las dos se perdían al cambiar de pantalla. El inspector cargaba
 * el .xlsx del RNMC, se iba a la queja y allí no existía. Al persistirla, un
 * comparendo ya conocido llena la ficha sin leer un solo PDF.
 */
export const useComparendosStore = create<ComparendosState>()(
  persist(
    (set) => ({
      comparendos: COMPARENDOS_DEMO,
      cargadaEn: null,
      cargar: (comparendos) => set({ comparendos, cargadaEn: new Date().toISOString() }),
    }),
    { name: 'bd-comparendos' },
  ),
);

const soloDigitos = (v: string) => v.replace(/\D/g, '');

/**
 * Busca el comparendo en la BD cargada. Compara solo los dígitos porque el
 * mismo número se escribe con y sin guiones según de dónde salga: el PDF del
 * portal lo trae como 17-001-6-2026-1234 y la hoja de cálculo, a veces, sin
 * separadores.
 */
export function buscarEnBd(numero: string | undefined): Comparendo | undefined {
  const buscado = soloDigitos(numero ?? '');
  if (buscado.length < 6) return undefined;
  return useComparendosStore
    .getState()
    .comparendos.find((c) => soloDigitos(c.comparendo) === buscado);
}
