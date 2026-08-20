import { describe, expect, it } from 'vitest';
import { variablesDeEscala } from './escala';
import { FONT_SCALE_VALUES } from '@/store/settingsStore';

describe('variablesDeEscala', () => {
  it('deriva todos los pasos del tamaño base', () => {
    expect(variablesDeEscala(13)).toEqual({
      '--txt-nota': '11px',
      '--txt-menor': '12px',
      '--txt-base': '13px',
      '--txt-titulo': '14px',
      '--txt-seccion': '16px',
      '--txt-pagina': '20px',
    });
  });

  // El control A / A+ / A++ existe para inspectores con presbicia: si un paso
  // no crece con el ajuste, ese texto se queda pequeño para quien lo activó.
  it('cada escala del ajuste de accesibilidad agranda todos los pasos', () => {
    const normal = variablesDeEscala(FONT_SCALE_VALUES.normal);
    const xlarge = variablesDeEscala(FONT_SCALE_VALUES.xlarge);
    Object.keys(normal).forEach((paso) =>
      expect(parseFloat(xlarge[paso])).toBeGreaterThan(parseFloat(normal[paso])),
    );
  });

  it('conserva el orden de la escala en todos los tamaños', () => {
    Object.values(FONT_SCALE_VALUES).forEach((base) => {
      const v = variablesDeEscala(base);
      const px = (n: string) => parseFloat(v[`--txt-${n}`]);
      expect(px('nota')).toBeLessThan(px('menor'));
      expect(px('menor')).toBeLessThan(px('base'));
      expect(px('base')).toBeLessThan(px('titulo'));
      expect(px('titulo')).toBeLessThan(px('seccion'));
      expect(px('seccion')).toBeLessThan(px('pagina'));
    });
  });
});
