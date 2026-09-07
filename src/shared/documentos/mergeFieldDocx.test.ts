import { describe, it, expect } from 'vitest';
import { reemplazarCamposMerge } from './mergeFieldDocx';

/**
 * Fragmentos de OOXML mínimos que reproducen EXACTAMENTE la estructura real
 * de un campo MERGEFIELD de Word (begin → instrText → separate → resultado
 * cacheado → end), inspeccionada directamente en las plantillas oficiales
 * del despacho (`public/Plantillas/`). No son las plantillas reales — son
 * fixtures de prueba con la misma forma, para validar el mecanismo sin
 * depender de datos de casos reales.
 */
function campoMerge(nombre: string, rPr: string, resultadoCacheado: string): string {
  return (
    `<w:r><w:rPr>${rPr}</w:rPr><w:fldChar w:fldCharType="begin"/></w:r>` +
    `<w:r><w:rPr>${rPr}</w:rPr><w:instrText xml:space="preserve"> MERGEFIELD ${nombre} </w:instrText></w:r>` +
    `<w:r><w:rPr>${rPr}</w:rPr><w:fldChar w:fldCharType="separate"/></w:r>` +
    `<w:r><w:rPr>${rPr}</w:rPr><w:t>${resultadoCacheado}</w:t></w:r>` +
    `<w:r><w:rPr>${rPr}</w:rPr><w:fldChar w:fldCharType="end"/></w:r>`
  );
}

/** Campo sin resultado cacheado (separate seguido directo de end) — se ve en "Policia_" de la plantilla real de Expediente. */
function campoMergeVacio(nombre: string, rPr: string): string {
  return (
    `<w:r><w:rPr>${rPr}</w:rPr><w:fldChar w:fldCharType="begin"/></w:r>` +
    `<w:r><w:rPr>${rPr}</w:rPr><w:instrText xml:space="preserve"> MERGEFIELD ${nombre} </w:instrText></w:r>` +
    `<w:r><w:rPr>${rPr}</w:rPr><w:fldChar w:fldCharType="separate"/></w:r>` +
    `<w:r><w:rPr>${rPr}</w:rPr><w:fldChar w:fldCharType="end"/></w:r>`
  );
}

describe('reemplazarCamposMerge — motor de reemplazo sobre la estructura real de MERGEFIELD de Word', () => {
  it('sustituye el valor cacheado y conserva el texto fijo del párrafo', () => {
    const xml = `<w:document><w:body><w:p><w:r><w:t>Presunto infractor: </w:t></w:r>${campoMerge(
      'Solicitado',
      '<w:b/>',
      'NOMBRE DE EJEMPLO ANTERIOR',
    )}</w:p></w:body></w:document>`;

    const { xml: salida, camposEncontrados, camposSinDato } = reemplazarCamposMerge(xml, {
      Solicitado: 'ANDRÉS FELIPE CÁRDENAS AGUIRRE',
    });

    expect(salida).toContain('Presunto infractor: ');
    expect(salida).toContain('ANDRÉS FELIPE CÁRDENAS AGUIRRE');
    expect(salida).not.toContain('NOMBRE DE EJEMPLO ANTERIOR');
    expect(camposEncontrados).toEqual(['Solicitado']);
    expect(camposSinDato).toEqual([]);
  });

  it('conserva el formato (rPr) del resultado original al reemplazarlo', () => {
    const xml = `<w:p>${campoMerge('Cedula_solicitado', '<w:b/><w:i/>', '1000000000')}</w:p>`;
    const { xml: salida } = reemplazarCamposMerge(xml, { Cedula_solicitado: '1002500001' });
    expect(salida).toMatch(/<w:rPr><w:b\/><w:i\/><\/w:rPr><w:t xml:space="preserve">1002500001<\/w:t>/);
  });

  it('reemplaza TODAS las apariciones de un mismo campo (así funciona la combinación de correspondencia)', () => {
    const xml = `<w:p>${campoMerge('Proceso', '', '2020-1')} y también ${campoMerge('Proceso', '', '2020-1')}</w:p>`;
    const { xml: salida } = reemplazarCamposMerge(xml, { Proceso: '2026-6829' });
    expect((salida.match(/2026-6829/g) ?? []).length).toBe(2);
    expect(salida).not.toContain('2020-1');
  });

  it('reemplaza un campo sin valor por vacío, nunca deja el dato cacheado de ejemplo (no alucina)', () => {
    const xml = `<w:p>Antes ${campoMerge('Telefono_solicitado', '', 'NO APORTA (ejemplo viejo)')} después</w:p>`;
    const { xml: salida, camposSinDato } = reemplazarCamposMerge(xml, {});
    expect(salida).not.toContain('ejemplo viejo');
    expect(salida).toContain('Antes ');
    expect(salida).toContain(' después');
    expect(camposSinDato).toEqual(['Telefono_solicitado']);
  });

  it('rellena un campo sin resultado cacheado (separate seguido de end, como "Policia_" en la plantilla real)', () => {
    const xml = `<w:p>QUEJOSO: ${campoMergeVacio('Policia_', '<w:b/>')} ${campoMerge('Solicitante', '', 'CAI EJEMPLO')}</w:p>`;
    const { xml: salida, camposEncontrados } = reemplazarCamposMerge(xml, {
      Policia_: 'PT. EJEMPLO',
      Solicitante: 'CAI CENTRO',
    });
    expect(salida).toContain('PT. EJEMPLO');
    expect(salida).toContain('CAI CENTRO');
    expect(camposEncontrados).toEqual(['Policia_', 'Solicitante']);
  });

  it('un campo con el resultado partido en varios runs (texto largo) se colapsa en uno solo con el valor nuevo', () => {
    const largo =
      `<w:r><w:rPr></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>` +
      `<w:r><w:rPr></w:rPr><w:instrText xml:space="preserve"> MERGEFIELD Hechos_descripción_comportamientos </w:instrText></w:r>` +
      `<w:r><w:rPr></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>` +
      `<w:r><w:rPr></w:rPr><w:t>Primera parte del hecho de ejemplo</w:t></w:r>` +
      `<w:r><w:rPr></w:rPr><w:t> y segunda parte.</w:t></w:r>` +
      `<w:r><w:rPr></w:rPr><w:fldChar w:fldCharType="end"/></w:r>`;
    const { xml: salida } = reemplazarCamposMerge(`<w:p>${largo}</w:p>`, {
      Hechos_descripción_comportamientos: 'Hechos reales tomados exactamente de la fuente.',
    });
    expect(salida).toContain('Hechos reales tomados exactamente de la fuente.');
    expect(salida).not.toContain('Primera parte');
    expect(salida).not.toContain('segunda parte');
    expect((salida.match(/<w:t xml:space="preserve">/g) ?? []).length).toBe(1);
  });

  it('escapa caracteres especiales XML en el valor (p. ej. hechos con "&" o "<")', () => {
    const xml = `<w:p>${campoMerge('Hechos_descripción_comportamientos', '', 'ejemplo')}</w:p>`;
    const { xml: salida } = reemplazarCamposMerge(xml, {
      Hechos_descripción_comportamientos: 'Compra & venta < 5 unidades',
    });
    expect(salida).toContain('Compra &amp; venta &lt; 5 unidades');
  });
});
