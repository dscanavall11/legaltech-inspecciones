import { describe, it, expect } from 'vitest';
import { siguientePaso, siguientePasoQueja } from '@/derecho';

describe('siguientePaso — querella (proceso verbal abreviado)', () => {
  it('una querella radicada propone citar a audiencia pública', () => {
    const paso = siguientePaso('radicada');
    expect(paso.acciones[0].tipo).toBe('programar_audiencia');
    expect(paso.acciones[0].primaria).toBe(true);
    expect(paso.terminal).toBe(false);
  });

  it('con audiencia citada permite consignar el acta o aplazar', () => {
    const tipos = siguientePaso('audiencia_programada').acciones.map((a) => a.tipo);
    expect(tipos).toContain('registrar_audiencia');
    expect(tipos).toContain('reagendar_audiencia');
  });

  it('tras la decisión propone expedir la constancia de ejecutoria', () => {
    expect(siguientePaso('fallo_emitido').acciones[0].tipo).toBe('constancia_ejecutoria');
  });

  it('una querella archivada es un estado terminal sin acciones', () => {
    const paso = siguientePaso('archivada');
    expect(paso.terminal).toBe(true);
    expect(paso.acciones).toHaveLength(0);
  });
});

describe('siguientePasoQueja — queja (conciliación)', () => {
  it('una queja radicada propone citar a conciliación', () => {
    const paso = siguientePasoQueja('radicada');
    expect(paso.acciones[0].tipo).toBe('citar_conciliacion');
    expect(paso.terminal).toBe(false);
  });

  it('con conciliación citada propone suscribir el acta', () => {
    expect(siguientePasoQueja('conciliacion_programada').acciones[0].tipo).toBe(
      'registrar_conciliacion',
    );
  });

  it('sin acuerdo permite dar trámite de querella u ordenar archivo', () => {
    const tipos = siguientePasoQueja('sin_acuerdo').acciones.map((a) => a.tipo);
    expect(tipos).toContain('convertir_querella');
    expect(tipos).toContain('archivar');
  });

  it('una queja archivada es terminal', () => {
    expect(siguientePasoQueja('archivada').terminal).toBe(true);
  });
});
