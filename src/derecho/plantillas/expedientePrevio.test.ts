import { describe, it, expect } from 'vitest';
import { generarExpedientePrevio, type DatosExpedientePrevio } from './expedientePrevio';
import { generarActaFirmeza, actaFirmezaComoDocumento, type DatosActaFirmeza } from './actaFirmeza';
import { generarActaProntoPago, type DatosActaProntoPago } from './actaProntoPago';

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
  tipoMulta: 4,
  firmanteNombre: 'MARÍA EJEMPLO GÓMEZ',
  firmanteRol: 'Auxiliar Administrativo',
  rnmcFechaConsulta: '2026-05-03',
  rnmcEstado: 'EN PROCESO',
  tipoActaFinal: 'acta_firmeza',
};

const DATOS_ACTA_FIRMEZA: DatosActaFirmeza = {
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
  solicitado: 'FERNANDO EJEMPLO BEDOLLA',
  cedula: '1002592012',
  direccion: 'CARRERA 17 CALLE 19 28',
  telefono: '3175567171',
  solicitante: 'CAI CHIPRE',
  hechos: 'Hechos de prueba.',
  tipoMulta: 4,
  causal: 'ninguna',
};

describe('generarExpedientePrevio — legajo de archivo (carátula + constancias + acta anexa)', () => {
  it('con acta de firmeza: incluye la constancia de inasistencia y anexa el acta completa', () => {
    const acta = actaFirmezaComoDocumento(generarActaFirmeza(DATOS_ACTA_FIRMEZA));
    const expediente = generarExpedientePrevio(DATOS_EXPEDIENTE_BASE, acta);

    expect(expediente.tituloDocumento).toBe('EXPEDIENTE');
    const titulos = expediente.secciones.map((s) => s.titulo);
    expect(titulos).toContain('CARÁTULA DE ARCHIVO');
    expect(titulos).toContain('CONSTANCIA SECRETARIAL DE RECEPCIÓN DE COMPARENDO');
    expect(titulos).toContain('CONSTANCIA DE INASISTENCIA');
    expect(titulos).toContain('IMPRESIÓN DE CONSULTA RNMC');
    expect(titulos).toContain('ACTA FINAL ANEXA — ACTA DE FIRMEZA');
    // El acta anexa se delega, no se duplica: sus propias secciones vienen incluidas.
    expect(titulos).toContain('ANTECEDENTES');
    expect(expediente.resuelve).toEqual(acta.resuelve);
  });

  it('con acta de pronto pago: NO incluye constancia de inasistencia (el solicitado sí compareció)', () => {
    const datosProntoPago: DatosActaProntoPago = {
      municipio: 'Manizales',
      inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
      inspectorNombre: 'LUIS GABRIEL LADINO AYALA',
      inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
      proceso: '2026-0501',
      fechaResolucion: '2026-04-27',
      comparendo: '17-001-085044',
      fechaComparendo: '2026-04-24',
      articuloNumeral: 'Artículo 95 Numeral 1',
      solicitado: 'FERNANDO EJEMPLO BEDOLLA',
      cedula: '1002592012',
      direccion: 'CARRERA 17 CALLE 19 28',
      telefono: '3175567171',
      tipoMulta: 4,
      causal: 'ninguna',
      documentoCobro: 'RC-2026-000501',
    };
    const acta = generarActaProntoPago(datosProntoPago);
    const expediente = generarExpedientePrevio(
      { ...DATOS_EXPEDIENTE_BASE, tipoActaFinal: 'acta_pronto_pago' },
      acta,
    );
    const titulos = expediente.secciones.map((s) => s.titulo);
    expect(titulos).not.toContain('CONSTANCIA DE INASISTENCIA');
    expect(titulos).toContain('ACTA FINAL ANEXA — ACTA PRONTO PAGO');
  });

  it('firma: incluye la firma del acta anexa y, al final, la del auxiliar que compiló el expediente', () => {
    const acta = actaFirmezaComoDocumento(generarActaFirmeza(DATOS_ACTA_FIRMEZA));
    const expediente = generarExpedientePrevio(DATOS_EXPEDIENTE_BASE, acta);
    expect(expediente.firma.at(-1)).toEqual({
      nombre: DATOS_EXPEDIENTE_BASE.firmanteNombre,
      rol: DATOS_EXPEDIENTE_BASE.firmanteRol,
    });
    expect(expediente.firma.length).toBe(acta.firma.length + 1);
  });
});
