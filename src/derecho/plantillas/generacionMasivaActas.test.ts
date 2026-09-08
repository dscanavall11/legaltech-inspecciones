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
    incidente: 'FIRMEZA',
    causal: 'ninguna',
    reincidenciaValida: true,
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

  it('tipo de multa fuera del modelo (p. ej. 5, como trae la BD real) → error explícito, no se descarta en silencio', () => {
    const r = validarFilaParaActaMasiva(fila({ tipoMulta: 5 as Comparendo['tipoMulta'] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/tipo de multa no reconocido \(5\)/);
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

  describe('filtro por "Incidente" — primero y más barato, antes de cualquier otra validación', () => {
    it('"FIRMEZA" con espacios al inicio/final → sí es candidata', () => {
      const r = validarFilaParaActaMasiva(fila({ incidente: '  FIRMEZA  ' }));
      expect(r.ok).toBe(true);
    });

    it('"firmeza" en minúsculas → sí es candidata', () => {
      const r = validarFilaParaActaMasiva(fila({ incidente: 'firmeza' }));
      expect(r.ok).toBe(true);
    });

    it('"PRONTO PAGO" → excluida por estado, no es un error jurídico', () => {
      const r = validarFilaParaActaMasiva(fila({ incidente: 'PRONTO PAGO' }));
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.tipoExclusion).toBe('estado');
        expect(r.motivo).toBe('NO GENERADO — ESTADO DISTINTO DE FIRMEZA (PRONTO PAGO)');
      }
    });

    it('"NO ESTA - REVISAR" → excluida por estado', () => {
      const r = validarFilaParaActaMasiva(fila({ incidente: 'NO ESTA - REVISAR' }));
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.tipoExclusion).toBe('estado');
        expect(r.motivo).toBe('NO GENERADO — ESTADO DISTINTO DE FIRMEZA (NO ESTA - REVISAR)');
      }
    });

    it('"NO CERRAR" → excluida por estado', () => {
      const r = validarFilaParaActaMasiva(fila({ incidente: 'NO CERRAR' }));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.tipoExclusion).toBe('estado');
    });

    it('Incidente vacío → excluida por estado, motivo indica "vacío"', () => {
      const r = validarFilaParaActaMasiva(fila({ incidente: '' }));
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.tipoExclusion).toBe('estado');
        expect(r.motivo).toBe('NO GENERADO — ESTADO DISTINTO DE FIRMEZA (vacío)');
      }
    });

    it('una fila que no es FIRMEZA nunca llega a evaluar género ni tipo de multa: aunque ambos sean inválidos, el motivo reportado es el estado', () => {
      const r = validarFilaParaActaMasiva(
        fila({ incidente: 'PRONTO PAGO', hechos: 'sin marca de género', tipoMulta: 1 }),
      );
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.tipoExclusion).toBe('estado');
        expect(r.motivo).not.toMatch(/género|tipo de multa/i);
      }
    });
  });

  describe('reincidencia — columna oficial "Reincidencia", nunca "REINCIDENTE" ni texto libre', () => {
    it('Incidente FIRMEZA pero reincidencia no definida/inválida → no se genera, motivo exacto', () => {
      const r = validarFilaParaActaMasiva(fila({ reincidenciaValida: false }));
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.tipoExclusion).toBe('invalido');
        expect(r.motivo).toBe('REINCIDENCIA NO DEFINIDA O INVÁLIDA');
      }
    });

    it('reincidencia válida (ya resuelta a "ninguna") → sí es candidata', () => {
      const r = validarFilaParaActaMasiva(fila({ causal: 'ninguna', reincidenciaValida: true }));
      expect(r.ok).toBe(true);
    });

    it('reincidencia válida resuelta a 50% (reiteracion_despues_del_anio) → sí es candidata', () => {
      const r = validarFilaParaActaMasiva(fila({ causal: 'reiteracion_despues_del_anio', reincidenciaValida: true }));
      expect(r.ok).toBe(true);
    });

    it('reincidencia válida resuelta a 75% (reiteracion_dentro_del_anio) → sí es candidata', () => {
      const r = validarFilaParaActaMasiva(fila({ causal: 'reiteracion_dentro_del_anio', reincidenciaValida: true }));
      expect(r.ok).toBe(true);
    });
  });
});
