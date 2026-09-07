import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { COMPARENDOS_DEMO, type Comparendo } from '@/features/actas/comparendos';

export type EstadoCargaComparendos = 'ACTIVA' | 'REEMPLAZADA' | 'FALLIDA';

export interface CargaComparendosHistorial {
  nombreArchivo: string;
  fechaHora: string; // ISO
  usuario: string;
  numeroRegistros: number;
  estado: EstadoCargaComparendos;
  /** Solo si estado === 'FALLIDA'. */
  motivo?: string;
}

interface ComparendosState {
  comparendos: Comparendo[];
  /** Cuándo se cargó la BD activa (ISO). Sirve para decir en pantalla si está vieja. */
  cargadaEn: string | null;
  /** Nombre del archivo activo, o la etiqueta de la BD de demostración por defecto. */
  archivoActivo: string;
  /** Auditoría mínima: no se conservan los datos de las bases reemplazadas, solo estos metadatos. */
  historialCargas: CargaComparendosHistorial[];
  /**
   * Reemplaza COMPLETAMENTE la base activa — nunca acumula con la anterior.
   * Se llama solo después de validar el archivo nuevo y de que el inspector
   * confirme explícitamente (ver `CargarBaseComparendosButton`); nunca se
   * invoca "en caliente" antes de esa confirmación, así que si la validación
   * falla o el inspector cancela, la base activa nunca se toca.
   */
  cargar: (comparendos: Comparendo[], nombreArchivo: string, usuario: string) => void;
  /** Deja constancia de un intento de carga que no llegó a reemplazar nada (la base activa queda intacta). */
  registrarCargaFallida: (nombreArchivo: string, usuario: string, motivo: string) => void;
}

const ETIQUETA_DEMO = 'BD de demostración';

/**
 * La base de comparendos del despacho, una sola vez para toda la app.
 *
 * Vivía en un `useState` dentro de Actas de firmeza y otro dentro de Acogida:
 * dos copias, y las dos se perdían al cambiar de pantalla. El inspector cargaba
 * el .xlsx del RNMC, se iba a la queja y allí no existía. Al persistirla, un
 * comparendo ya conocido llena la ficha sin leer un solo PDF.
 *
 * `cargar` reemplaza el array completo (nunca acumula) y lleva un historial
 * mínimo de auditoría — nombre de archivo, fecha, usuario, cantidad de
 * registros y estado — sin conservar los datos de las bases reemplazadas.
 */
export const useComparendosStore = create<ComparendosState>()(
  persist(
    (set, get) => ({
      comparendos: COMPARENDOS_DEMO,
      cargadaEn: null,
      archivoActivo: ETIQUETA_DEMO,
      historialCargas: [],
      cargar: (comparendos, nombreArchivo, usuario) => {
        const historialPrevio = get().historialCargas.map((h) =>
          h.estado === 'ACTIVA' ? { ...h, estado: 'REEMPLAZADA' as const } : h,
        );
        const nuevaEntrada: CargaComparendosHistorial = {
          nombreArchivo,
          fechaHora: new Date().toISOString(),
          usuario,
          numeroRegistros: comparendos.length,
          estado: 'ACTIVA',
        };
        set({
          comparendos,
          cargadaEn: nuevaEntrada.fechaHora,
          archivoActivo: nombreArchivo,
          historialCargas: [...historialPrevio, nuevaEntrada],
        });
      },
      registrarCargaFallida: (nombreArchivo, usuario, motivo) => {
        set({
          historialCargas: [
            ...get().historialCargas,
            {
              nombreArchivo,
              fechaHora: new Date().toISOString(),
              usuario,
              numeroRegistros: 0,
              estado: 'FALLIDA',
              motivo,
            },
          ],
        });
      },
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
