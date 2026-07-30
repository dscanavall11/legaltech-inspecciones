import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { DocumentoFallo } from './falloDocumento';
import { cargarPdfMake } from '@/shared/documentos/pdfMake';

/**
 * Genera y descarga el fallo como PDF (texto real, no imagen), con el
 * membrete del despacho si el inspector lo cargó. Mismo patrón que
 * features/actas/actaPdf.ts.
 */
async function construirFalloPdf(documento: DocumentoFallo, membreteDataUrl?: string | null) {
  const pdfMake = await cargarPdfMake();

  const contenido: Content[] = [];

  if (membreteDataUrl) {
    contenido.push({
      image: membreteDataUrl,
      fit: [480, 90],
      alignment: 'center',
      margin: [0, 0, 0, 14],
    });
  }

  contenido.push(
    { text: documento.entidad, alignment: 'center', bold: true, fontSize: 10.5, margin: [0, 0, 0, 2] },
    { text: documento.tituloDocumento, alignment: 'center', bold: true, fontSize: 13, margin: [0, 6, 0, 2] },
    { text: `RADICADO ${documento.radicado}`, alignment: 'center', fontSize: 10 },
    { text: documento.fechaLetras, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 10] },
    {
      table: {
        widths: ['auto', '*'],
        body: documento.tablaDatos.map((f) => [
          { text: `${f.etiqueta}:`, bold: true, fontSize: 8.5 },
          { text: f.valor, fontSize: 9 },
        ]),
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 12],
    },
  );

  for (const seccion of documento.secciones) {
    contenido.push({
      text: seccion.titulo,
      alignment: 'center',
      bold: true,
      fontSize: 10,
      margin: [0, 10, 0, 6],
    });
    contenido.push({ text: seccion.contenido, alignment: 'justify', fontSize: 9.5, margin: [0, 0, 0, 7] });
  }

  contenido.push(
    { text: documento.cierre, fontSize: 9.5, margin: [0, 10, 0, 4] },
    { text: 'CÚMPLASE,', bold: true, fontSize: 9.5, margin: [0, 0, 0, 34] },
    { text: documento.firma.nombre, bold: true, fontSize: 10 },
    { text: documento.firma.cargo, fontSize: 9.5 },
  );

  const documentoPdf: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [62, 52, 62, 60],
    content: contenido,
    defaultStyle: { lineHeight: 1.25 },
    info: {
      title: `Fallo ${documento.radicado}`,
      subject: 'Fallo proferido por el despacho',
    },
  };

  return { pdfMake, definicion: documentoPdf };
}

export function nombreArchivoFallo(documento: DocumentoFallo): string {
  return `Fallo ${documento.radicado || 'borrador'}.pdf`;
}

export async function descargarFalloPdf(documento: DocumentoFallo, membreteDataUrl?: string | null) {
  const { pdfMake, definicion } = await construirFalloPdf(documento, membreteDataUrl);
  pdfMake.createPdf(definicion).download(nombreArchivoFallo(documento));
}

export async function falloPdfBlob(documento: DocumentoFallo, membreteDataUrl?: string | null): Promise<Blob> {
  const { pdfMake, definicion } = await construirFalloPdf(documento, membreteDataUrl);
  return pdfMake.createPdf(definicion).getBlob();
}
