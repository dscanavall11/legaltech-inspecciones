import dayjs, { type Dayjs } from 'dayjs';
import {
  ETAPA_COMPARENDO_ACTIVA,
  ETAPA_QUEJA_ACTIVA,
  ETAPA_QUERELLA_ACTIVA,
  TERMINOS_COMPARENDO,
  siguientePaso,
  siguientePasoComparendo,
  siguientePasoQueja,
  type EstadoComparendo,
} from '@/derecho';
import { sumarDiasHabiles } from '@/shared/terminos/diasHabiles';
import type { FilaProceso } from '@/shared/procesos/types';
import type { EstadoQuerella } from '@/features/querellas/types';
import type { EstadoQueja } from '@/features/quejas/types';

/**
 * Lo que el asistente propone hacer con el caso abierto y para cuándo: la
 * actuación siguiente sale de la máquina de estados que ya vive en @/derecho,
 * y la fecha de sumar en días hábiles el término que el dominio conoce para
 * esa etapa. Si no hay término, se propone la actuación sin fecha — no se
 * inventa un plazo.
 *
 * La fecha que el inspector acepta se guarda SOLO en este navegador: no toca
 * el expediente, no notifica a nadie y no programa nada.
 */

export interface ActuacionSugerida {
  /** Acción primaria de la etapa, con el label del propio flujo. */
  accion: string;
  /** Guía procesal de la etapa, tal como la redacta @/derecho. */
  mensaje: string;
  dias: number | null;
  fuenteDias: string | null;
  /** ISO (AAAA-MM-DD), o null si la etapa no tiene término conocido. */
  fecha: string | null;
}

interface Paso {
  mensaje: string;
  acciones: ReadonlyArray<{ label: string; primaria: boolean }>;
  terminal: boolean;
}

function pasoDe(caso: FilaProceso): Paso | null {
  if (caso.tipo === 'querella' && caso.estado in ETAPA_QUERELLA_ACTIVA) {
    return siguientePaso(caso.estado as EstadoQuerella);
  }
  if (caso.tipo === 'queja' && caso.estado in ETAPA_QUEJA_ACTIVA) {
    return siguientePasoQueja(caso.estado as EstadoQueja);
  }
  if (caso.tipo === 'comparendo' && caso.estado in ETAPA_COMPARENDO_ACTIVA) {
    return siguientePasoComparendo(caso.estado as EstadoComparendo);
  }
  return null;
}

/** El término que el dominio ya conoce para la etapa en la que va el caso. */
function terminoDe(caso: FilaProceso): { dias: number; fuente: string } | null {
  if (caso.tipo === 'comparendo') {
    const etapa = ETAPA_COMPARENDO_ACTIVA[caso.estado as EstadoComparendo];
    if (etapa === 0) {
      return {
        dias: TERMINOS_COMPARENDO.objecionDias,
        fuente: `art. 223A lit. b), Ley 1801 de 2016: ${TERMINOS_COMPARENDO.objecionDias} días hábiles para objetar`,
      };
    }
    if (etapa === 1) {
      return {
        dias: TERMINOS_COMPARENDO.firmezaDias,
        fuente: `art. 223A lit. e) y art. 180 par.: ${TERMINOS_COMPARENDO.firmezaDias} días hábiles`,
      };
    }
  }
  if (caso.diasTermino === undefined) return null;
  return {
    dias: caso.diasTermino,
    fuente: caso.diasTerminoPresuntivo
      ? 'término por defecto del tipo de proceso: el expediente no trae diasTermino'
      : 'término registrado en el expediente',
  };
}

export function sugerirActuacion(caso: FilaProceso, hoy: Dayjs = dayjs()): ActuacionSugerida | null {
  const paso = pasoDe(caso);
  if (!paso || paso.terminal) return null;
  const accion = paso.acciones.find((a) => a.primaria) ?? paso.acciones[0];
  if (!accion) return null;

  const termino = terminoDe(caso);
  return {
    accion: accion.label,
    mensaje: paso.mensaje,
    dias: termino?.dias ?? null,
    fuenteDias: termino?.fuente ?? null,
    fecha: termino ? sumarDiasHabiles(hoy, termino.dias).format('YYYY-MM-DD') : null,
  };
}

// ─── Fecha acordada, guardada solo en este navegador ────────────────────────

const CLAVE = 'asistente.fechas';

export interface FechaAcordada {
  accion: string;
  /** ISO (AAAA-MM-DD). */
  fecha: string;
  /** Cuándo se anotó, para poder decirlo en la interfaz. */
  anotadaEn: string;
}

function leerTodas(): Record<string, FechaAcordada> {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(CLAVE) ?? '{}') as Record<string, FechaAcordada>;
  } catch {
    return {};
  }
}

export function leerFecha(caseId: string): FechaAcordada | null {
  return leerTodas()[caseId] ?? null;
}

export function guardarFecha(caseId: string, fecha: FechaAcordada): void {
  globalThis.localStorage?.setItem(CLAVE, JSON.stringify({ ...leerTodas(), [caseId]: fecha }));
}

export function olvidarFecha(caseId: string): void {
  const todas = leerTodas();
  delete todas[caseId];
  globalThis.localStorage?.setItem(CLAVE, JSON.stringify(todas));
}

export function yaPaso(fecha: FechaAcordada, hoy: Dayjs = dayjs()): boolean {
  return hoy.isAfter(dayjs(fecha.fecha), 'day');
}
