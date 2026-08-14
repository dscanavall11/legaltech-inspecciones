import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  ROTULO_PROCESO_POR_DEFECTO,
  ROTULO_RESOLUTIVA_POR_DEFECTO,
  type DocumentoLegal,
} from '@/derecho';
import { cargarPdfMake } from './pdfMake';

/**
 * Renderer pdfmake genérico para la forma compartida `DocumentoLegal` (Task
 * 10/11: autos, constancias, fallo del comparendo, declaración de testigo).
 * Sigue las convenciones tipográficas de `actaPdf.ts` (que solo sabe
 * renderizar `ActaFirmeza` — dispone singular, firma única — y por eso NO se
 * reutiliza aquí ni se modifica), generalizando lo que `ActaFirmeza` no
 * necesita:
 *  - `resuelve` en vez de `dispone`; el encabezado "RESUELVE:" se omite
 *    cuando el arreglo está vacío (constancias sin parte dispositiva).
 *  - `firma` es una lista: cada `FirmaLinea` es su propio bloque, con
 *    "NOTIFICADO" / rótulo del `tipo` bajo el nombre cuando aplica.
 *  - Los párrafos que empiezan por "- " (listas de pruebas/pruebas
 *    decretadas) se renderizan como ítems de viñeta en vez de párrafo
 *    justificado corrido.
 *
 * pdfmake (~2.7 MB) se importa dinámicamente solo al generar el PDF — igual
 * que `actaPdf.ts` — para no inflar el bundle de entrada.
 */

const ROTULO_FIRMA: Partial<Record<NonNullable<DocumentoLegal['firma'][number]['tipo']>, string>> = {
  notificado: 'NOTIFICADO',
  solicitado: 'SOLICITADO',
  testigo: 'TESTIGO',
};

function construirContenido(doc: DocumentoLegal, membreteDataUrl?: string | null): Content[] {
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
    { text: doc.entidad, alignment: 'center', bold: true, fontSize: 10.5, margin: [0, 0, 0, 2] },
    { text: doc.tituloDocumento, alignment: 'center', bold: true, fontSize: 13, margin: [0, 6, 0, 2] },
    {
      text: `${doc.rotuloProceso ?? ROTULO_PROCESO_POR_DEFECTO} ${doc.proceso}`,
      alignment: 'center',
      fontSize: 10,
    },
    { text: doc.fechaResolucionLetras, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 10] },
  );

  if (doc.epigrafe) {
    contenido.push({ text: doc.epigrafe, alignment: 'center', bold: true, fontSize: 9, margin: [0, 0, 0, 12] });
  }

  contenido.push({
    table: {
      widths: ['auto', '*'],
      body: doc.tablaDatos.map((f) => [
        { text: `${f.etiqueta}:`, bold: true, fontSize: 8.5 },
        { text: f.valor, fontSize: 9 },
      ]),
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 12],
  });

  for (const seccion of doc.secciones) {
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
      const esItem = parrafo.startsWith('- ');
      contenido.push({
        text: esItem ? `•  ${parrafo.slice(2)}` : parrafo,
        alignment: esItem ? 'left' : 'justify',
        fontSize: 9.5,
        margin: esItem ? [14, 0, 0, 4] : [0, 0, 0, 7],
      });
    }
  }

  if (doc.resuelve.length > 0) {
    contenido.push({
      text: doc.rotuloResolutiva ?? ROTULO_RESOLUTIVA_POR_DEFECTO,
      alignment: 'center',
      bold: true,
      fontSize: 10,
      margin: [0, 10, 0, 6],
    });
    for (const ordinal of doc.resuelve) {
      contenido.push({ text: ordinal, alignment: 'justify', fontSize: 9.5, margin: [0, 0, 0, 7] });
    }
  }

  contenido.push(
    { text: doc.cierre, fontSize: 9.5, margin: [0, 10, 0, 4] },
    { text: 'CÚMPLASE,', bold: true, fontSize: 9.5, margin: [0, 0, 0, 34] },
  );

  for (const linea of doc.firma) {
    contenido.push(
      { text: linea.nombre, bold: true, fontSize: 10, margin: [0, 0, 0, 0] },
      { text: linea.rol, fontSize: 9.5 },
      ...(linea.tipo && ROTULO_FIRMA[linea.tipo]
        ? [{ text: ROTULO_FIRMA[linea.tipo] as string, fontSize: 8.5, bold: true, margin: [0, 0, 0, 26] as [number, number, number, number] }]
        : [{ text: '', margin: [0, 0, 0, 26] as [number, number, number, number] }]),
    );
  }

  return contenido;
}

function definicionDocumento(doc: DocumentoLegal, membreteDataUrl?: string | null): TDocumentDefinitions {
  return {
    pageSize: 'LETTER',
    pageMargins: [62, 52, 62, 60],
    content: construirContenido(doc, membreteDataUrl),
    defaultStyle: { lineHeight: 1.25 },
    info: {
      title: `${doc.tituloDocumento} ${doc.proceso}`,
      subject: doc.epigrafe ?? doc.tituloDocumento,
    },
  };
}

/** Genera y descarga el documento como PDF (texto real, no imagen). */
export async function descargarDocumentoLegalPdf(doc: DocumentoLegal, membreteDataUrl?: string | null) {
  const pdfMake = await cargarPdfMake();
  pdfMake.createPdf(definicionDocumento(doc, membreteDataUrl)).download(`${doc.tituloDocumento} ${doc.proceso}.pdf`);
}

/**
 * Genera el PDF como Blob, para previsualizarlo (PdfViewer) y/o subirlo al
 * expediente (useUploadCaseDocument) sin pasar por una descarga local.
 * pdfmake 0.3.x: `getBlob()` devuelve una Promise (ya no toma callback) — ver
 * `cargarPdfMake`.
 */
export async function generarDocumentoLegalBlob(doc: DocumentoLegal, membreteDataUrl?: string | null): Promise<Blob> {
  const pdfMake = await cargarPdfMake();
  return pdfMake.createPdf(definicionDocumento(doc, membreteDataUrl)).getBlob();
}
