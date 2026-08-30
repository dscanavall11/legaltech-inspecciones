import { describe, it, expect } from 'vitest';
import { derivarEstadosFlujo, estadosAlcanzablesDesde, agruparEstadosPorEtapa } from './flujoNavegableEstado';
import { TRANSICIONES_COMPARENDO } from './flujoComparendo';
import { TRANSICIONES_QUERELLA } from './flujoQuerella';
import {
  TODOS_LOS_ESTADOS_COMPARENDO,
  TODOS_LOS_ESTADOS_QUERELLA,
  ETAPA_COMPARENDO_ACTIVA,
  ETAPA_QUERELLA_ACTIVA,
} from './etapas';

describe('derivarEstadosFlujo — nodos del mapa navegable (Task 15/20, con datos reales de comparendo)', () => {
  it('marca el estado actual como actual, incluso si aparece en el historial', () => {
    const mapa = derivarEstadosFlujo(
      TODOS_LOS_ESTADOS_COMPARENDO,
      'en_audiencia',
      ['recibido', 'verificado', 'en_audiencia'],
      TRANSICIONES_COMPARENDO,
      'acta_firmeza',
    );
    expect(mapa.en_audiencia).toBe('actual');
  });

  it('marca como visitados los estados del historial que no son el actual', () => {
    const mapa = derivarEstadosFlujo(
      TODOS_LOS_ESTADOS_COMPARENDO,
      'objetado',
      ['recibido', 'verificado', 'en_espera_objecion'],
      TRANSICIONES_COMPARENDO,
      'acta_firmeza',
    );
    expect(mapa.recibido).toBe('visitado');
    expect(mapa.verificado).toBe('visitado');
    expect(mapa.en_espera_objecion).toBe('visitado');
  });

  it('marca como alcanzables los destinos de las transiciones salientes del estado actual', () => {
    const mapa = derivarEstadosFlujo(
      TODOS_LOS_ESTADOS_COMPARENDO,
      'en_espera_objecion',
      ['recibido', 'verificado'],
      TRANSICIONES_COMPARENDO,
      'acta_firmeza',
    );
    expect(mapa.objetado).toBe('alcanzable');
    expect(mapa.pronto_pago_acordado).toBe('alcanzable');
    expect(mapa.conmutacion_acordada).toBe('alcanzable');
    expect(mapa.sin_objecion).toBe('alcanzable');
  });

  it('el resto queda neutral', () => {
    const mapa = derivarEstadosFlujo(TODOS_LOS_ESTADOS_COMPARENDO, 'recibido', [], TRANSICIONES_COMPARENDO, 'acta_firmeza');
    expect(mapa.en_firmeza).toBe('neutral');
    expect(mapa.archivado).toBe('neutral');
  });

  it('ignora entradas vacías/nulas del historial (datos mock incompletos)', () => {
    const mapa = derivarEstadosFlujo(
      TODOS_LOS_ESTADOS_COMPARENDO,
      'recibido',
      [null, undefined, ''],
      TRANSICIONES_COMPARENDO,
      'acta_firmeza',
    );
    expect(mapa.recibido).toBe('actual');
  });

  it('cubre los 17 EstadoComparendo', () => {
    const mapa = derivarEstadosFlujo(TODOS_LOS_ESTADOS_COMPARENDO, 'recibido', [], TRANSICIONES_COMPARENDO, 'acta_firmeza');
    expect(Object.keys(mapa)).toHaveLength(17);
    expect(TODOS_LOS_ESTADOS_COMPARENDO).toHaveLength(17);
  });
});

describe('estadosAlcanzablesDesde — comparendo', () => {
  it('excluye el destino acta_firmeza (convierte_a, no un EstadoComparendo) — sin_objecion no alcanza ningún estado propio', () => {
    expect(estadosAlcanzablesDesde('sin_objecion', TRANSICIONES_COMPARENDO, 'acta_firmeza').size).toBe(0);
  });

  it('archivado (estado terminal) no alcanza a ningún otro estado', () => {
    expect(estadosAlcanzablesDesde('archivado', TRANSICIONES_COMPARENDO, 'acta_firmeza').size).toBe(0);
  });
});

describe('agruparEstadosPorEtapa — comparendo', () => {
  it('reparte los 17 estados en 6 columnas sin perder ninguno', () => {
    const columnas = agruparEstadosPorEtapa(TODOS_LOS_ESTADOS_COMPARENDO, ETAPA_COMPARENDO_ACTIVA, 6);
    expect(columnas).toHaveLength(6);
    expect(columnas.flat()).toHaveLength(17);
    expect(columnas[0]).toEqual(expect.arrayContaining(['recibido', 'verificado']));
    expect(columnas[5]).toEqual(expect.arrayContaining(['terminado_inactividad', 'archivado']));
  });
});

describe('genérico con datos de querella (Task 20) — prueba que no quedó nada de comparendo hardcodeado', () => {
  it('sin excluirDestino (querella no tiene convierte_a): apelado alcanza confirmado y revocado', () => {
    const alcanzables = estadosAlcanzablesDesde('apelado', TRANSICIONES_QUERELLA);
    expect(alcanzables).toEqual(new Set(['confirmado', 'revocado']));
  });

  it('archivada (terminal de querella) no alcanza ningún otro estado', () => {
    expect(estadosAlcanzablesDesde('archivada', TRANSICIONES_QUERELLA).size).toBe(0);
  });

  it('cubre los 9 EstadoQuerella y agrupa en 5 etapas sin perder ninguno', () => {
    const mapa = derivarEstadosFlujo(TODOS_LOS_ESTADOS_QUERELLA, 'radicada', [], TRANSICIONES_QUERELLA);
    expect(Object.keys(mapa)).toHaveLength(9);

    const columnas = agruparEstadosPorEtapa(TODOS_LOS_ESTADOS_QUERELLA, ETAPA_QUERELLA_ACTIVA, 5);
    expect(columnas).toHaveLength(5);
    expect(columnas.flat()).toHaveLength(9);
  });
});
