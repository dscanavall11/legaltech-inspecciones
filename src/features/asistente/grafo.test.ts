import { describe, it, expect } from 'vitest';
import type { CaseEvidence } from '@/shared/pruebas/types';
import { armarGrafo, extraerHechos } from './grafo';

function prueba(parcial: Partial<CaseEvidence>): CaseEvidence {
  return {
    id: 'p1',
    identifier: 'P-01',
    evidenceType: 'fotografia',
    description: null,
    date: null,
    contributor: null,
    purpose: null,
    fileName: null,
    mimeType: null,
    fileSize: null,
    storageKey: null,
    uploadedAt: null,
    hasFile: false,
    ...parcial,
  };
}

describe('grafo argumental', () => {
  it('parte el relato en hechos por línea y por oración', () => {
    const hechos = extraerHechos(
      'El vecino instaló parlantes en el patio. Los equipos suenan hasta la madrugada.\nLa policía acudió al lugar el martes.',
    );
    expect(hechos.map((h) => h.id)).toEqual(['H-1', 'H-2', 'H-3']);
    expect(hechos[2].texto).toContain('policía');
  });

  it('vincula la prueba con el hecho que su finalidad menciona', () => {
    const grafo = armarGrafo('El vecino instaló parlantes en el patio.\nLa reja quedó destruida.', [
      prueba({ id: 'p1', purpose: 'Acreditar el ruido de los parlantes' }),
    ]);
    expect(grafo.vinculos).toEqual([{ hecho: 'H-1', prueba: 'p1' }]);
  });

  it('deja suelta la prueba que no menciona ningún hecho', () => {
    const grafo = armarGrafo('El vecino instaló parlantes en el patio.', [
      prueba({ id: 'p2', purpose: 'Certificado de existencia y representación' }),
    ]);
    expect(grafo.vinculos).toEqual([]);
    expect(grafo.falta).toBeNull();
  });

  it('dice cuál de los dos lados falta, sin inventar nodos', () => {
    expect(armarGrafo(null, [prueba({})]).falta).toBe('hechos');
    expect(armarGrafo('El vecino instaló parlantes en el patio.', []).falta).toBe('pruebas');
    expect(armarGrafo('', []).falta).toBe('ambos');
    expect(armarGrafo(null, []).hechos).toEqual([]);
  });
});
