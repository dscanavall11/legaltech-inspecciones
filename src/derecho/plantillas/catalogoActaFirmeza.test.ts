import { describe, it, expect } from 'vitest';
import { seleccionarPlantillaActaFirmeza, CATALOGO_ACTA_FIRMEZA, type SeleccionPlantillaActa } from './catalogoActaFirmeza';

function seleccion(over: Partial<SeleccionPlantillaActa> = {}): SeleccionPlantillaActa {
  return { caso: 'normal', genero: 'masculino', tipoMulta: 2, causal: 'ninguna', ...over };
}

describe('seleccionarPlantillaActaFirmeza — catálogo determinístico, sin IA y sin heurísticas de "la más parecida"', () => {
  it('normal + masculino + sin reincidencia → la plantilla canónica completa (con párrafo BDME)', () => {
    const r = seleccionarPlantillaActaFirmeza(seleccion());
    expect(r?.archivo).toBe('1. FIRMEZA M. SIN REICIDENCIA GENERAL.docx');
  });

  it('nunca selecciona automáticamente la plantilla masculina duplicada e incompleta', () => {
    for (const tipo of [2, 3, 4] as const) {
      const r = seleccionarPlantillaActaFirmeza(seleccion({ tipoMulta: tipo }));
      expect(r?.archivo).not.toBe('1. ACTA DE FIRMEZA 2026. M..docx');
    }
  });

  it('normal + femenino + sin reincidencia → la plantilla canónica completa (con párrafo BDME), no la duplicada incompleta', () => {
    const r = seleccionarPlantillaActaFirmeza(seleccion({ genero: 'femenino' }));
    expect(r?.archivo).toBe('Femenino/1. FIRMEZA F. SIN REICIDENCIA GENERAL.docx');
    expect(r?.archivo).not.toBe('1. ACTA DE FIRMEZA 2026. F.docx');
  });

  it.each([2, 3, 4] as const)('normal + masculino + reiteración dentro del año (75%%%%) tipo %i → plantilla específica del tipo', (tipo) => {
    const r = seleccionarPlantillaActaFirmeza(
      seleccion({ tipoMulta: tipo, causal: 'reiteracion_dentro_del_anio' }),
    );
    expect(r?.archivo).toBe(`3. FIRMEZA MULTA ${tipo}. REINCIDENCIA 75% M..docx`);
  });

  it.each([2, 3, 4] as const)('normal + masculino + reiteración después del año (50%%%%) tipo %i → plantilla específica del tipo', (tipo) => {
    const r = seleccionarPlantillaActaFirmeza(
      seleccion({ tipoMulta: tipo, causal: 'reiteracion_despues_del_anio' }),
    );
    expect(r?.archivo).toBe(`2. FIRMEZA MULTA ${tipo}. REINCIDENCIA 50% M..docx`);
  });

  it.each([2, 3, 4] as const)('normal + femenino + reiteración dentro del año (75%%%%) tipo %i → plantilla específica del tipo', (tipo) => {
    const r = seleccionarPlantillaActaFirmeza(
      seleccion({ genero: 'femenino', tipoMulta: tipo, causal: 'reiteracion_dentro_del_anio' }),
    );
    expect(r?.archivo).toBe(`Femenino/3. FIRMEZA MULTA ${tipo}. REINCIDENCIA 75% F..docx`);
  });

  it.each([2, 3, 4] as const)('normal + femenino + reiteración después del año (50%%%%) tipo %i → plantilla específica del tipo', (tipo) => {
    const r = seleccionarPlantillaActaFirmeza(
      seleccion({ genero: 'femenino', tipoMulta: tipo, causal: 'reiteracion_despues_del_anio' }),
    );
    expect(r?.archivo).toBe(`Femenino/2. FIRMEZA MULTA ${tipo}. REINCIDENCIA 50% F..docx`);
  });

  it('causal moroso_bdme → sin plantilla en ningún caso (no existe plantilla para el literal i)', () => {
    for (const genero of ['masculino', 'femenino'] as const) {
      for (const tipo of [2, 3, 4] as const) {
        expect(seleccionarPlantillaActaFirmeza(seleccion({ genero, tipoMulta: tipo, causal: 'moroso_bdme' }))).toBeNull();
      }
    }
  });

  it('tipo de multa 1 → sin plantilla, para ninguna combinación (no existe plantilla de multa tipo 1)', () => {
    const combinaciones: SeleccionPlantillaActa[] = [
      seleccion({ tipoMulta: 1 }),
      seleccion({ tipoMulta: 1, genero: 'femenino' }),
      seleccion({ tipoMulta: 1, causal: 'reiteracion_dentro_del_anio' }),
      { caso: 'menor_representante_legal', genero: 'masculino', tipoMulta: 1, causal: 'ninguna' },
      { caso: 'establecimiento_comercio', genero: 'masculino', tipoMulta: 1, causal: 'ninguna' },
    ];
    for (const c of combinaciones) expect(seleccionarPlantillaActaFirmeza(c)).toBeNull();
  });

  it('extranjero + sin reincidencia → plantilla única, con advertencia de inconsistencia de género en su redacción', () => {
    const r = seleccionarPlantillaActaFirmeza({ caso: 'extranjero', genero: 'masculino', tipoMulta: 2, causal: 'ninguna' });
    expect(r?.archivo).toBe('1. FIRMEZA M. SIN R. EXTRANJERO.docx');
    expect(r?.advertencias.length).toBeGreaterThan(0);
  });

  it('extranjero + reincidencia → sin plantilla', () => {
    expect(
      seleccionarPlantillaActaFirmeza({ caso: 'extranjero', genero: 'masculino', tipoMulta: 2, causal: 'reiteracion_dentro_del_anio' }),
    ).toBeNull();
  });

  it('menor representado por representante legal → solo tipo 2 y 4 tienen plantilla', () => {
    expect(
      seleccionarPlantillaActaFirmeza({ caso: 'menor_representante_legal', genero: 'masculino', tipoMulta: 2, causal: 'ninguna' })
        ?.archivo,
    ).toBe('1. REPRESENTANTE LEGAL. MULTA TIPO 2..docx');
    expect(
      seleccionarPlantillaActaFirmeza({ caso: 'menor_representante_legal', genero: 'masculino', tipoMulta: 4, causal: 'ninguna' })
        ?.archivo,
    ).toBe('1. REPRESENTANTE LEGAL. MULTA TIPO 4..docx');
    expect(
      seleccionarPlantillaActaFirmeza({ caso: 'menor_representante_legal', genero: 'masculino', tipoMulta: 3, causal: 'ninguna' }),
    ).toBeNull();
  });

  it('establecimiento de comercio → solo tipo 4 tiene plantilla, y solo sin reincidencia', () => {
    expect(
      seleccionarPlantillaActaFirmeza({ caso: 'establecimiento_comercio', genero: 'masculino', tipoMulta: 4, causal: 'ninguna' })
        ?.archivo,
    ).toBe('4. MULTA TIPO 4. - ESTABLECIMIENTOS DE COMERCIO.docx');
    expect(
      seleccionarPlantillaActaFirmeza({ caso: 'establecimiento_comercio', genero: 'masculino', tipoMulta: 4, causal: 'reiteracion_dentro_del_anio' }),
    ).toBeNull();
    expect(
      seleccionarPlantillaActaFirmeza({ caso: 'establecimiento_comercio', genero: 'masculino', tipoMulta: 2, causal: 'ninguna' }),
    ).toBeNull();
  });

  it('el catálogo completo tiene las 20 plantillas reales inspeccionadas (ninguna se perdió ni se inventó)', () => {
    expect(CATALOGO_ACTA_FIRMEZA.length).toBe(20);
  });
});
