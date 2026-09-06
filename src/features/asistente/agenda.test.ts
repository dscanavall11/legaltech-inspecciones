import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import type { FilaProceso } from '@/shared/procesos/types';
import { sugerirActuacion } from './agenda';

// Jueves 6 de agosto de 2026, día hábil (ni festivo ni fin de semana).
const HOY = dayjs('2026-08-06');

function caso(parcial: Partial<FilaProceso>): FilaProceso {
  return {
    id: 'c1',
    tipo: 'querella',
    radicado: 'Q-001',
    parteA: 'A',
    parteB: 'B',
    asunto: '—',
    estado: 'radicada',
    fechaRadicacion: '2026-08-03',
    fechaUltimoMovimiento: '2026-08-03',
    diasTermino: 15,
    diasTerminoPresuntivo: false,
    tieneFallo: false,
    ...parcial,
  };
}

describe('fecha sugerida por etapa procesal', () => {
  it('propone la acción primaria del flujo de la etapa', () => {
    expect(sugerirActuacion(caso({}), HOY)?.accion).toBe('Citar a audiencia pública');
    expect(sugerirActuacion(caso({ estado: 'audiencia_programada' }), HOY)?.accion).toBe(
      'Consignar acta de audiencia',
    );
    expect(sugerirActuacion(caso({ tipo: 'queja', estado: 'radicada' }), HOY)?.accion).toBe(
      'Citar a conciliación',
    );
  });

  it('la fecha son días hábiles: salta el festivo y el fin de semana', () => {
    // Desde el jueves 6: el viernes 7 es festivo (Boyacá) y el 8 y 9 son fin de
    // semana, así que los 3 días hábiles caen el 10, el 11 y el 12.
    const sugerida = sugerirActuacion(caso({ tipo: 'querella', diasTermino: 3 }), HOY);
    expect(sugerida?.dias).toBe(3);
    expect(sugerida?.fecha).toBe('2026-08-12');
  });

  it('el comparendo toma el término de su etapa, no el del expediente', () => {
    const objecion = sugerirActuacion(caso({ tipo: 'comparendo', estado: 'recibido', diasTermino: undefined }), HOY);
    expect(objecion?.dias).toBe(3);
    expect(objecion?.fuenteDias).toContain('223A lit. b)');

    const firmeza = sugerirActuacion(
      caso({ tipo: 'comparendo', estado: 'en_espera_objecion', diasTermino: undefined }),
      HOY,
    );
    expect(firmeza?.dias).toBe(5);
  });

  it('dice que el término es presuntivo cuando sale del default del tipo', () => {
    expect(sugerirActuacion(caso({ diasTerminoPresuntivo: true }), HOY)?.fuenteDias).toContain('por defecto');
  });

  it('sin término conocido propone la actuación pero no inventa fecha', () => {
    const sugerida = sugerirActuacion(
      caso({ tipo: 'comparendo', estado: 'audiencia_programada', diasTermino: undefined }),
      HOY,
    );
    expect(sugerida?.accion).toBeTruthy();
    expect(sugerida?.fecha).toBeNull();
    expect(sugerida?.dias).toBeNull();
  });

  it('no propone nada en estados terminales ni en tipos sin flujo modelado', () => {
    expect(sugerirActuacion(caso({ estado: 'archivada' }), HOY)).toBeNull();
    expect(sugerirActuacion(caso({ tipo: 'acta_firmeza', estado: 'expedida' }), HOY)).toBeNull();
    expect(sugerirActuacion(caso({ estado: 'estado_que_no_existe' }), HOY)).toBeNull();
  });
});
