import { describe, it, expect } from 'vitest';
import { fechaALetras, numeroALetras, pesosALetras } from './letras';
import { liquidarMulta, liquidarProntoPago, rutasDisponibles } from './multas';
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

describe('liquidarProntoPago — art. 180 par. (descuento 50% sobre el valor incrementado)', () => {
  it('sin causal: descuenta el 50% del valor base', () => {
    const liq = liquidarProntoPago(4);
    expect(liq.valorTotal).toBe(933_816);
    expect(liq.descuento).toBe(466_908);
    expect(liq.valorAPagar).toBe(466_908);
  });

  it('con reiteración: descuenta el 50% sobre el valor YA incrementado', () => {
    const liq = liquidarProntoPago(4, 'reiteracion_dentro_del_anio');
    expect(liq.valorTotal).toBe(1_634_178);
    expect(liq.descuento).toBe(817_089);
    expect(liq.valorAPagar).toBe(817_089);
  });
});

describe('rutasDisponibles — plazos del art. 180 par. y art. 223A', () => {
  // comparendo: lunes 2026-02-02, semana sin festivos.
  // día hábil 3 = jue 2026-02-05 (vence objeción); día hábil 5 = lun 2026-02-09 (vence pronto pago/conmutación).
  const comparendo = new Date(2026, 1, 2);

  it('día 3 exacto: objeción sigue disponible junto con pronto pago y conmutación', () => {
    const { rutas } = rutasDisponibles(1, comparendo, new Date(2026, 1, 5), false);
    expect(rutas).toEqual(['objecion', 'pronto_pago', 'conmutacion']);
  });

  it('día 4: objeción ya venció, pronto pago y conmutación siguen', () => {
    const { rutas } = rutasDisponibles(1, comparendo, new Date(2026, 1, 6), false);
    expect(rutas).toEqual(['pronto_pago', 'conmutacion']);
  });

  it('día 5 exacto: pronto pago y conmutación disponibles, aún no en firme', () => {
    const { rutas } = rutasDisponibles(1, comparendo, new Date(2026, 1, 9), false);
    expect(rutas).toEqual(['pronto_pago', 'conmutacion']);
  });

  it('día 6: pronto pago y conmutación vencidos, queda en firme', () => {
    const { rutas } = rutasDisponibles(1, comparendo, new Date(2026, 1, 10), false);
    expect(rutas).toEqual(['firmeza']);
  });

  it('conmutación solo aplica a tipos 1 y 2 (art. 180 par.)', () => {
    const { rutas } = rutasDisponibles(3, comparendo, new Date(2026, 1, 9), false);
    expect(rutas).toEqual(['pronto_pago']);
  });

  it('multas pendientes: no bloquean ninguna ruta, se devuelven como advertencia', () => {
    const { rutas, advertencia } = rutasDisponibles(1, comparendo, new Date(2026, 1, 5), true);
    expect(rutas).toContain('pronto_pago');
    expect(advertencia).toMatch(/no bloquea/i);
  });
});

describe('generarActaFirmeza — plantilla del despacho', () => {
  const datos: DatosActaFirmeza = {
    municipio: 'Manizales',
    inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
    inspectorNombre: 'NOMBRE DEL INSPECTOR',
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
