import { describe, it, expect } from 'vitest';
import type { DocumentoLegal } from '@/derecho';
import { documentoLegalAAcapites, aplicarAcapitesADocumentoLegal } from './documentoLegalAcapites';

const DOC: DocumentoLegal = {
  entidad: 'INSPECCIÓN DE PRUEBA',
  tituloDocumento: 'AUTO DE PRUEBA',
  proceso: '2026-0000',
  fechaResolucionLetras: 'uno (01) de enero de dos mil veintiséis (2026)',
  epigrafe: 'EPÍGRAFE',
  tablaDatos: [{ etiqueta: 'No. QUEJA', valor: '2026-0000' }],
  secciones: [
    { titulo: 'CONSIDERANDO', parrafos: ['Primer párrafo.', 'Segundo párrafo.'] },
    { parrafos: ['Sección sin título.'] },
  ],
  resuelve: ['PRIMERO: uno.', 'SEGUNDO: dos.'],
  cierre: 'Manizales, uno (01) de enero de dos mil veintiséis (2026).',
  firma: [{ nombre: 'INSPECTOR', rol: 'Inspector' }],
};

describe('documentoLegalAAcapites', () => {
  it('convierte cada sección en un acápite y agrega uno final para resuelve', () => {
    const acapites = documentoLegalAAcapites(DOC);
    expect(acapites).toHaveLength(3);
    expect(acapites[0]).toEqual({
      id: 'seccion-0',
      titulo: 'CONSIDERANDO',
      resumen: 'Primer párrafo.',
      parrafos: ['Primer párrafo.', 'Segundo párrafo.'],
      fuente: 'plantilla',
    });
    expect(acapites[1].titulo).toBe('Párrafo 2'); // sección sin título propio
    expect(acapites[2]).toEqual({
      id: 'resuelve',
      titulo: 'RESUELVE',
      resumen: 'PRIMERO: uno.',
      parrafos: ['PRIMERO: uno.', 'SEGUNDO: dos.'],
      fuente: 'plantilla',
    });
  });

  it('omite el acápite de resuelve cuando el documento no tiene parte dispositiva (constancias)', () => {
    const acapites = documentoLegalAAcapites({ ...DOC, resuelve: [] });
    expect(acapites).toHaveLength(2);
    expect(acapites.map((a) => a.id)).toEqual(['seccion-0', 'seccion-1']);
  });
});

describe('aplicarAcapitesADocumentoLegal', () => {
  it('reconstruye el documento con los párrafos editados, conservando tablaDatos/epigrafe/cierre/firma', () => {
    const acapites = documentoLegalAAcapites(DOC);
    const editados = acapites.map((a) => (a.id === 'seccion-0' ? { ...a, parrafos: ['Párrafo reescrito.'] } : a));

    const resultado = aplicarAcapitesADocumentoLegal(DOC, editados);

    expect(resultado.secciones[0].parrafos).toEqual(['Párrafo reescrito.']);
    expect(resultado.secciones[1]).toEqual(DOC.secciones[1]);
    expect(resultado.resuelve).toEqual(DOC.resuelve);
    expect(resultado.tablaDatos).toBe(DOC.tablaDatos);
    expect(resultado.epigrafe).toBe(DOC.epigrafe);
    expect(resultado.cierre).toBe(DOC.cierre);
    expect(resultado.firma).toBe(DOC.firma);
  });

  it('reconstruye resuelve editado por separado de las secciones', () => {
    const acapites = documentoLegalAAcapites(DOC).map((a) =>
      a.id === 'resuelve' ? { ...a, parrafos: ['PRIMERO: reescrito.'] } : a,
    );
    const resultado = aplicarAcapitesADocumentoLegal(DOC, acapites);
    expect(resultado.resuelve).toEqual(['PRIMERO: reescrito.']);
    expect(resultado.secciones).toEqual(DOC.secciones);
  });

  it('sin acápites (lista vacía) deja el documento intacto', () => {
    const resultado = aplicarAcapitesADocumentoLegal(DOC, []);
    expect(resultado).toEqual(DOC);
  });
});
