import { describe, it, expect } from 'vitest';
import { smdlv, valorMulta, SMDLV_POR_TIPO, formatearPesos } from './multas';

describe('multas (Art. 180 Ley 1801)', () => {
  it('cada tipo de multa usa los SMDLV correctos', () => {
    expect(SMDLV_POR_TIPO).toEqual({ 1: 4, 2: 8, 3: 16, 4: 32 });
  });

  it('el SMDLV es el SMMLV dividido en 30', () => {
    expect(smdlv(1_500_000)).toBe(50_000);
  });

  it('calcula el valor de cada multa según el SMMLV', () => {
    const smmlv = 1_500_000; // SMDLV = 50.000
    expect(valorMulta(1, smmlv)).toBe(200_000); // 4 * 50.000
    expect(valorMulta(2, smmlv)).toBe(400_000); // 8 * 50.000
    expect(valorMulta(3, smmlv)).toBe(800_000); // 16 * 50.000
    expect(valorMulta(4, smmlv)).toBe(1_600_000); // 32 * 50.000
  });

  it('las multas crecen con la gravedad del comportamiento', () => {
    expect(valorMulta(4)).toBeGreaterThan(valorMulta(1));
  });

  it('formatea los valores como pesos colombianos', () => {
    expect(formatearPesos(200_000)).toContain('200.000');
  });
});
