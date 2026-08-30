import { describe, it, expect } from 'vitest';
import { esFestivo, diasHabilesDesde } from './diasHabiles';

describe('diasHabilesDesde', () => {
  it('comparendo de viernes: el lunes siguiente cuenta como día hábil 1', () => {
    const viernes = new Date(2026, 1, 6); // 2026-02-06 es viernes
    expect(viernes.getDay()).toBe(5);
    const dia1 = diasHabilesDesde(viernes, 1);
    expect(dia1.getDate()).toBe(9); // lunes 2026-02-09
    expect(dia1.getDay()).toBe(1);
  });

  it('salta un festivo trasladado por la Ley Emiliani (Reyes: 6 ene 2026 martes → lunes 12 ene)', () => {
    expect(esFestivo(new Date(2026, 0, 12))).toBe(true);
    expect(esFestivo(new Date(2026, 0, 6))).toBe(false);
    // desde el 8 de enero (jueves): día 1 = vie 9, salta festivo lun 12, día 2 = mar 13, día 3 = mié 14
    const base = new Date(2026, 0, 8);
    const resultado = diasHabilesDesde(base, 3);
    expect(resultado.getFullYear()).toBe(2026);
    expect(resultado.getMonth()).toBe(0);
    expect(resultado.getDate()).toBe(14);
  });

  it('Semana Santa 2026: Jueves y Viernes Santo son festivos y no se trasladan', () => {
    // Domingo de Pascua 2026 = 5 de abril
    expect(esFestivo(new Date(2026, 3, 2))).toBe(true); // Jueves Santo
    expect(esFestivo(new Date(2026, 3, 3))).toBe(true); // Viernes Santo
    expect(esFestivo(new Date(2026, 3, 5))).toBe(false); // domingo de Pascua no es festivo laboral aparte
  });

  it('festivos móviles ligados a Pascua caen lunes por construcción', () => {
    expect(esFestivo(new Date(2026, 4, 18))).toBe(true); // Ascensión (+43)
    expect(esFestivo(new Date(2026, 5, 8))).toBe(true); // Corpus Christi (+64)
    expect(esFestivo(new Date(2026, 5, 15))).toBe(true); // Sagrado Corazón (+71)
  });

  it('fin de año: cruza el 25 de diciembre y el 1 de enero sin contarlos', () => {
    const base = new Date(2026, 11, 23); // miércoles 23 dic 2026
    const resultado = diasHabilesDesde(base, 3);
    // día 1 = jue 24, (fest 25 y fin de semana no cuentan), día 2 = lun 28, día 3 = mar 29
    expect(resultado.getFullYear()).toBe(2026);
    expect(resultado.getMonth()).toBe(11);
    expect(resultado.getDate()).toBe(29);
  });
});
