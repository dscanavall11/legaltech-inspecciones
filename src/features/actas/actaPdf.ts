import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ActaFirmeza } from '@/derecho';
import { cargarPdfMake } from '@/shared/documentos/pdfMake';

/**
 * Definición pdfmake del acta de firmeza — extraída para que la descarga
 * directa (`descargarActaPdf`) y la generación en memoria como Blob
 * (`generarActaFirmezaBlob`, usada por la previsualización de plantillas en
 * Configuración del Despacho) compartan el mismo layout sin duplicarlo.
 */
function definicionActaFirmeza(acta: ActaFirmeza, membreteDataUrl?: string | null): TDocumentDefinitions {
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
    { text: acta.entidad, alignment: 'center', bold: true, fontSize: 10.5, margin: [0, 0, 0, 2] },
    { text: acta.tituloDocumento, alignment: 'center', bold: true, fontSize: 13, margin: [0, 6, 0, 2] },
    { text: `QUEJA ${acta.proceso}`, alignment: 'center', fontSize: 10 },
    { text: acta.fechaResolucionLetras, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 10] },
    { text: acta.epigrafe, alignment: 'center', bold: true, fontSize: 9, margin: [0, 0, 0, 12] },
    {
      table: {
        widths: ['auto', '*'],
        body: acta.tablaDatos.map((f) => [
          { text: `${f.etiqueta}:`, bold: true, fontSize: 8.5 },
          { text: f.valor, fontSize: 9 },
        ]),
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 12],
    },
  );

  for (const seccion of acta.secciones) {
    if (seccion.titulo) {
      contenido.push({
        text: seccion.titulo,
        alignment: 'center',
        bold: true,
        fontSize: 10,
        margin: [0, 10, 0, 6],
      });
    }
    for (const parrafo of seccion.parrafos) {
      contenido.push({ text: parrafo, alignment: 'justify', fontSize: 9.5, margin: [0, 0, 0, 7] });
    }
  }

  contenido.push({
    text: 'DISPONE:',
    alignment: 'center',
    bold: true,
    fontSize: 10,
    margin: [0, 10, 0, 6],
  });
  for (const parrafo of acta.dispone) {
    contenido.push({ text: parrafo, alignment: 'justify', fontSize: 9.5, margin: [0, 0, 0, 7] });
  }

  contenido.push(
    { text: acta.cierre, fontSize: 9.5, margin: [0, 10, 0, 4] },
    { text: 'CÚMPLASE,', bold: true, fontSize: 9.5, margin: [0, 0, 0, 34] },
    { text: acta.firma.nombre, bold: true, fontSize: 10 },
    { text: acta.firma.cargo, fontSize: 9.5 },
  );

  return {
    pageSize: 'LETTER',
    pageMargins: [62, 52, 62, 60],
    content: contenido,
    defaultStyle: { lineHeight: 1.25 },
    info: {
      title: `Acta de firmeza ${acta.proceso}`,
      subject: 'Acta de firmeza de multa general — art. 223A, Ley 1801 de 2016',
    },
  };
}

/**
 * Genera y descarga el acta de firmeza como PDF (texto real, no imagen),
 * con el membrete del despacho si el inspector lo cargó.
 *
 * pdfmake (~2.7 MB) se importa dinámicamente solo al descargar, para no
 * inflar el bundle de entrada de la aplicación.
 */
export async function descargarActaPdf(acta: ActaFirmeza, membreteDataUrl?: string | null) {
  const pdfMake = await cargarPdfMake();
  pdfMake.createPdf(definicionActaFirmeza(acta, membreteDataUrl)).download(`Acta de firmeza ${acta.proceso}.pdf`);
}

/**
 * Genera el acta de firmeza como Blob, para previsualizarla (PdfViewer) sin
 * descargarla — usada por la previsualización de plantillas de Configuración
 * del Despacho. Mismo layout que `descargarActaPdf` (ver `definicionActaFirmeza`).
 */
export async function generarActaFirmezaBlob(acta: ActaFirmeza, membreteDataUrl?: string | null): Promise<Blob> {
  const pdfMake = await cargarPdfMake();
  return pdfMake.createPdf(definicionActaFirmeza(acta, membreteDataUrl)).getBlob();
}
