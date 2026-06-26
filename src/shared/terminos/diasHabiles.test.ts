import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  esDiaHabil,
  sumarDiasHabiles,
  diasHabilesEntre,
  calcularTermino,
} from './diasHabiles';

describe('esDiaHabil', () => {
  it('los fines de semana no son hábiles', () => {
    expect(esDiaHabil(dayjs('2026-06-27'))).toBe(false); // sábado
    expect(esDiaHabil(dayjs('2026-06-28'))).toBe(false); // domingo
  });

  it('los festivos no son hábiles', () => {
    expect(esDiaHabil(dayjs('2026-07-20'))).toBe(false); // Independencia
  });

  it('un día entre semana sin festivo es hábil', () => {
    expect(esDiaHabil(dayjs('2026-06-26'))).toBe(true); // viernes
  });
});

describe('sumarDiasHabiles', () => {
  it('salta el fin de semana', () => {
    // Viernes 10 jul 2026 + 1 día hábil = lunes 13 jul (sin festivos de por medio).
    expect(sumarDiasHabiles(dayjs('2026-07-10'), 1).format('YYYY-MM-DD')).toBe(
      '2026-07-13',
    );
  });

  it('salta festivos al contar el término', () => {
    // Desde lunes 5 ene 2026, 5 días hábiles: salta sáb/dom y el festivo
    // de Reyes (lun 12 ene) -> vence el martes 13 ene.
    expect(sumarDiasHabiles(dayjs('2026-01-05'), 5).format('YYYY-MM-DD')).toBe(
      '2026-01-13',
    );
  });
});

describe('diasHabilesEntre', () => {
  it('no cuenta el día inicial y excluye fines de semana', () => {
    // De viernes 10 a lunes 13 de julio 2026 = 1 día hábil.
    expect(
      diasHabilesEntre(dayjs('2026-07-10'), dayjs('2026-07-13')),
    ).toBe(1);
  });

  it('devuelve 0 si la fecha final es anterior a la inicial', () => {
    expect(
      diasHabilesEntre(dayjs('2026-07-13'), dayjs('2026-07-10')),
    ).toBe(0);
  });
});

describe('calcularTermino', () => {
  it('reporta días restantes y fecha de vencimiento', () => {
    const estado = calcularTermino(
      dayjs('2026-01-05'),
      5,
      dayjs('2026-01-05'),
    );
    expect(estado.diasTranscurridos).toBe(0);
    expect(estado.diasRestantes).toBe(5);
    expect(estado.fechaVencimiento.format('YYYY-MM-DD')).toBe('2026-01-13');
    expect(estado.vencido).toBe(false);
  });

  it('marca el término como vencido cuando se pasa la fecha', () => {
    const estado = calcularTermino(
      dayjs('2026-01-05'),
      5,
      dayjs('2026-02-01'),
    );
    expect(estado.vencido).toBe(true);
    expect(estado.diasRestantes).toBe(0);
  });
});
