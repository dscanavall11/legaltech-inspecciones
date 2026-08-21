import { describe, expect, it } from 'vitest';
import { hechosSinRespaldo, leerMatriz, pruebasHuerfanas, type MatrizProbatoria } from './matriz';

const MATRIZ: MatrizProbatoria = {
  hechos: [
    { id: 'h1', enunciado: 'El querellado ocupó el inmueble el 3 de marzo.', pruebaIds: ['1'] },
    { id: 'h2', enunciado: 'La ocupación persiste.', pruebaIds: [] },
  ],
};

describe('matriz probatoria', () => {
  it('señala los hechos que ninguna prueba respalda', () => {
    expect(hechosSinRespaldo(MATRIZ).map((h) => h.id)).toEqual(['h2']);
  });

  it('señala las pruebas que no sostienen ningún hecho', () => {
    const pruebas = [{ id: '1' }, { id: '2' }] as never[];
    expect(pruebasHuerfanas(MATRIZ, pruebas).map((p) => p.id)).toEqual(['2']);
  });

  it('sin matriz guardada arranca vacía, no rota', () => {
    expect(leerMatriz(null)).toEqual({ hechos: [] });
    expect(leerMatriz('no es json')).toEqual({ hechos: [] });
  });
});
