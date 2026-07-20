import { describe, it, expect } from 'vitest';
import { calcularEfectoDock, EFECTO_DOCK_DEFAULT } from './dockMagnification';

describe('calcularEfectoDock', () => {
  it('escala maxima y sin desplazamiento cuando el cursor esta exactamente sobre el icono', () => {
    const r = calcularEfectoDock(0);
    expect(r.escala).toBeCloseTo(EFECTO_DOCK_DEFAULT.escalaMax);
    expect(r.desplazamiento).toBeCloseTo(0);
  });

  it('escala base en el borde del radio de influencia', () => {
    const r = calcularEfectoDock(EFECTO_DOCK_DEFAULT.radioInfluenciaPx);
    expect(r.escala).toBeCloseTo(1);
  });

  it('desplazamiento maximo (con signo) en el borde del radio', () => {
    const abajo = calcularEfectoDock(EFECTO_DOCK_DEFAULT.radioInfluenciaPx);
    const arriba = calcularEfectoDock(-EFECTO_DOCK_DEFAULT.radioInfluenciaPx);
    expect(abajo.desplazamiento).toBeCloseTo(EFECTO_DOCK_DEFAULT.desplazamientoMaxPx);
    expect(arriba.desplazamiento).toBeCloseTo(-EFECTO_DOCK_DEFAULT.desplazamientoMaxPx);
  });

  it('fuera del radio, el desplazamiento queda fijo en el maximo (no vuelve a 0 de golpe)', () => {
    const r = calcularEfectoDock(500);
    expect(r.escala).toBe(1);
    expect(r.desplazamiento).toBeCloseTo(EFECTO_DOCK_DEFAULT.desplazamientoMaxPx);
  });

  it('es simetrico en escala respecto del signo de la distancia', () => {
    const opts = { radioInfluenciaPx: 100, escalaMax: 2, desplazamientoMaxPx: 20 };
    const a = calcularEfectoDock(40, opts);
    const b = calcularEfectoDock(-40, opts);
    expect(a.escala).toBeCloseTo(b.escala);
    expect(a.desplazamiento).toBeCloseTo(-b.desplazamiento);
  });

  it('funciona con distancia Infinity (estado inicial sin cursor sobre el dock)', () => {
    const r = calcularEfectoDock(Infinity);
    expect(r.escala).toBe(1);
    expect(r.desplazamiento).toBe(0);
  });
});
