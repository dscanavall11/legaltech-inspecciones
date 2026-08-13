import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ITableBordersOptions,
} from 'docx';
import type { DocumentoLegal } from '@/derecho';
import { descargarBlob } from './descargarBlob';

/**
 * Único helper compartido que convierte cualquier `DocumentoLegal` (actas,
 * autos, constancias, fallo, expediente) a .docx — el inspector edita sus
 * plantillas en Word, así que el PDF (pdfmake, ver documentoLegalPdf.ts) no
 * basta. Mismo layout que el PDF (encabezado, tabla de datos, secciones,
 * RESUELVE, cierre, firmas) para que ambos formatos luzcan iguales.
 *
 * `docx` (~500 KB) se importa de forma estática porque, a diferencia de
 * pdfmake (~2.7 MB), su peso no justifica el code-splitting adicional.
 */

const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const BORDES_TABLA: ITableBordersOptions = {
  top: SIN_BORDE,
  bottom: SIN_BORDE,
  left: SIN_BORDE,
  right: SIN_BORDE,
  insideHorizontal: SIN_BORDE,
  insideVertical: SIN_BORDE,
};

const ROTULO_FIRMA: Partial<Record<NonNullable<DocumentoLegal['firma'][number]['tipo']>, string>> = {
  notificado: 'NOTIFICADO',
  solicitado: 'SOLICITADO',
  testigo: 'TESTIGO',
};

function centrado(texto: string, opts: { bold?: boolean; size?: number } = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: texto, bold: opts.bold, size: opts.size ?? 20 })],
  });
}

/** Un párrafo justificado; si `texto` empieza por "- " se renderiza como ítem con viñeta (listas de pruebas/decretos). */
function parrafo(texto: string, opts: { bold?: boolean } = {}) {
  const esItem = texto.startsWith('- ');
  return new Paragraph({
    alignment: esItem ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
    spacing: { after: 140 },
    indent: esItem ? { left: 360 } : undefined,
    children: [new TextRun({ text: esItem ? `•  ${texto.slice(2)}` : texto, bold: opts.bold, size: 21 })],
  });
}

function celda(texto: string, opts: { bold?: boolean; width: number }) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.PERCENTAGE },
    borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE },
    children: [new Paragraph({ children: [new TextRun({ text: texto, bold: opts.bold, size: 18 })] })],
  });
}

/** Decodifica un data URL "data:image/png;base64,...." a Uint8Array, o null si no aplica. */
function bytesDeDataUrl(dataUrl: string): Uint8Array | null {
  const match = /^data:image\/\w+;base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const binario = atob(match[1]);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

function construirParrafos(doc: DocumentoLegal, membreteDataUrl?: string | null): Paragraph[] {
  const contenido: Paragraph[] = [];

  const membreteBytes = membreteDataUrl ? bytesDeDataUrl(membreteDataUrl) : null;
  if (membreteBytes) {
    contenido.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new ImageRun({
            type: 'png',
            data: membreteBytes,
            transformation: { width: 340, height: 64 },
          }),
        ],
      }),
    );
  }

  contenido.push(
    centrado(doc.entidad, { bold: true }),
    centrado(doc.tituloDocumento, { bold: true, size: 26 }),
    centrado(`QUEJA ${doc.proceso}`),
    centrado(doc.fechaResolucionLetras),
  );
  if (doc.epigrafe) contenido.push(centrado(doc.epigrafe, { bold: true, size: 18 }));
  contenido.push(new Paragraph({ text: '', spacing: { after: 120 } }));

  return contenido;
}

/** El cuerpo del documento se arma como una única lista de children (párrafos + tabla + párrafos). */
function construirCuerpo(doc: DocumentoLegal, membreteDataUrl?: string | null): (Paragraph | Table)[] {
  const cuerpo: (Paragraph | Table)[] = construirParrafos(doc, membreteDataUrl);

  cuerpo.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDES_TABLA,
      rows: doc.tablaDatos.map(
        (f) =>
          new TableRow({
            children: [celda(`${f.etiqueta}:`, { bold: true, width: 32 }), celda(f.valor, { width: 68 })],
          }),
      ),
    }),
    new Paragraph({ text: '', spacing: { after: 160 } }),
  );

  for (const seccion of doc.secciones) {
    if (seccion.titulo) cuerpo.push(centrado(seccion.titulo, { bold: true, size: 22 }));
    for (const p of seccion.parrafos) cuerpo.push(parrafo(p));
  }

  if (doc.resuelve.length > 0) {
    cuerpo.push(centrado('RESUELVE:', { bold: true, size: 22 }));
    for (const ordinal of doc.resuelve) cuerpo.push(parrafo(ordinal));
  }

  cuerpo.push(
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: doc.cierre, size: 21 })] }),
    new Paragraph({ spacing: { after: 680 }, children: [new TextRun({ text: 'CÚMPLASE,', bold: true, size: 21 })] }),
  );

  for (const linea of doc.firma) {
    cuerpo.push(
      new Paragraph({ children: [new TextRun({ text: linea.nombre, bold: true, size: 21 })] }),
      new Paragraph({
        spacing: { after: linea.tipo && ROTULO_FIRMA[linea.tipo] ? 0 : 520 },
        children: [new TextRun({ text: linea.rol, size: 20 })],
      }),
    );
    if (linea.tipo && ROTULO_FIRMA[linea.tipo]) {
      cuerpo.push(
        new Paragraph({
          spacing: { after: 520 },
          children: [new TextRun({ text: ROTULO_FIRMA[linea.tipo] as string, bold: true, size: 18 })],
        }),
      );
    }
  }

  return cuerpo;
}

function construirDocumento(doc: DocumentoLegal, membreteDataUrl?: string | null): Document {
  return new Document({
    title: `${doc.tituloDocumento} ${doc.proceso}`,
    subject: doc.epigrafe ?? doc.tituloDocumento,
    sections: [{ children: construirCuerpo(doc, membreteDataUrl) }],
  });
}

/** Genera el .docx como Blob — para previsualizar o subir sin descargar localmente. */
export async function generarDocumentoLegalDocxBlob(doc: DocumentoLegal, membreteDataUrl?: string | null): Promise<Blob> {
  return Packer.toBlob(construirDocumento(doc, membreteDataUrl));
}

/** Genera y descarga el documento como .docx (editable en Word), con el mismo layout que el PDF. */
export async function descargarDocumentoLegalDocx(doc: DocumentoLegal, membreteDataUrl?: string | null): Promise<void> {
  const blob = await generarDocumentoLegalDocxBlob(doc, membreteDataUrl);
  descargarBlob(blob, `${doc.tituloDocumento} ${doc.proceso}.docx`);
}
