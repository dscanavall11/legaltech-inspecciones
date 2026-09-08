import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import type { LiquidacionMulta } from '@/derecho/multas';
import { extraerValoresCacheadosDocx, verificarIntegridadActaGenerada } from './verificacionIntegridadActaDocx';

/** Fragmento OOXML mínimo con un MERGEFIELD y su valor cacheado — misma forma real que usa Word. */
function xmlConCampoCacheado(nombreCampo: string, valorCacheado: string, valorAdicional = ''): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p>' +
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r>' +
    `<w:r><w:instrText xml:space="preserve"> MERGEFIELD ${nombreCampo} </w:instrText></w:r>` +
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>' +
    `<w:r><w:t>${valorCacheado}</w:t></w:r>` +
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>' +
    `<w:r><w:t>${valorAdicional}</w:t></w:r>` +
    '</w:p></w:body></w:document>'
  );
}

async function construirDocxFake(xmlDocumento: string): Promise<Blob> {
  const zip = new JSZip();
  zip.file('word/document.xml', xmlDocumento);
  return zip.generateAsync({ type: 'blob' });
}

const LIQUIDACION_OK: LiquidacionMulta = {
  tipo: 4,
  smdlv: 16,
  smdlvLetras: 'dieciséis (16)',
  valorBase: 933_816,
  valorBaseLetras: 'NOVECIENTOS TREINTA Y TRES MIL OCHOCIENTOS DIECISÉIS PESOS',
  causal: 'ninguna',
  porcentajeIncremento: 0,
  valorIncremento: 0,
  valorTotal: 933_816,
  valorTotalLetras: 'NOVECIENTOS TREINTA Y TRES MIL OCHOCIENTOS DIECISÉIS PESOS',
};

describe('extraerValoresCacheadosDocx — detecta el valor de resultado cacheado de un MERGEFIELD', () => {
  it('extrae el valor cacheado cuando es suficientemente largo (dato identificable)', () => {
    const xml = xmlConCampoCacheado('Solicitado', 'NOMBRE DEL CASO ANTERIOR');
    expect(extraerValoresCacheadosDocx(xml)).toContain('NOMBRE DEL CASO ANTERIOR');
  });

  it('ignora valores cortos (no son un dato personal identificable, p. ej. "16")', () => {
    const xml = xmlConCampoCacheado('Tipo_de_multa', '16');
    expect(extraerValoresCacheadosDocx(xml)).toEqual([]);
  });
});

describe('verificarIntegridadActaGenerada — confiabilidad antes que velocidad', () => {
  const camposBase = {
    Proceso: '2026-1',
    Comparendo: '17-001-1',
    Solicitado: 'CIUDADANO DE PRUEBA',
    Cedula_solicitado: '1000000001',
  };
  const valoresFijosBase = { anioVigenciaLetras: 'dos mil veintiséis (2026)', valorTotalLetras: undefined };

  it('acta correcta, sin residuos → ok', async () => {
    const xml =
      xmlConCampoCacheado('Solicitado', 'CIUDADANO DE PRUEBA') +
      '<!-- Proceso:2026-1 Comparendo:17-001-1 Cedula_solicitado:1000000001 dos mil veintiséis (2026) -->';
    const blob = await construirDocxFake(xml);
    const r = await verificarIntegridadActaGenerada({
      valoresCacheadosPlantilla: [],
      blobGenerado: blob,
      camposEsperados: camposBase,
      valoresFijosEsperados: valoresFijosBase,
      archivoPlantilla: '1. ACTA DE FIRMEZA 2026. M..docx',
      generoResuelto: 'masculino',
      liquidacion: LIQUIDACION_OK,
    });
    expect(r.ok).toBe(true);
  });

  it('archivo vacío → error de integridad, sin abrir el ZIP', async () => {
    const r = await verificarIntegridadActaGenerada({
      valoresCacheadosPlantilla: [],
      blobGenerado: new Blob([]),
      camposEsperados: camposBase,
      valoresFijosEsperados: valoresFijosBase,
      archivoPlantilla: '1. ACTA DE FIRMEZA 2026. M..docx',
      generoResuelto: 'masculino',
      liquidacion: LIQUIDACION_OK,
    });
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('ERROR DE INTEGRIDAD DOCUMENTAL');
    expect(r.motivo).toMatch(/vacío/i);
  });

  it('no es un ZIP válido → error de integridad', async () => {
    const r = await verificarIntegridadActaGenerada({
      valoresCacheadosPlantilla: [],
      blobGenerado: new Blob(['esto no es un zip']),
      camposEsperados: camposBase,
      valoresFijosEsperados: valoresFijosBase,
      archivoPlantilla: '1. ACTA DE FIRMEZA 2026. M..docx',
      generoResuelto: 'masculino',
      liquidacion: LIQUIDACION_OK,
    });
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/ZIP válido/i);
  });

  it('falta un dato esperado en el documento generado → error con el nombre del campo', async () => {
    const xml = xmlConCampoCacheado('Solicitado', ''); // el campo quedó sin el nombre esperado
    const blob = await construirDocxFake(xml);
    const r = await verificarIntegridadActaGenerada({
      valoresCacheadosPlantilla: [],
      blobGenerado: blob,
      camposEsperados: { Solicitado: 'ESTE NOMBRE NO ESTÁ EN EL DOCUMENTO' },
      valoresFijosEsperados: valoresFijosBase,
      archivoPlantilla: '1. ACTA DE FIRMEZA 2026. M..docx',
      generoResuelto: 'masculino',
      liquidacion: LIQUIDACION_OK,
    });
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('Solicitado');
  });

  it('la plantilla no corresponde al género resuelto → error específico', async () => {
    const xml = xmlConCampoCacheado('Solicitado', 'CIUDADANA DE PRUEBA');
    const blob = await construirDocxFake(xml);
    const r = await verificarIntegridadActaGenerada({
      valoresCacheadosPlantilla: [],
      blobGenerado: blob,
      camposEsperados: { ...camposBase, Solicitado: 'CIUDADANA DE PRUEBA' },
      valoresFijosEsperados: valoresFijosBase,
      archivoPlantilla: '1. ACTA DE FIRMEZA 2026. M..docx', // masculina en la raíz, no en Femenino/
      generoResuelto: 'femenino',
      liquidacion: LIQUIDACION_OK,
    });
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/no corresponde al género/i);
  });

  it('aritmética inconsistente (base + incremento ≠ total) → error específico', async () => {
    const xml = xmlConCampoCacheado('Solicitado', 'CIUDADANO DE PRUEBA');
    const blob = await construirDocxFake(xml);
    const liquidacionInconsistente: LiquidacionMulta = { ...LIQUIDACION_OK, valorTotal: LIQUIDACION_OK.valorTotal + 1 };
    const r = await verificarIntegridadActaGenerada({
      valoresCacheadosPlantilla: [],
      blobGenerado: blob,
      camposEsperados: camposBase,
      valoresFijosEsperados: valoresFijosBase,
      archivoPlantilla: '1. ACTA DE FIRMEZA 2026. M..docx',
      generoResuelto: 'masculino',
      liquidacion: liquidacionInconsistente,
    });
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/base \+ incremento/i);
  });

  it('dato residual del caso anterior sobrevive en el documento final → ERROR DE INTEGRIDAD DOCUMENTAL — DATO RESIDUAL', async () => {
    // El generado "recuerda" por error el nombre del caso anterior de la plantilla,
    // en un lugar del documento que la sustitución de MERGEFIELD no tocó.
    const xml =
      xmlConCampoCacheado('Solicitado', 'CIUDADANO DE PRUEBA', 'PEDRO ANTONIO RESIDUAL DEL CASO ANTERIOR');
    const blob = await construirDocxFake(xml);
    const r = await verificarIntegridadActaGenerada({
      valoresCacheadosPlantilla: ['PEDRO ANTONIO RESIDUAL DEL CASO ANTERIOR'],
      blobGenerado: blob,
      camposEsperados: { Solicitado: 'CIUDADANO DE PRUEBA' },
      valoresFijosEsperados: { anioVigenciaLetras: '' },
      archivoPlantilla: '1. ACTA DE FIRMEZA 2026. M..docx',
      generoResuelto: 'masculino',
      liquidacion: LIQUIDACION_OK,
    });
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('ERROR DE INTEGRIDAD DOCUMENTAL — DATO RESIDUAL');
  });

  it('un valor cacheado que coincide por casualidad con un valor CORRECTO de este caso no cuenta como residuo', async () => {
    // "dieciséis (16)" es el SMDLV del tipo 4 para cualquier caso — no es un residuo, es la fórmula legal.
    const xml = xmlConCampoCacheado('Solicitado', 'CIUDADANO DE PRUEBA', LIQUIDACION_OK.smdlvLetras);
    const blob = await construirDocxFake(xml);
    const r = await verificarIntegridadActaGenerada({
      valoresCacheadosPlantilla: [LIQUIDACION_OK.smdlvLetras],
      blobGenerado: blob,
      camposEsperados: { Solicitado: 'CIUDADANO DE PRUEBA', valor_Salarios: LIQUIDACION_OK.smdlvLetras },
      valoresFijosEsperados: { anioVigenciaLetras: '' },
      archivoPlantilla: '1. ACTA DE FIRMEZA 2026. M..docx',
      generoResuelto: 'masculino',
      liquidacion: LIQUIDACION_OK,
    });
    expect(r.ok).toBe(true);
  });
});
