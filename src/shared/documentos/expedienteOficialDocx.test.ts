import { describe, it, expect } from 'vitest';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import JSZip from 'jszip';
import { generarExpedienteOficialDocxBlob } from './expedienteOficialDocx';

/**
 * Fixture SOLO de prueba: un .docx mínimo con tags `{TAG}`, construido en
 * memoria para validar el mecanismo de reemplazo (`patchDocument`). No es la
 * plantilla real del despacho — esa (EXPEDIENTE PLANTILLA.docx) debe cargarse
 * en public/plantillas/expediente-oficial.docx antes de generar documentos
 * reales; ver expedienteOficialDocx.ts.
 */
async function construirFixtureDocx(): Promise<ArrayBuffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'MUNICIPIO DE PRUEBA — texto fijo que no debe cambiar', bold: true })],
          }),
          new Paragraph({ children: [new TextRun('Presunto infractor: {PRESUNTO_INFRACTOR}')] }),
          new Paragraph({ children: [new TextRun('Cédula: {CEDULA}')] }),
          new Paragraph({ children: [new TextRun('Hechos: {HECHOS}')] }),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function textoPlanoDelDocx(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) throw new Error('document.xml no encontrado en el .docx generado');
  return documentXml;
}

describe('generarExpedienteOficialDocxBlob — reemplaza tags en el DOCX real, no reconstruye el documento', () => {
  it('sustituye cada tag por su valor y conserva el texto fijo de la plantilla', async () => {
    const plantilla = await construirFixtureDocx();
    const blob = await generarExpedienteOficialDocxBlob(plantilla, {
      PRESUNTO_INFRACTOR: 'ANDRÉS FELIPE CÁRDENAS AGUIRRE',
      CEDULA: '1002500001',
      HECHOS: 'Hechos de prueba tomados exactamente de la fuente.',
    });

    expect(blob.size).toBeGreaterThan(0);
    const xml = await textoPlanoDelDocx(blob);

    expect(xml).toContain('ANDRÉS FELIPE CÁRDENAS AGUIRRE');
    expect(xml).toContain('1002500001');
    expect(xml).toContain('Hechos de prueba tomados exactamente de la fuente.');
    expect(xml).toContain('MUNICIPIO DE PRUEBA');

    // Los tags ya reemplazados no deben seguir apareciendo literalmente.
    expect(xml).not.toContain('{PRESUNTO_INFRACTOR}');
    expect(xml).not.toContain('{CEDULA}');
    expect(xml).not.toContain('{HECHOS}');
  });

  it('no inventa valores: un tag sin dato queda vacío, no se rellena con texto genérico', async () => {
    const plantilla = await construirFixtureDocx();
    const blob = await generarExpedienteOficialDocxBlob(plantilla, {
      PRESUNTO_INFRACTOR: '',
      CEDULA: '1002500001',
      HECHOS: 'Hechos.',
    });
    const xml = await textoPlanoDelDocx(blob);
    expect(xml).toContain('Presunto infractor: ');
    expect(xml).not.toContain('{PRESUNTO_INFRACTOR}');
  });
});
