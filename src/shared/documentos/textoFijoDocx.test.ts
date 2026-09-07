import { describe, it, expect } from 'vitest';
import { repararAnioCaratulaExpediente, repararValoresFijosActaFirmeza } from './textoFijoDocx';

function parrafo(...runs: { texto: string; rPr?: string }[]): string {
  return `<w:p>${runs
    .map((r) => `<w:r>${r.rPr ? `<w:rPr>${r.rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${r.texto}</w:t></w:r>`)
    .join('')}</w:p>`;
}

describe('repararValoresFijosActaFirmeza — texto fijo residual, no MERGEFIELD (bloqueante)', () => {
  it('reemplaza el año de vigencia cuando está en un solo run', () => {
    const xml = parrafo({
      texto: 'salarios mínimos diarios legales vigentes (SMDLV) para la vigencia ',
    }) + parrafo({ texto: 'dos mil veintiséis (2026)', rPr: '<w:color w:val="000000"/>' }) + parrafo({ texto: ', equivalentes a la suma de X.' });
    // El ancla y el valor deben estar en el MISMO párrafo para que se repare.
    const unico = parrafo(
      { texto: 'salarios mínimos diarios legales vigentes (SMDLV) para la vigencia ' },
      { texto: 'dos mil veintiséis (2026)', rPr: '<w:color w:val="000000"/>' },
      { texto: ', equivalentes a la suma de X.' },
    );
    const { xml: salida, aplicadas } = repararValoresFijosActaFirmeza(unico, {
      anioVigenciaLetras: 'dos mil veintisiete (2027)',
    });
    expect(salida).toContain('dos mil veintisiete (2027)');
    expect(salida).not.toContain('dos mil veintiséis (2026)');
    expect(salida).toContain('para la vigencia');
    expect(salida).toContain(', equivalentes a la suma de X.');
    expect(aplicadas).toContain('vigencia');
    void xml; // fixture de referencia, no usado directamente
  });

  it('reemplaza el año de vigencia cuando Word lo partió en varios runs (caso real observado)', () => {
    // Reproduce exactamente el patrón real: "dos mil " | "veintiséis" | " (202" | "6"
    const xml = parrafo(
      { texto: 'vigentes (smdlv) para el año dos mil ' },
      { texto: 'veintiséis', rPr: '<w:color w:val="000000"/>' },
      { texto: ' (202', rPr: '<w:color w:val="000000"/>' },
      { texto: '6)', rPr: '<w:color w:val="000000"/>' },
      { texto: ', lo que corresponde a X.' },
    );
    const { xml: salida, aplicadas } = repararValoresFijosActaFirmeza(xml, {
      anioVigenciaLetras: 'dos mil veintiocho (2028)',
    });
    expect(salida).toContain('dos mil veintiocho (2028)');
    expect(salida).not.toContain('veintiséis');
    expect(salida).not.toContain('2026');
    expect(salida).toContain('para el año');
    expect(salida).toContain(', lo que corresponde a X.');
    expect(aplicadas).toContain('vigencia');
  });

  it('conserva el rPr (formato) del primer run al colapsar varios runs', () => {
    const xml = parrafo(
      { texto: 'para la vigencia dos mil ', rPr: '<w:b/>' },
      { texto: 'veintiséis (2026)', rPr: '<w:b/>' },
    );
    const { xml: salida } = repararValoresFijosActaFirmeza(xml, { anioVigenciaLetras: 'dos mil veintisiete (2027)' });
    expect(salida).toMatch(/<w:rPr><w:b\/><\/w:rPr><w:t[^>]*>para la vigencia dos mil veintisiete \(2027\)<\/w:t>/);
  });

  it('reemplaza el "VALOR TOTAL A RECAUDAR" de reincidencia sin tocar el valor base de un párrafo distinto', () => {
    const parrafoBase = parrafo({ texto: 'corresponde a la suma de ' }, { texto: 'DOSCIENTOS MIL PESOS MCTE ($200.000).', rPr: '<w:b/>' });
    const parrafoTotal = parrafo(
      { texto: 'En consecuencia, el VALOR TOTAL A RECAUDAR' },
      { texto: ' por concepto de la multa en firme, incluido el incremento por reincidencia, corresponde a la suma de ' },
      { texto: 'TRESCIENTOS CINCUENTA MIL CIENTO OCHENTA Y UN PESOS MCTE ($350.181).', rPr: '<w:b/>' },
    );
    const documento = parrafoBase + parrafoTotal;

    const { xml: salida, aplicadas } = repararValoresFijosActaFirmeza(documento, {
      anioVigenciaLetras: 'dos mil veintisiete (2027)',
      valorTotalLetras: 'CUATROCIENTOS MIL PESOS MCTE ($ 400.000)',
    });

    // El valor base (otro párrafo, sin el ancla "VALOR TOTAL A RECAUDAR") queda intacto.
    expect(salida).toContain('DOSCIENTOS MIL PESOS MCTE ($200.000).');
    // El total sí se reemplaza.
    expect(salida).toContain('CUATROCIENTOS MIL PESOS MCTE ($ 400.000).');
    expect(salida).not.toContain('TRESCIENTOS CINCUENTA MIL CIENTO OCHENTA Y UN PESOS MCTE');
    expect(aplicadas).toContain('valorTotal');
  });

  it('no reporta reparación de valorTotal si la plantilla no trae la frase (p. ej. sin reincidencia)', () => {
    const xml = parrafo({ texto: 'para la vigencia dos mil veintiséis (2026), equivalentes a X.' });
    const { aplicadas } = repararValoresFijosActaFirmeza(xml, {
      anioVigenciaLetras: 'dos mil veintisiete (2027)',
      valorTotalLetras: 'ALGO PESOS MCTE ($1)',
    });
    expect(aplicadas).toEqual(['vigencia']);
  });
});

describe('repararAnioCaratulaExpediente — "AÑO:" fijo de la carátula (no es MERGEFIELD)', () => {
  it('reemplaza el año fijo por el año real del registro', () => {
    const xml = parrafo({ texto: 'AÑO:   ' }, { texto: '2026', rPr: '<w:b/>' });
    const { xml: salida, aplicadas } = repararAnioCaratulaExpediente(xml, '2025');
    expect(salida).toContain('2025');
    expect(salida).not.toContain('2026');
    expect(aplicadas).toContain('anioCaratula');
  });

  it('no toca años que aparezcan lejos de la etiqueta "AÑO:"', () => {
    const xml = parrafo({ texto: 'Queja radicada en 2026, sin relación con la carátula.' });
    const { aplicadas } = repararAnioCaratulaExpediente(xml, '2025');
    expect(aplicadas).toEqual([]);
  });
});
