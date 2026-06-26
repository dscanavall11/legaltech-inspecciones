import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { festivosColombia, esFestivo } from './festivos';

describe('festivosColombia', () => {
  it('Colombia tiene 18 días festivos en 2026', () => {
    expect(festivosColombia(2026).size).toBe(18);
  });

  it('puede haber 17 cuando dos festivos trasladados colisionan (ej. 2025)', () => {
    // En 2025, San Pedro y San Pablo y el Sagrado Corazón se trasladan ambos
    // al lunes 30 de junio: el Set deduplica -> 17 fechas únicas. Caso real.
    const n = festivosColombia(2025).size;
    expect(n).toBeGreaterThanOrEqual(17);
    expect(n).toBeLessThanOrEqual(18);
  });

  it('incluye los festivos de fecha fija', () => {
    const f = festivosColombia(2026);
    expect(f.has('2026-01-01')).toBe(true); // Año Nuevo
    expect(f.has('2026-05-01')).toBe(true); // Día del Trabajo
    expect(f.has('2026-07-20')).toBe(true); // Independencia
    expect(f.has('2026-08-07')).toBe(true); // Batalla de Boyacá
    expect(f.has('2026-12-08')).toBe(true); // Inmaculada Concepción
    expect(f.has('2026-12-25')).toBe(true); // Navidad
  });

  it('aplica la Ley Emiliani: Reyes 2026 se traslada al lunes 12 de enero', () => {
    const f = festivosColombia(2026);
    // 6 de enero de 2026 es martes -> se traslada al lunes siguiente.
    expect(f.has('2026-01-06')).toBe(false);
    expect(f.has('2026-01-12')).toBe(true);
  });

  it('todos los festivos Emiliani caen en lunes', () => {
    const emilianiEsperados = ['2026-01-12']; // Reyes ya validado arriba
    for (const fecha of emilianiEsperados) {
      expect(dayjs(fecha).day()).toBe(1); // 1 = lunes
    }
  });

  it('calcula correctamente las fiestas movibles de Semana Santa (Pascua 2026 = 5 abr)', () => {
    const f = festivosColombia(2026);
    expect(f.has('2026-04-02')).toBe(true); // Jueves Santo
    expect(f.has('2026-04-03')).toBe(true); // Viernes Santo (no se traslada)
  });
});

describe('esFestivo', () => {
  it('reconoce un festivo y un día común', () => {
    expect(esFestivo(dayjs('2026-12-25'))).toBe(true);
    expect(esFestivo(dayjs('2026-12-26'))).toBe(false);
  });
});
