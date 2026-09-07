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
};

describe('mapearCamposExpedienteOficial — BASE DE DATOS + PLANTILLA = DOCUMENTO', () => {
  it('mapea los campos reales de la plantilla (mismos nombres MERGEFIELD del archivo) desde el registro', () => {
    const campos = mapearCamposExpedienteOficial(REGISTRO_BASE);
    expect(campos.Proceso).toBe('2026-6829');
    expect(campos.Comparendo).toBe('17-001-085044');
    expect(campos.comparendo).toBe('17-001-085044'); // misma variante en minúscula que trae la plantilla
    expect(campos.Artículo_Y_Númeral).toBe('Artículo 92 Numeral 16');
    expect(campos.Solicitado).toBe('ANDRÉS FELIPE CÁRDENAS AGUIRRE');
    expect(campos.Cedula_solicitado).toBe('1002500001');
    expect(campos.Hechos_descripción_comportamientos).toBe(
      'Hechos de prueba tomados exactamente de la fuente.',
    );
  });

  it('copia los hechos exactamente igual (no resume, no corrige)', () => {
    const campos = mapearCamposExpedienteOficial({ ...REGISTRO_BASE, hechos: 'Texto EXACTO de la fuente.' });
    expect(campos.Hechos_descripción_comportamientos).toBe('Texto EXACTO de la fuente.');
  });

  it('formatea la fecha de la constancia de inasistencia confirmada (DD/MM/YYYY)', () => {
    const campos = mapearCamposExpedienteOficial(REGISTRO_BASE);
    expect(campos.Acto_Administrativo_citación_GED).toBe('05/05/2026');
  });

  it('formatea la fecha de recepción como "DÍA (DD) DE MES DE AAAA", igual que ya trae la plantilla', () => {
    // 2026-04-24 es un viernes.
    const campos = mapearCamposExpedienteOficial(REGISTRO_BASE);
    expect(campos.fecha_de_recibido_).toBe('VIERNES (24) DE ABRIL DE 2026');
  });

  it('deja en blanco los campos sin fuente de datos real (nunca se inventan)', () => {
    const campos = mapearCamposExpedienteOficial(REGISTRO_BASE);
    expect(campos.Policia_).toBe('');
    expect(campos.direccion_CAI).toBe('');
    expect(campos.FECHA_AUDIENCIA_).toBe('');
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
