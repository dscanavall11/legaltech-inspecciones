import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { terminosEnRiesgo, sinMovimiento } from './atencion';
import type { FilaProceso } from '@/shared/procesos/types';

const HOY = dayjs('2026-08-13'); // jueves

function fila(over: Partial<FilaProceso> = {}): FilaProceso {
  return {
    id: 'c1',
    tipo: 'querella',
    radicado: '2026-0001',
    parteA: 'A',
    parteB: 'B',
    asunto: 'Ruido',
    estado: 'ACTIVO',
    fechaRadicacion: '2026-08-12',
    fechaUltimoMovimiento: '2026-08-12',
    diasTermino: 15,
    diasTerminoPresuntivo: true,
    tieneFallo: false,
    ...over,
  };
}

describe('terminosEnRiesgo', () => {
  it('deja fuera lo que todavía tiene margen y ordena vencidos primero', () => {
    const holgado = fila({ id: 'holgado' });
    const urgente = fila({ id: 'urgente', fechaRadicacion: '2026-07-27', diasTermino: 15 });
    const vencido = fila({ id: 'vencido', fechaRadicacion: '2026-06-01', diasTermino: 3 });

    const riesgo = terminosEnRiesgo([holgado, urgente, vencido], HOY);
    expect(riesgo.map((c) => c.id)).toEqual(['vencido', 'urgente']);
    expect(riesgo[0].vencido).toBe(true);
  });

  it('ignora expedientes cerrados y los que no tienen término calculable', () => {
    const cerrado = fila({ id: 'cerrado', estado: 'FINALIZADO', fechaRadicacion: '2026-06-01' });
    const sinTermino = fila({ id: 'sin-termino', tipo: 'comparendo', diasTermino: undefined });
    expect(terminosEnRiesgo([cerrado, sinTermino], HOY)).toEqual([]);
  });
});

describe('sinMovimiento', () => {
  it('solo reporta expedientes abiertos quietos más de 30 días, el más quieto primero', () => {
    const quieto = fila({ id: 'quieto', fechaUltimoMovimiento: '2026-05-01' });
    const tibio = fila({ id: 'tibio', fechaUltimoMovimiento: '2026-06-20' });
    const reciente = fila({ id: 'reciente', fechaUltimoMovimiento: '2026-08-10' });
    const cerrado = fila({ id: 'cerrado', estado: 'FINALIZADO', fechaUltimoMovimiento: '2026-01-01' });

    const inactivos = sinMovimiento([tibio, quieto, reciente, cerrado], HOY);
    expect(inactivos.map((c) => c.id)).toEqual(['quieto', 'tibio']);
    expect(inactivos[0].diasSinMovimiento).toBe(104);
  });
});
