import { describe, it, expect } from 'vitest';
import type { DocumentoLegal } from '@/derecho';
import { generarDocumentoLegalDocxBlob } from './documentoLegalDocx';

/**
 * Smoke test del exportador .docx compartido: confirma que `docx` produce un
 * Word real (no vacío, formato ZIP/OOXML) tanto sin `resuelve` (constancias)
 * como con varias líneas de firma y párrafos "- " (listas), igual que el
 * smoke test de documentoLegalPdf.ts.
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

describe('generarDocumentoLegalDocxBlob', () => {
  it('genera un .docx no vacío (formato ZIP/OOXML) cuando resuelve está vacío', async () => {
    const blob = await generarDocumentoLegalDocxBlob(DOC_BASE);
    expect(blob.size).toBeGreaterThan(0);
    const cabecera = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
    // Todo .docx es un ZIP: empieza por la firma "PK".
    expect(String.fromCharCode(cabecera[0], cabecera[1])).toBe('PK');
  });

  it('genera un .docx no vacío con resuelve y múltiples líneas de firma', async () => {
    const blob = await generarDocumentoLegalDocxBlob({
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
