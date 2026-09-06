import dayjs, { type Dayjs } from 'dayjs';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { definicionDe, estaFinalizado, ESTADOS_POST_FALLO, type FilaProceso } from '@/shared/procesos/types';

/**
 * Lo que el home puede afirmar con los datos que hay: término vencido, término
 * por vencer e inactividad. Nada más — cualquier otra "categoría de atención"
 * exigiría datos que /legal-cases no expone hoy.
 */

/** Umbral de alerta del término, en días hábiles. */
export const DIAS_ALERTA = 5;
/** Un expediente abierto sin cambio de estado en este tiempo (días corridos) se considera estancado. */
export const DIAS_INACTIVIDAD = 30;

export interface CasoConTermino {
  id: string;
  radicado: string;
  asunto: string;
  estado: string;
  ruta: string;
  diasRestantes: number;
  vencido: boolean;
  /** El término salió del default del tipo, no de la metadata del expediente. */
  presuntivo: boolean;
}

export interface CasoInactivo {
  id: string;
  radicado: string;
  asunto: string;
  estado: string;
  ruta: string;
  diasSinMovimiento: number;
}

// Igual que esCerrado en BandejaProcesos: dos catálogos independientes, ninguno sustituye al otro.
const abierto = (p: FilaProceso) => !estaFinalizado(p.estado) && !ESTADOS_POST_FALLO.includes(p.estado);
const rutaDe = (p: FilaProceso) => definicionDe(p.tipo)?.ruta?.(p.id) ?? '/panel/procesos';

/** Expedientes abiertos con término calculable, vencidos primero y luego por urgencia. */
export function terminosEnRiesgo(
  procesos: FilaProceso[],
  hoy: Dayjs = dayjs(),
  diasAlerta = DIAS_ALERTA,
): CasoConTermino[] {
  return procesos
    .filter((p) => abierto(p) && p.diasTermino !== undefined && p.fechaRadicacion !== '')
    .map((p) => {
      const termino = calcularTermino(dayjs(p.fechaRadicacion), p.diasTermino as number, hoy);
      return {
        id: p.id,
        radicado: p.radicado,
        asunto: p.asunto,
        estado: p.estado,
        ruta: rutaDe(p),
        diasRestantes: termino.diasRestantes,
        vencido: termino.vencido,
        presuntivo: p.diasTerminoPresuntivo,
      };
    })
    .filter((c) => c.vencido || c.diasRestantes <= diasAlerta)
    .sort((a, b) => Number(b.vencido) - Number(a.vencido) || a.diasRestantes - b.diasRestantes);
}

/** Expedientes abiertos sin cambio de estado desde hace más de `dias`, el más quieto primero. */
export function sinMovimiento(
  procesos: FilaProceso[],
  hoy: Dayjs = dayjs(),
  dias = DIAS_INACTIVIDAD,
): CasoInactivo[] {
  return procesos
    .filter((p) => abierto(p) && p.fechaUltimoMovimiento !== '')
    .map((p) => ({
      id: p.id,
      radicado: p.radicado,
      asunto: p.asunto,
      estado: p.estado,
      ruta: rutaDe(p),
      diasSinMovimiento: hoy.diff(dayjs(p.fechaUltimoMovimiento), 'day'),
    }))
    .filter((c) => c.diasSinMovimiento > dias)
    .sort((a, b) => b.diasSinMovimiento - a.diasSinMovimiento);
}
