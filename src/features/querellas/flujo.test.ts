import { describe, it, expect } from 'vitest';
import { siguientePaso } from './flujo';

describe('siguientePaso (máquina de estados)', () => {
  it('una querella radicada propone programar audiencia', () => {
    const paso = siguientePaso('radicada');
    expect(paso.acciones[0].tipo).toBe('programar_audiencia');
    expect(paso.acciones[0].primaria).toBe(true);
    expect(paso.terminal).toBe(false);
  });

  it('con audiencia programada permite registrarla o reagendar', () => {
    const tipos = siguientePaso('audiencia_programada').acciones.map((a) => a.tipo);
    expect(tipos).toContain('registrar_audiencia');
    expect(tipos).toContain('reagendar_audiencia');
  });

  it('tras el fallo propone generar el acta de firmeza', () => {
    expect(siguientePaso('fallo_emitido').acciones[0].tipo).toBe('generar_acta');
  });

  it('una querella archivada es un estado terminal sin acciones', () => {
    const paso = siguientePaso('archivada');
    expect(paso.terminal).toBe(true);
    expect(paso.acciones).toHaveLength(0);
  });
});
