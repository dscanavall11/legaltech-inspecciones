import { beforeEach, describe, expect, it } from 'vitest';
import { buscarEnBd, useComparendosStore } from './store';
import type { Comparendo } from '@/features/actas/comparendos';

const registro = (comparendo: string): Comparendo =>
  ({ comparendo, solicitado: 'ALGUIEN', cedula: '1' }) as Comparendo;

beforeEach(() => {
  // Limpia el historial entre pruebas: `cargar` solo APPEND-ea, así que sin
  // esto las entradas de una prueba anterior seguirían ahí y una prueba que
  // busca "el registro más reciente de nombreArchivo X" con `.find()` podría
  // toparse con uno de una prueba previa que reutilizó el mismo nombre.
  useComparendosStore.setState({ historialCargas: [] });
  useComparendosStore.getState().cargar([registro('17-001-6-2026-1234')], 'bd.xlsx', 'inspector@prueba.com');
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
    useComparendosStore.getState().cargar([registro('11-001-1-2026-1')], 'bd2.xlsx', 'inspector@prueba.com');
    expect(useComparendosStore.getState().cargadaEn).not.toBeNull();
    expect(useComparendosStore.getState().comparendos).toHaveLength(1);
  });

  it('cargar reemplaza completamente la base anterior — nunca acumula', () => {
    useComparendosStore.getState().cargar([registro('a'), registro('b')], 'primera.xlsx', 'x');
    useComparendosStore.getState().cargar([registro('c')], 'segunda.xlsx', 'x');
    const estado = useComparendosStore.getState();
    expect(estado.comparendos).toHaveLength(1);
    expect(estado.comparendos[0].comparendo).toBe('c');
    expect(estado.archivoActivo).toBe('segunda.xlsx');
  });

  it('lleva historial mínimo: la carga anterior pasa a REEMPLAZADA y la nueva queda ACTIVA', () => {
    useComparendosStore.getState().cargar([registro('a')], 'primera.xlsx', 'ana@despacho.com');
    useComparendosStore.getState().cargar([registro('b')], 'segunda.xlsx', 'ana@despacho.com');
    const historial = useComparendosStore.getState().historialCargas;
    const primera = historial.find((h) => h.nombreArchivo === 'primera.xlsx');
    const segunda = historial.find((h) => h.nombreArchivo === 'segunda.xlsx');
    expect(primera?.estado).toBe('REEMPLAZADA');
    expect(segunda?.estado).toBe('ACTIVA');
    expect(segunda?.usuario).toBe('ana@despacho.com');
  });

  it('registrarCargaFallida deja constancia sin tocar la base activa', () => {
    useComparendosStore.getState().cargar([registro('a'), registro('b')], 'buena.xlsx', 'x');
    useComparendosStore.getState().registrarCargaFallida('mala.xlsx', 'x', 'faltan columnas obligatorias');
    const estado = useComparendosStore.getState();
    expect(estado.comparendos).toHaveLength(2); // la base activa no cambió
    expect(estado.archivoActivo).toBe('buena.xlsx');
    const fallida = estado.historialCargas.find((h) => h.nombreArchivo === 'mala.xlsx');
    expect(fallida?.estado).toBe('FALLIDA');
    expect(fallida?.motivo).toBe('faltan columnas obligatorias');
  });
});
