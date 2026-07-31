import { describe, it, expect } from 'vitest';
import {
  derivarEstadosFlujo,
  estadosAlcanzablesDesde,
  agruparEstadosPorEtapa,
  TODOS_LOS_ESTADOS_COMPARENDO,
} from './flujoNavegableEstado';

describe('derivarEstadosFlujo — nodos del mapa navegable (Task 15)', () => {
  it('marca el estado actual como actual, incluso si aparece en el historial', () => {
    const mapa = derivarEstadosFlujo('en_audiencia', ['recibido', 'verificado', 'en_audiencia']);
    expect(mapa.en_audiencia).toBe('actual');
  });

  it('marca como visitados los estados del historial que no son el actual', () => {
    const mapa = derivarEstadosFlujo('objetado', ['recibido', 'verificado', 'en_espera_objecion']);
    expect(mapa.recibido).toBe('visitado');
    expect(mapa.verificado).toBe('visitado');
    expect(mapa.en_espera_objecion).toBe('visitado');
  });

  it('marca como alcanzables los destinos de las transiciones salientes del estado actual', () => {
    const mapa = derivarEstadosFlujo('en_espera_objecion', ['recibido', 'verificado']);
    expect(mapa.objetado).toBe('alcanzable');
    expect(mapa.pronto_pago_acordado).toBe('alcanzable');
    expect(mapa.conmutacion_acordada).toBe('alcanzable');
    expect(mapa.sin_objecion).toBe('alcanzable');
  });

  it('el resto queda neutral', () => {
    const mapa = derivarEstadosFlujo('recibido', []);
    expect(mapa.en_firmeza).toBe('neutral');
    expect(mapa.archivado).toBe('neutral');
  });

  it('ignora entradas vacías/nulas del historial (datos mock incompletos)', () => {
    const mapa = derivarEstadosFlujo('recibido', [null, undefined, '']);
    expect(mapa.recibido).toBe('actual');
  });

  it('cubre los 17 EstadoComparendo', () => {
    const mapa = derivarEstadosFlujo('recibido', []);
    expect(Object.keys(mapa)).toHaveLength(17);
    expect(TODOS_LOS_ESTADOS_COMPARENDO).toHaveLength(17);
  });
});

describe('estadosAlcanzablesDesde', () => {
  it('excluye el destino acta_firmeza (convierte_a, no un EstadoComparendo) — sin_objecion no alcanza ningún estado propio', () => {
    // La única transición desde sin_objecion en el YAML es generar_acta_firmeza -> acta_firmeza (convierte_a).
    expect(estadosAlcanzablesDesde('sin_objecion').size).toBe(0);
  });

  it('archivado (estado terminal) no alcanza a ningún otro estado', () => {
    expect(estadosAlcanzablesDesde('archivado').size).toBe(0);
  });
});

describe('agruparEstadosPorEtapa', () => {
  it('reparte los 17 estados en 6 columnas (ETAPAS_COMPARENDO) sin perder ninguno', () => {
    const columnas = agruparEstadosPorEtapa(6);
    expect(columnas).toHaveLength(6);
    expect(columnas.flat()).toHaveLength(17);
    expect(columnas[0]).toEqual(expect.arrayContaining(['recibido', 'verificado']));
    expect(columnas[5]).toEqual(expect.arrayContaining(['terminado_inactividad', 'archivado']));
  });
});
