import { describe, it, expect } from 'vitest';
import {
  camposFaltantesExpedienteOficial,
  mapearCamposExpedienteOficial,
  nombreArchivoExpedienteOficial,
  type DatosExpedienteOficial,
} from './expedienteOficial';

const REGISTRO_BASE: DatosExpedienteOficial = {
  proceso: '2026-6829',
  comparendo: '17-001-085044',
  articuloNumeral: 'Artículo 92 Numeral 16',
  solicitante: 'CAI CHIPRE',
  solicitado: 'ANDRÉS FELIPE CÁRDENAS AGUIRRE',
  cedula: '1002500001',
  direccion: 'CARRERA 17 CALLE 19 28',
  telefono: '3170000001',
  fechaComparendo: '2026-04-24',
  hechos: 'Hechos de prueba tomados exactamente de la fuente.',
  fechaRecepcion: '2026-04-24',
  fechaConstanciaInasistencia: '2026-05-05',
  genero: 'masculino',
};

describe('mapearCamposExpedienteOficial — BASE DE DATOS + PLANTILLA = DOCUMENTO', () => {
  it('mapea los campos de la carátula desde el registro, sin inventar nada', () => {
    const campos = mapearCamposExpedienteOficial(REGISTRO_BASE);
    expect(campos.QUEJA).toBe('2026-6829');
    expect(campos.ANIO).toBe('2026');
    expect(campos.ARTICULO_NUMERAL).toBe('Artículo 92 Numeral 16');
    expect(campos.PRESUNTO_INFRACTOR).toBe('ANDRÉS FELIPE CÁRDENAS AGUIRRE');
    expect(campos.CEDULA).toBe('1002500001');
    expect(campos.NUMERO_COMPARENDO).toBe('17-001-085044');
    expect(campos.FECHA_COMPARENDO).toBe('24/04/2026');
    expect(campos.HECHOS).toBe('Hechos de prueba tomados exactamente de la fuente.');
  });

  it('copia los hechos exactamente igual en carátula y constancia secretarial (no resume, no corrige)', () => {
    const campos = mapearCamposExpedienteOficial(REGISTRO_BASE);
    expect(campos.CS_HECHOS).toBe(campos.HECHOS);
    expect(campos.CI_NOMBRE).toBe(campos.PRESUNTO_INFRACTOR);
  });

  it('usa la fecha de constancia de inasistencia confirmada, no una calculada de nuevo', () => {
    const campos = mapearCamposExpedienteOficial(REGISTRO_BASE);
    expect(campos.CI_FECHA_CONSTANCIA).toBe('05/05/2026');
  });

  it.each([
    ['masculino', 'señor', 'presunto'],
    ['femenino', 'señora', 'presunta'],
  ] as const)('género %s resuelve tratamiento "%s" y "%s" solo si fue confirmado explícitamente', (genero, tratamiento, presunto) => {
    const campos = mapearCamposExpedienteOficial({ ...REGISTRO_BASE, genero });
    expect(campos.TRATAMIENTO).toBe(tratamiento);
    expect(campos.TRATAMIENTO_PRESUNTO).toBe(presunto);
  });

  it('deja en blanco los campos de identificación de archivo cuando no hay dato estructurado real', () => {
    const campos = mapearCamposExpedienteOficial(REGISTRO_BASE);
    expect(campos.CODIGO_SERIE).toBe('');
    expect(campos.NOMBRE_SUBSERIE).toBe('');
    expect(campos.NUMERO_FOLIOS).toBe('');
    expect(campos.ISLA).toBe('');
  });

  it('usa los campos de archivo reales cuando existen, sin tocar los que no', () => {
    const campos = mapearCamposExpedienteOficial({
      ...REGISTRO_BASE,
      archivo: { codigoSerie: 'S-12', numeroCarpeta: '4' },
    });
    expect(campos.CODIGO_SERIE).toBe('S-12');
    expect(campos.NUMERO_CARPETA).toBe('4');
    expect(campos.NOMBRE_SERIE).toBe('');
  });
});

describe('camposFaltantesExpedienteOficial', () => {
  it('no reporta faltantes cuando el registro trae todo lo obligatorio', () => {
    expect(camposFaltantesExpedienteOficial(REGISTRO_BASE)).toEqual([]);
  });

  it('reporta cada campo obligatorio que falte en el registro seleccionado', () => {
    const faltantes = camposFaltantesExpedienteOficial({ ...REGISTRO_BASE, cedula: '', hechos: '   ' });
    expect(faltantes).toContain('Cédula');
    expect(faltantes).toContain('Hechos');
    expect(faltantes).not.toContain('Número de comparendo');
  });
});

describe('nombreArchivoExpedienteOficial', () => {
  it('sigue el formato "EXPEDIENTE. QUEJA {QUEJA}. {NOMBRE COMPLETO}.docx"', () => {
    expect(nombreArchivoExpedienteOficial('2026-12371', 'ANDRES FELIPE CARDENAS AGUIRRE')).toBe(
      'EXPEDIENTE. QUEJA 2026-12371. ANDRES FELIPE CARDENAS AGUIRRE.docx',
    );
  });

  it('quita tildes y caracteres inválidos del nombre de archivo sin alterar el contenido del documento', () => {
    expect(nombreArchivoExpedienteOficial('2026-6829', 'ANDRÉS FELIPE CÁRDENAS AGUIRRE')).toBe(
      'EXPEDIENTE. QUEJA 2026-6829. ANDRES FELIPE CARDENAS AGUIRRE.docx',
    );
  });
});
