import { describe, it, expect } from 'vitest';
import { ESTADOS_POST_FALLO, estaFinalizado } from './types';

/**
 * Corrección pedida por ChatGPT sobre PR #2 (inspecciones-redesign):
 * ESTADOS_POST_FALLO es el catálogo de estados procesales/jurídicos que ya
 * usan comparendo/acta/apelación; el ciclo de vida técnico del expediente
 * (ACTIVO/FINALIZADO) es una noción aparte y no debe reinterpretar ni
 * reemplazar ese catálogo. Este test fija ambas cosas por separado.
 */
describe('ESTADOS_POST_FALLO y estaFinalizado son catálogos independientes', () => {
  it('ESTADOS_POST_FALLO conserva su lista original de estados procesales', () => {
    expect(ESTADOS_POST_FALLO).toEqual([
      'fallo_emitido',
      'en_firmeza',
      'apelado',
      'archivada',
      'conciliada',
      'confirmado',
      'revocado',
      'expedida',
    ]);
  });

  it('FINALIZADO no forma parte del catálogo procesal', () => {
    expect(ESTADOS_POST_FALLO.includes('FINALIZADO')).toBe(false);
  });

  it('estaFinalizado solo mira el ciclo de vida técnico, no el catálogo procesal', () => {
    expect(estaFinalizado('FINALIZADO')).toBe(true);
    expect(estaFinalizado('ACTIVO')).toBe(false);
    // Un estado del catálogo procesal no es, por sí solo, un ciclo de vida finalizado.
    expect(estaFinalizado('fallo_emitido')).toBe(false);
    expect(estaFinalizado('archivada')).toBe(false);
  });
});
