import { describe, it, expect } from 'vitest';
import { generarExpedientePrevio, type DatosExpedientePrevio } from './expedientePrevio';

const DATOS_EXPEDIENTE_BASE: DatosExpedientePrevio = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  unidad: 'Seguridad Ciudadana',
  grupo: 'Inspección Permanente Turno 1 de Policía',
  anio: 2026,
  expediente: '2026-0501',
  proceso: '2026-6829',
  comparendo: '17-001-085044',
  articuloNumeral: 'Artículo 92 Numeral 16',
  solicitante: 'CAI CHIPRE',
  solicitado: 'FERNANDO EJEMPLO BEDOLLA',
  cedulaSolicitado: '1002592012',
  direccionSolicitado: 'CARRERA 17 CALLE 19 28',
  telefonoSolicitado: '3175567171',
  fechaComparendo: '2026-04-24',
  fechaResolucion: '2026-05-04',
  hechos: 'Hechos de prueba.',
  firmanteNombre: 'MARÍA EJEMPLO GÓMEZ',
  firmanteRol: 'Auxiliar Administrativo',
  ruta: 'firmeza',
};

describe('generarExpedientePrevio — legajo de tres piezas (carátula + constancias), independiente del acta', () => {
  it('ruta firmeza: carátula + constancia de recepción + constancia de inasistencia, nada más', () => {
    const expediente = generarExpedientePrevio(DATOS_EXPEDIENTE_BASE);

    expect(expediente.tituloDocumento).toBe('EXPEDIENTE');
    const titulos = expediente.secciones.map((s) => s.titulo);
    expect(titulos).toEqual([
      'CARÁTULA DE ARCHIVO',
      'CONSTANCIA SECRETARIAL DE RECEPCIÓN DE COMPARENDO',
      'CONSTANCIA DE INASISTENCIA',
    ]);
    // No incluye RNMC, comparendo ni acta.
    expect(titulos).not.toContain('IMPRESIÓN DE CONSULTA RNMC');
    expect(expediente.secciones.some((s) => (s.titulo || '').includes('ACTA'))).toBe(false);
    expect(expediente.resuelve).toEqual([]);
  });

  it('ruta pronto_pago: la tercera pieza es la constancia de comparecencia y solicitud (no inasistencia)', () => {
    const expediente = generarExpedientePrevio({
      ...DATOS_EXPEDIENTE_BASE,
      ruta: 'pronto_pago',
      fechaComparecencia: '2026-04-27',
    });
    const titulos = expediente.secciones.map((s) => s.titulo);
    expect(titulos).not.toContain('CONSTANCIA DE INASISTENCIA');
    expect(titulos).toContain('CONSTANCIA SECRETARIAL DE COMPARECENCIA Y SOLICITUD');
    expect(expediente.secciones[2].parrafos[0]).toContain('descuento del 50% por pronto pago');
  });

  it('ruta conmutacion: la tercera pieza pide la conmutación, no el descuento', () => {
    const expediente = generarExpedientePrevio({
      ...DATOS_EXPEDIENTE_BASE,
      ruta: 'conmutacion',
      fechaComparecencia: '2026-04-27',
    });
    expect(expediente.secciones[2].parrafos[0]).toContain('conmutación de la multa');
  });

  it('fechaRecepcion: por defecto usa fechaComparendo pero es editable', () => {
    const sinFechaRecepcion = generarExpedientePrevio(DATOS_EXPEDIENTE_BASE);
    const conFechaRecepcion = generarExpedientePrevio({ ...DATOS_EXPEDIENTE_BASE, fechaRecepcion: '2026-04-30' });
    expect(sinFechaRecepcion.secciones[1].parrafos[0]).toContain('veinticuatro (24) de abril');
    expect(conFechaRecepcion.secciones[1].parrafos[0]).toContain('treinta (30) de abril');
  });

  it('firma: solo el auxiliar que compiló el expediente (documento independiente del acta)', () => {
    const expediente = generarExpedientePrevio(DATOS_EXPEDIENTE_BASE);
    expect(expediente.firma).toEqual([{ nombre: DATOS_EXPEDIENTE_BASE.firmanteNombre, rol: DATOS_EXPEDIENTE_BASE.firmanteRol }]);
  });
});
