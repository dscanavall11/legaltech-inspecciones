import type { CaseEvidence } from '@/shared/pruebas/types';
import { EVIDENCE_TYPE_LABEL } from '@/shared/pruebas/types';

/**
 * Grafo argumental del expediente: los hechos alegados a un lado, las pruebas
 * registradas al otro, y una línea cuando la prueba dice sustentar ese hecho.
 *
 * El vínculo NO es una calificación jurídica: se deriva de las palabras que la
 * propia prueba trae en su finalidad y su descripción. Si no coinciden, la
 * prueba queda suelta — nunca se le inventa un hecho.
 *
 * Módulo puro: sin React ni red, para poder probarlo.
 */

export interface HechoNodo {
  id: string;
  texto: string;
}

export interface PruebaNodo {
  id: string;
  identificador: string;
  etiqueta: string;
}

export interface Vinculo {
  hecho: string;
  prueba: string;
}

export interface GrafoArgumental {
  hechos: HechoNodo[];
  pruebas: PruebaNodo[];
  vinculos: Vinculo[];
  /** Qué lado falta para poder dibujar algo. null = hay ambos. */
  falta: 'hechos' | 'pruebas' | 'ambos' | null;
}

/** Palabras que coinciden en cualquier texto jurídico y no vinculan nada. */
const VACIAS = new Set([
  'sobre',
  'entre',
  'entre',
  'entonces',
  'porque',
  'cuando',
  'donde',
  'desde',
  'hasta',
  'entrega',
  'mismo',
  'misma',
  'todos',
  'todas',
  'estos',
  'estas',
  'aquel',
  'segun',
  'ademas',
  'siendo',
  'haber',
  'hecho',
  'hechos',
  'prueba',
  'pruebas',
  'parte',
  'partes',
  'senor',
  'senora',
  'acredita',
  'acreditar',
]);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Palabras con carga semántica: 5 letras o más y fuera de la lista de vacías. */
function terminos(texto: string): Set<string> {
  return new Set(
    normalizar(texto)
      .split(/[^a-z0-9]+/)
      .filter((p) => p.length >= 5 && !VACIAS.has(p)),
  );
}

/**
 * Parte el relato de hechos del expediente (`background.allegedFacts`) en
 * hechos numerados: una línea o una oración por hecho, tal como venga escrito.
 * No reescribe ni resume: solo corta.
 */
export function extraerHechos(relato: string | null | undefined): HechoNodo[] {
  return (relato ?? '')
    .split(/\n+|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ0-9])/)
    .map((t) => t.trim().replace(/^[-•*\d.)\s]+/, '').trim())
    .filter((t) => t.length >= 15)
    .map((texto, i) => ({ id: `H-${i + 1}`, texto }));
}

function etiquetaPrueba(p: CaseEvidence): string {
  return p.description?.trim() || p.purpose?.trim() || EVIDENCE_TYPE_LABEL[p.evidenceType];
}

export function armarGrafo(
  relatoHechos: string | null | undefined,
  pruebasCaso: readonly CaseEvidence[],
): GrafoArgumental {
  const hechos = extraerHechos(relatoHechos);
  const pruebas: PruebaNodo[] = pruebasCaso.map((p) => ({
    id: p.id,
    identificador: p.identifier,
    etiqueta: etiquetaPrueba(p),
  }));

  const porHecho = hechos.map((h) => ({ id: h.id, terminos: terminos(h.texto) }));
  const vinculos: Vinculo[] = [];
  for (const p of pruebasCaso) {
    const suyos = terminos(`${p.purpose ?? ''} ${p.description ?? ''}`);
    for (const h of porHecho) {
      if ([...suyos].some((t) => h.terminos.has(t))) vinculos.push({ hecho: h.id, prueba: p.id });
    }
  }

  const falta =
    hechos.length === 0 && pruebas.length === 0
      ? 'ambos'
      : hechos.length === 0
        ? 'hechos'
        : pruebas.length === 0
          ? 'pruebas'
          : null;

  return { hechos, pruebas, vinculos, falta };
}

export const MOTIVO_FALTA: Record<'hechos' | 'pruebas' | 'ambos', string> = {
  hechos:
    'El expediente no registra hechos en su relato (background.allegedFacts): sin ellos no hay un lado que sustentar. Regístralos en el expediente.',
  pruebas:
    'El expediente no tiene pruebas registradas: no hay nada que enlazar con los hechos. Regístralas desde la herramienta de pruebas.',
  ambos: 'El expediente no registra ni hechos ni pruebas: no hay grafo que dibujar.',
};
