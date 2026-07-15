import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { TipoMulta } from '@/derecho';
import type { Comparendo } from './comparendos';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extracción de datos de la orden de comparendo (formato RNMC de la Policía
 * Nacional) a partir del texto del PDF. Funciona con PDFs digitales (con capa
 * de texto); los comparendos escaneados como imagen requieren el OCR/agente
 * de IA del backend — en ese caso se informa y se diligencia manualmente.
 */
export interface ExtraccionComparendo {
  datos: Partial<Comparendo>;
  camposDetectados: (keyof Comparendo)[];
  textoDisponible: boolean;
}

async function textoDelPdf(archivo: File): Promise<string> {
  const buffer = await archivo.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const partes: string[] = [];
  for (let p = 1; p <= Math.min(doc.numPages, 4); p++) {
    const pagina = await doc.getPage(p);
    const contenido = await pagina.getTextContent();
    partes.push(
      contenido.items
        .map((i) => ('str' in i ? i.str : ''))
        .join(' '),
    );
  }
  return partes.join('\n').replace(/\s+/g, ' ').trim();
}

const MESES_NUM: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

function buscarFecha(texto: string): string | undefined {
  // dd/mm/aaaa o dd-mm-aaaa
  const numerica = /\b([0-3]?\d)[/-]([01]?\d)[/-](20\d{2})\b/.exec(texto);
  if (numerica) {
    return `${numerica[3]}-${numerica[2].padStart(2, '0')}-${numerica[1].padStart(2, '0')}`;
  }
  // "24 de abril de 2026"
  const letras = /\b([0-3]?\d)\s+de\s+([a-záéíóúñ]+)\s+de[l]?\s+(20\d{2})\b/i.exec(texto);
  if (letras && MESES_NUM[letras[2].toLowerCase()]) {
    return `${letras[3]}-${MESES_NUM[letras[2].toLowerCase()]}-${letras[1].padStart(2, '0')}`;
  }
  return undefined;
}

/** Valor que sigue a una etiqueta, hasta la próxima etiqueta en mayúsculas. */
function despuesDe(texto: string, etiquetas: string[]): string | undefined {
  const t = normalizar(texto);
  for (const etiqueta of etiquetas) {
    const idx = t.indexOf(normalizar(etiqueta));
    if (idx === -1) continue;
    const desde = idx + etiqueta.length;
    const fragmento = texto.slice(desde, desde + 140);
    const valor = fragmento
      .replace(/^[\s:.]+/, '')
      .split(/\s{2,}|(?=[A-ZÁÉÍÓÚÑ]{4,}[\s:])/)[0]
      ?.trim();
    if (valor && valor.length > 2) return valor.slice(0, 90);
  }
  return undefined;
}

export async function extraerComparendoPdf(archivo: File): Promise<ExtraccionComparendo> {
  const texto = await textoDelPdf(archivo);
  const datos: Partial<Comparendo> = {};
  const camposDetectados: (keyof Comparendo)[] = [];

  if (texto.length < 60) {
    return { datos, camposDetectados, textoDisponible: false };
  }

  // Número de comparendo: 17-001-6-2026-1398 / 17-001-085044
  const numero =
    /\b(\d{1,2}-\d{3}-\d-\d{4}-\d{1,6})\b/.exec(texto)?.[1] ??
    /\b(\d{1,2}-\d{3}-\d{5,8})\b/.exec(texto)?.[1];
  if (numero) {
    datos.comparendo = numero;
    camposDetectados.push('comparendo');
  }

  // Cédula: 6 a 10 dígitos cerca de una etiqueta de documento
  const cedula =
    /(?:C\.?C\.?|CEDULA|CÉDULA|DOCUMENTO|IDENTIFICACI[ÓO]N)[^\d]{0,25}(\d{6,10})\b/i.exec(texto)?.[1];
  if (cedula) {
    datos.cedula = cedula;
    camposDetectados.push('cedula');
  }

  const nombre = despuesDe(texto, [
    'APELLIDOS Y NOMBRES DEL INFRACTOR',
    'APELLIDOS Y NOMBRES',
    'NOMBRE DEL INFRACTOR',
    'PRESUNTO INFRACTOR',
  ]);
  if (nombre) {
    datos.solicitado = nombre.toUpperCase();
    camposDetectados.push('solicitado');
  }

  const direccion = despuesDe(texto, ['DIRECCIÓN DE RESIDENCIA', 'DIRECCION DE RESIDENCIA', 'RESIDENCIA', 'DIRECCIÓN']);
  if (direccion) {
    datos.direccion = direccion.toUpperCase();
    camposDetectados.push('direccion');
  }

  const telefono = /(?:TEL[ÉE]FONO|CELULAR)[^\d]{0,15}(3\d{9}|\d{7,10})/i.exec(texto)?.[1];
  if (telefono) {
    datos.telefono = telefono;
    camposDetectados.push('telefono');
  }

  const lugar = despuesDe(texto, [
    'LUGAR DE LOS HECHOS',
    'DIRECCIÓN DE LOS HECHOS',
    'DIRECCION DONDE OCURRIERON LOS HECHOS',
    'SITIO DE LOS HECHOS',
  ]);
  if (lugar) {
    datos.lugar = lugar.toUpperCase();
    camposDetectados.push('lugar');
  }

  const fecha = buscarFecha(texto);
  if (fecha) {
    datos.fechaComparendo = fecha;
    camposDetectados.push('fechaComparendo');
  }

  // Artículo y numeral del CNSCC
  const articulo = /ART[ÍI]?C?U?L?O?\.?\s*(\d{1,3})\s*[,.·]?\s*NUM(?:ERAL)?\.?\s*(\d{1,2})/i.exec(texto);
  if (articulo) {
    datos.articuloNumeral = `Artículo ${articulo[1]} Numeral ${articulo[2]}`;
    camposDetectados.push('articuloNumeral');
  }

  const tipo = /MULTA\s+GENERAL\s+TIPO\s*[:.]?\s*([1-4])\b/i.exec(texto)?.[1] ??
    /\bTIPO\s*[:.]?\s*([1-4])\b/.exec(texto)?.[1];
  if (tipo) {
    datos.tipoMulta = Number(tipo) as TipoMulta;
    camposDetectados.push('tipoMulta');
  }

  const cai = /\b(CAI\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,30})\b/.exec(normalizar(texto))?.[1];
  if (cai) {
    datos.solicitante = cai.trim();
    camposDetectados.push('solicitante');
  }

  const hechos = despuesDe(texto, [
    'DESCRIPCIÓN DEL COMPORTAMIENTO',
    'DESCRIPCION DEL COMPORTAMIENTO',
    'RELATO DEL HECHO',
    'OBSERVACIONES',
  ]);
  if (hechos && hechos.length > 15) {
    datos.hechos = hechos;
    camposDetectados.push('hechos');
  }

  return { datos, camposDetectados, textoDisponible: true };
}
