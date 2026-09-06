import { beforeEach, describe, expect, it } from 'vitest';
import { buscarEnBd, useComparendosStore } from './store';
import type { Comparendo } from '@/features/actas/comparendos';

const registro = (comparendo: string): Comparendo =>
  ({ comparendo, solicitado: 'ALGUIEN', cedula: '1' }) as Comparendo;

beforeEach(() => {
  useComparendosStore.getState().cargar([registro('17-001-6-2026-1234')]);
});

describe('buscarEnBd', () => {
  it('encuentra el comparendo por su número', () => {
    expect(buscarEnBd('17-001-6-2026-1234')?.solicitado).toBe('ALGUIEN');
  });

  // El mismo número se escribe con y sin guiones según de dónde salga: el PDF
  // del portal lo trae separado y la hoja de cálculo a veces no.
  it('el mismo número escrito distinto sigue siendo el mismo', () => {
    expect(buscarEnBd('1700162026 1234')).toBeDefined();
    expect(buscarEnBd('170016 2026/1234')).toBeDefined();
  });

  it('sin número, o con uno demasiado corto, no adivina', () => {
    expect(buscarEnBd(undefined)).toBeUndefined();
    expect(buscarEnBd('123')).toBeUndefined();
  });

  it('un número que no está en la base no devuelve otro parecido', () => {
    expect(buscarEnBd('99-999-9-9999-9999')).toBeUndefined();
  });
});

describe('useComparendosStore', () => {
  it('cargar deja constancia de cuándo', () => {
    useComparendosStore.getState().cargar([registro('11-001-1-2026-1')]);
    expect(useComparendosStore.getState().cargadaEn).not.toBeNull();
    expect(useComparendosStore.getState().comparendos).toHaveLength(1);
  });
});
