import { describe, it, expect } from 'vitest';
import { calcularEscalaDock, MAGNIFICACION_DOCK_DEFAULT } from './dockMagnification';

describe('calcularEscalaDock', () => {
  it('devuelve la escala maxima cuando el cursor esta exactamente sobre el icono', () => {
    expect(calcularEscalaDock(0)).toBe(MAGNIFICACION_DOCK_DEFAULT.escalaMax);
  });

  it('devuelve la escala base fuera del radio de influencia', () => {
    expect(calcularEscalaDock(200)).toBe(MAGNIFICACION_DOCK_DEFAULT.escalaBase);
  });

  it('devuelve la escala base justo en el limite del radio', () => {
    expect(calcularEscalaDock(MAGNIFICACION_DOCK_DEFAULT.radioInfluenciaPx)).toBe(
      MAGNIFICACION_DOCK_DEFAULT.escalaBase,
    );
  });

  it('interpola linealmente entre base y maxima dentro del radio', () => {
    const opts = { radioInfluenciaPx: 100, escalaBase: 1, escalaMax: 2 };
    expect(calcularEscalaDock(50, opts)).toBeCloseTo(1.5);
    expect(calcularEscalaDock(25, opts)).toBeCloseTo(1.75);
  });

  it('trata la distancia como valor absoluto (simetrico a ambos lados del cursor)', () => {
    const opts = { radioInfluenciaPx: 100, escalaBase: 1, escalaMax: 2 };
    expect(calcularEscalaDock(-50, opts)).toBe(calcularEscalaDock(50, opts));
  });

  it('funciona con distancia Infinity (estado inicial sin cursor sobre el dock)', () => {
    expect(calcularEscalaDock(Infinity)).toBe(MAGNIFICACION_DOCK_DEFAULT.escalaBase);
  });
});
