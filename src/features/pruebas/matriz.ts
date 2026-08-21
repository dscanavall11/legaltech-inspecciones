import { parseCaseMetadata } from '@/shared/legalCases/types';
import type { CaseEvidence } from '@/shared/pruebas/types';

/**
 * Un hecho del relato, tal como lo escribe el inspector, y qué pruebas (por
 * id) lo sostienen. Art. 2.2.8.18.7.1 numeral 2: no se da por cierto un hecho
 * sin prueba que lo respalde.
 */
export interface Hecho {
  id: string;
  enunciado: string;
  pruebaIds: string[];
}

export interface MatrizProbatoria {
  hechos: Hecho[];
}

const MATRIZ_VACIA: MatrizProbatoria = { hechos: [] };

interface MetadataConMatriz {
  matrizProbatoria?: Partial<MatrizProbatoria>;
}

/** Hechos que ninguna prueba respalda — numeral 2, la vía más corta a una nulidad. */
export function hechosSinRespaldo(matriz: MatrizProbatoria): Hecho[] {
  return matriz.hechos.filter((h) => h.pruebaIds.length === 0);
}

/** Pruebas registradas en el expediente que la matriz no vincula a ningún hecho. */
export function pruebasHuerfanas(matriz: MatrizProbatoria, pruebas: CaseEvidence[]): CaseEvidence[] {
  const vinculadas = new Set(matriz.hechos.flatMap((h) => h.pruebaIds));
  return pruebas.filter((p) => !vinculadas.has(p.id));
}

/** Lee la matriz de `caseMetadata`, mismo patrón que partes.ts. */
export function leerMatriz(caseMetadataRaw: string | null | undefined): MatrizProbatoria {
  const guardada = parseCaseMetadata<MetadataConMatriz>(caseMetadataRaw ?? null).matrizProbatoria;
  return { ...MATRIZ_VACIA, ...guardada };
}
