import { describe, it, expect } from 'vitest';
import { fechaALetras, numeroALetras, pesosALetras } from './letras';
import { liquidarMulta } from './multas';
import { generarActaFirmeza, type DatosActaFirmeza } from './plantillas/actaFirmeza';

describe('letras — cifras y fechas como en las actas del despacho', () => {
  it('convierte números a letras', () => {
    expect(numeroALetras(16)).toBe('dieciséis');
    expect(numeroALetras(75)).toBe('setenta y cinco');
    expect(numeroALetras(100)).toBe('cien');
    expect(numeroALetras(933_816)).toBe('novecientos treinta y tres mil ochocientos dieciséis');
    expect(numeroALetras(1_634_178)).toBe('un millón seiscientos treinta y cuatro mil ciento setenta y ocho');
  });

  it('convierte pesos a letras como el modelo del acta', () => {
    expect(pesosALetras(933_816)).toBe(
      'NOVECIENTOS TREINTA Y TRES MIL OCHOCIENTOS DIECISÉIS PESOS MCTE ($ 933.816)',
    );
    expect(pesosALetras(233_454)).toBe(
      'DOSCIENTOS TREINTA Y TRES MIL CUATROCIENTOS CINCUENTA Y CUATRO PESOS MCTE ($ 233.454)',
    );
  });

  it('convierte fechas como el modelo del acta', () => {
    expect(fechaALetras('2026-04-24')).toBe(
      'veinticuatro (24) de abril de dos mil veintiséis (2026)',
    );
    expect(fechaALetras('2026-02-02')).toBe('dos (02) de febrero de dos mil veintiséis (2026)');
  });
});

describe('liquidarMulta — art. 180 y art. 223A lits. i) y j)', () => {
  it('liquida los cuatro tipos con los valores de la BD 2026', () => {
    expect(liquidarMulta(1).valorBase).toBe(116_727);
    expect(liquidarMulta(2).valorBase).toBe(233_454);
    expect(liquidarMulta(3).valorBase).toBe(466_908);
    expect(liquidarMulta(4).valorBase).toBe(933_816);
  });

  it('reiteración dentro del año incrementa 75% (modelo multa 4 reincidencia)', () => {
    const liq = liquidarMulta(4, 'reiteracion_dentro_del_anio');
    expect(liq.porcentajeIncremento).toBe(75);
    expect(liq.valorTotal).toBe(1_634_178);
    expect(liq.valorTotalLetras).toBe(
      'UN MILLÓN SEISCIENTOS TREINTA Y CUATRO MIL CIENTO SETENTA Y OCHO PESOS MCTE ($ 1.634.178)',
    );
  });

  it('moroso BDME y reiteración después del año incrementan 50%', () => {
    expect(liquidarMulta(2, 'moroso_bdme').valorTotal).toBe(350_181);
    expect(liquidarMulta(2, 'reiteracion_despues_del_anio').porcentajeIncremento).toBe(50);
  });
});

describe('generarActaFirmeza — plantilla del despacho', () => {
  const datos: DatosActaFirmeza = {
    municipio: 'Manizales',
    inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
    inspectorNombre: 'LUIS GABRIEL LADINO AYALA',
    inspectorCargo: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
    proceso: '2026-6829',
    fechaResolucion: '2026-05-04',
    comparendo: '17-001-085044',
    fechaComparendo: '2026-04-24',
    articuloNumeral: 'Artículo 92 Numeral 16',
    lugar: 'CALLE 17 CARRERA 17 41',
    solicitado: 'FERNANDO GALVEZ BEDOLLA',
    cedula: '1002592012',
    direccion: 'CARRERA 17 CALLE 19 28',
    telefono: '3175567171',
    solicitante: 'CAI CHIPRE',
    hechos: 'Hechos de prueba.',
    tipoMulta: 4,
    causal: 'ninguna',
  };

  it('sin reincidencia: RNMC descarta reiteración y el DISPONE tiene 4 puntos', () => {
    const acta = generarActaFirmeza(datos);
    const reiteracion = acta.secciones.find((s) => s.titulo?.includes('REITERACIÓN'));
    expect(reiteracion?.parrafos.join(' ')).toContain('no registra multas anteriores en firme');
    expect(acta.dispone).toHaveLength(4);
    expect(acta.dispone[1]).toContain('dieciséis (16) salarios mínimos diarios legales vigentes');
    expect(acta.dispone[1]).toContain('NOVECIENTOS TREINTA Y TRES MIL OCHOCIENTOS DIECISÉIS');
    expect(acta.cierre).toBe('Manizales, cuatro (04) de mayo de dos mil veintiséis (2026).');
  });

  it('reincidencia dentro del año: constata la reiteración y agrega el valor total a recaudar', () => {
    const acta = generarActaFirmeza({ ...datos, causal: 'reiteracion_dentro_del_anio' });
    const reiteracion = acta.secciones.find((s) => s.titulo?.includes('REITERACIÓN'));
    expect(reiteracion?.parrafos.join(' ')).toContain('registra una multa general anterior en firme');
    expect(acta.dispone.join(' ')).toContain('setenta y cinco por ciento (75%)');
    expect(acta.dispone.join(' ')).toContain(
      'VALOR TOTAL A RECAUDAR',
    );
    expect(acta.dispone.join(' ')).toContain('UN MILLÓN SEISCIENTOS TREINTA Y CUATRO MIL CIENTO SETENTA Y OCHO');
  });
});
