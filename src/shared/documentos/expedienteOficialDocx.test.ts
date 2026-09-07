import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { generarExpedienteOficialDocxBlob } from './expedienteOficialDocx';

/** Fixture mínimo de prueba con la estructura real de un campo MERGEFIELD de Word — no es la plantilla real del despacho. */
function docxConCampoMerge(nombre: string, resultadoCacheado: string): Promise<ArrayBuffer> {
  const documentXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p>` +
    `<w:r><w:fldChar w:fldCharType="begin"/></w:r>` +
    `<w:r><w:instrText xml:space="preserve"> MERGEFIELD ${nombre} </w:instrText></w:r>` +
    `<w:r><w:fldChar w:fldCharType="separate"/></w:r>` +
    `<w:r><w:t>${resultadoCacheado}</w:t></w:r>` +
    `<w:r><w:fldChar w:fldCharType="end"/></w:r>` +
    `</w:p></w:body></w:document>`;

  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
  );
  zip.file('word/document.xml', documentXml);
  return zip.generateAsync({ type: 'arraybuffer' });
}

describe('generarExpedienteOficialDocxBlob — delega en el motor de MERGEFIELD y reporta campos sin dato', () => {
  it('sustituye el campo y no reporta faltantes cuando el mapa cubre todos los campos de la plantilla', async () => {
    const plantilla = await docxConCampoMerge('Solicitado', 'NOMBRE DE EJEMPLO ANTERIOR');
    const { blob, camposSinDato } = await generarExpedienteOficialDocxBlob(plantilla, {
      Solicitado: 'CIUDADANO DE PRUEBA',
    });

    expect(camposSinDato).toEqual([]);
    expect(blob.size).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('CIUDADANO DE PRUEBA');
    expect(xml).not.toContain('NOMBRE DE EJEMPLO ANTERIOR');
  });

  it('reporta como "sin dato" un campo de la plantilla que el mapa no cubre, y lo deja en blanco (no inventa)', async () => {
    const plantilla = await docxConCampoMerge('Cedula_solicitado', '1000000000');
    const { camposSinDato, blob } = await generarExpedienteOficialDocxBlob(plantilla, {});

    expect(camposSinDato).toEqual(['Cedula_solicitado']);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).not.toContain('1000000000');
  });
});
