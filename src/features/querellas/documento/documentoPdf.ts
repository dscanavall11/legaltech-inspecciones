import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { DocumentoGenerado } from './acapites';
import { cargarPdfMake } from '@/shared/documentos/pdfMake';

/**
 * PDF real (texto, no imagen) de una pieza procesal determinística
 * (constancia de ejecutoria, acta, citación). Mismo patrón que
 * features/analisis/falloPdf.ts; devuelve descarga o Blob para versionar en S3.
 */
async function construirDefinicion(doc: DocumentoGenerado, radicado: string, membreteDataUrl?: string | null) {
  const pdfMake = await cargarPdfMake();

  const contenido: Content[] = [];

  if (membreteDataUrl) {
    contenido.push({ image: membreteDataUrl, fit: [480, 90], alignment: 'center', margin: [0, 0, 0, 14] });
  }

  contenido.push(
    { text: 'REPÚBLICA DE COLOMBIA', alignment: 'center', fontSize: 9.5, margin: [0, 0, 0, 2] },
    { text: doc.inspeccion, alignment: 'center', bold: true, fontSize: 10.5, margin: [0, 0, 0, 2] },
    { text: doc.titulo.toUpperCase(), alignment: 'center', bold: true, fontSize: 13, margin: [0, 8, 0, 2] },
    { text: `RADICADO N.º ${radicado}`, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 12] },
  );

  doc.acapites.forEach((a) => {
    contenido.push({ text: a.titulo, bold: true, fontSize: 10, margin: [0, 10, 0, 5] });
    a.parrafos.forEach((p) =>
      contenido.push({ text: p, alignment: 'justify', fontSize: 9.5, margin: [0, 0, 0, 6] }),
    );
  });

  contenido.push(
    { text: '____________________________________', fontSize: 9.5, margin: [0, 40, 0, 2] },
    { text: 'Inspector(a) de Convivencia y Paz', fontSize: 9.5 },
  );

  const definicion: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [62, 52, 62, 60],
    content: contenido,
    defaultStyle: { lineHeight: 1.25 },
    info: { title: `${doc.titulo} ${radicado}`, subject: doc.titulo },
  };

  return { pdfMake, definicion };
}

export function nombreArchivoDocumento(doc: DocumentoGenerado, radicado: string): string {
  return `${doc.titulo} ${radicado || 'borrador'}.pdf`;
}

export async function descargarDocumentoPdf(
  doc: DocumentoGenerado,
  radicado: string,
  membreteDataUrl?: string | null,
): Promise<void> {
  const { pdfMake, definicion } = await construirDefinicion(doc, radicado, membreteDataUrl);
  pdfMake.createPdf(definicion).download(nombreArchivoDocumento(doc, radicado));
}

export async function documentoPdfBlob(
  doc: DocumentoGenerado,
  radicado: string,
  membreteDataUrl?: string | null,
): Promise<Blob> {
  const { pdfMake, definicion } = await construirDefinicion(doc, radicado, membreteDataUrl);
  return pdfMake.createPdf(definicion).getBlob();
}
