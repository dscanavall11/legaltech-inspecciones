import { describe, it, expect } from 'vitest';
import type { DocumentoLegal } from '@/derecho';
import { generarDocumentoLegalBlob } from './documentoLegalPdf';

/**
 * Smoke test del renderer genérico: confirma que pdfmake produce un PDF
 * real (no vacío) tanto con `resuelve` vacío (constancias) como con varias
 * líneas de firma (autos/fallo) y párrafos "- " (listas de pruebas), sin
 * necesidad de un DOM — `cargarPdfMake` + `getBlob()` funcionan en Node.
 */
const DOC_BASE: DocumentoLegal = {
  entidad: 'INSPECCIÓN PERMANENTE DE CONVIVENCIA Y PAZ TURNO UNO',
  tituloDocumento: 'CONSTANCIA DE PRUEBA',
  proceso: '2026-0000',
  fechaResolucionLetras: 'uno (01) de enero de dos mil veintiséis (2026)',
  epigrafe: 'EPÍGRAFE DE PRUEBA',
  tablaDatos: [{ etiqueta: 'No. QUEJA', valor: '2026-0000' }],
  secciones: [
    { titulo: 'ANTECEDENTES', parrafos: ['Párrafo de prueba.', '- Prueba decretada uno', '- Prueba decretada dos'] },
  ],
  resuelve: [],
  cierre: 'Manizales, uno (01) de enero de dos mil veintiséis (2026).',
  firma: [{ nombre: 'INSPECTOR DE PRUEBA', rol: 'Inspector Permanente de Convivencia y Paz' }],
};

describe('generarDocumentoLegalBlob', () => {
  it('genera un PDF no vacío cuando resuelve está vacío (constancia)', async () => {
    const blob = await generarDocumentoLegalBlob(DOC_BASE);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
  });

  it('genera un PDF no vacío con resuelve y múltiples líneas de firma (auto/fallo)', async () => {
    const blob = await generarDocumentoLegalBlob({
      ...DOC_BASE,
      resuelve: ['PRIMERO: Ordinal de prueba.', 'SEGUNDO: Otro ordinal de prueba.'],
      firma: [
        { nombre: 'CIUDADANO DE PRUEBA', rol: 'C.C. Nro. 1.000.000.000', tipo: 'notificado' },
        { nombre: 'INSPECTOR DE PRUEBA', rol: 'Inspector Permanente de Convivencia y Paz' },
      ],
    });
    expect(blob.size).toBeGreaterThan(0);
  });
});
