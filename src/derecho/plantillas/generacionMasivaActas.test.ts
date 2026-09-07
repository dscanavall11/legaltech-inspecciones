import { describe, it, expect } from 'vitest';
import type { Comparendo } from '@/features/actas/comparendos';
import { validarFilaParaActaMasiva } from './generacionMasivaActas';

function fila(over: Partial<Comparendo> = {}): Comparendo {
  return {
    proceso: '2026-12371',
    comparendo: '17-001-6-2026-12371',
    solicitado: 'ANDRES FELIPE GOMEZ RUIZ',
    cedula: '1000000001',
    direccion: 'CALLE 1 CARRERA 1',
    telefono: '3000000001',
    lugar: 'CALLE 1 CARRERA 1',
    fechaComparendo: '2026-04-24',
    solicitante: 'CAI PRUEBA',
    articuloNumeral: 'Artículo 27 Numeral 6',
    descripcionConducta: 'Portar armas, elementos cortantes...',
    hechos: 'Se aborda al ciudadano, identificado con cédula, quien portaba un arma cortopunzante.',
    tipoMulta: 4,
    apelo: false,
    causal: 'ninguna',
    ...over,
  };
}

describe('validarFilaParaActaMasiva — reutiliza exactamente la lógica individual (género, catálogo, liquidación)', () => {
  it('fila válida sin reincidencia, masculino → ok', () => {
    const r = validarFilaParaActaMasiva(fila());
    expect(r.ok).toBe(true);
  });

  it('fila válida con reincidencia 50%, femenino → ok, plantilla femenina 50%', () => {
    const r = validarFilaParaActaMasiva(
      fila({ hechos: 'Se aborda a la ciudadana, identificada con cédula.', causal: 'reiteracion_despues_del_anio' }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.seleccion.archivo).toContain('Femenino');
  });

  it('fila válida con reincidencia 75%, masculino → ok, plantilla masculina 75%', () => {
    const r = validarFilaParaActaMasiva(fila({ causal: 'reiteracion_dentro_del_anio' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.seleccion.archivo).toContain('75%');
  });

  it('falta queja/proceso → error con motivo exacto', () => {
    const r = validarFilaParaActaMasiva(fila({ proceso: '' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/faltan datos/i);
  });

  it('falta nombre/solicitado → error', () => {
    const r = validarFilaParaActaMasiva(fila({ solicitado: '' }));
    expect(r.ok).toBe(false);
  });

  it('falta comparendo → error', () => {
    const r = validarFilaParaActaMasiva(fila({ comparendo: '' }));
    expect(r.ok).toBe(false);
  });

  it('comparendo con objeción (apelo) → error, no procede acta', () => {
    const r = validarFilaParaActaMasiva(fila({ apelo: true }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/objeción/i);
  });

  it('género no determinable (hechos sin marca) → error "género no determinado", NUNCA infiere del nombre', () => {
    const r = validarFilaParaActaMasiva(fila({ hechos: 'Se realiza verificación de requisitos del establecimiento.' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('género no determinado');
  });

  it('tipo de multa 1 → error específico "no existe plantilla tipo 1"', () => {
    const r = validarFilaParaActaMasiva(fila({ tipoMulta: 1 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('no existe plantilla tipo 1');
  });

  it('causal sin plantilla (moroso_bdme) → error "no existe plantilla..."', () => {
    const r = validarFilaParaActaMasiva(fila({ causal: 'moroso_bdme' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/no existe plantilla/i);
  });

  it('no inventa reincidencia: usa exactamente la causal ya provista en la fila, nunca recalcula', () => {
    const rSinReincidencia = validarFilaParaActaMasiva(fila({ causal: 'ninguna' }));
    const rConReincidencia = validarFilaParaActaMasiva(fila({ causal: 'reiteracion_dentro_del_anio' }));
    expect(rSinReincidencia.ok && rSinReincidencia.seleccion.archivo).not.toBe(
      rConReincidencia.ok && rConReincidencia.seleccion.archivo,
    );
  });
});
