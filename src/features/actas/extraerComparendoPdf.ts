import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { TipoMulta } from '@/derecho';
import type { Comparendo } from './comparendos';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extracción de datos de la orden de comparendo a partir del texto del PDF.
 * Soporta el export del portal RNMC (pares "Etiqueta : Valor") y, como
 * respaldo, el formato clásico de la orden en papel. Los comparendos escaneados
 * como imagen requieren OCR del backend: en ese caso se diligencia manualmente.
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

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Valor que sigue a "Etiqueta :" en el export del portal RNMC, tomado hasta la
 * próxima etiqueta (secuencia de hasta 4 palabras capitalizadas terminada en
 * ":"). Así "Dirección Ingresada : CALLE 55 CARRERA 9 A 60 Tipo Lugar :"
 * devuelve la dirección completa sin confundir "CALLE"/"CARRERA" con etiquetas.
 */
function valorRnmc(texto: string, etiqueta: string): string | undefined {
  // Las etiquetas del portal son Título (May+min: "Nombres", "Tipo Lugar",
  // "Custodia Menor o Patria Potestad"); los valores van en MAYÚSCULA
  // ("MUÑOZ GONZALEZ", "CAI SAMARIA"). Distinguir por caso evita cortar el
  // valor en su primera palabra en mayúscula. Case-sensitive a propósito.
  const titulo = '[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+';
  const conector = '(?:de|del|la|las|los|o|y|e|a|con|en|al)';
  const siguienteEtiqueta = `${titulo}(?:\\s+(?:${titulo}|${conector})){0,5}\\s*:`;
  const re = new RegExp(
    `${escaparRegex(etiqueta)}\\s*:\\s*(.+?)\\s*(?=\\s${siguienteEtiqueta}|$)`,
  );
  const valor = re.exec(texto)?.[1]?.trim();
  return valor && valor.length > 0 ? valor : undefined;
}

function buscarFecha(texto: string): string | undefined {
  // Formato ISO del portal RNMC: "Fecha : 2026-06-09" (no la fecha de nacimiento).
  const iso = /\bFecha\s*:\s*(20\d{2})-(\d{2})-(\d{2})\b/.exec(texto);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
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

/** Valor tras una etiqueta en el formato clásico (respaldo del RNMC). */
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

  const asignar = <K extends keyof Comparendo>(campo: K, valor: Comparendo[K] | undefined) => {
    if (valor === undefined || valor === '' || (typeof valor === 'string' && valor.trim() === '')) return;
    datos[campo] = valor;
    camposDetectados.push(campo);
  };

  // Número: el del expediente en detalle ("Medida: ... | 17-... |"), no el
  // primero de la tabla de bandeja; luego los formatos clásicos.
  asignar('comparendo',
    /Medida:\s*[^|]*\|\s*(\d{1,2}-\d{3}-\d-\d{4}-\d{1,6})/i.exec(texto)?.[1] ??
    /\b(\d{1,2}-\d{3}-\d-\d{4}-\d{1,6})\b/.exec(texto)?.[1] ??
    /\b(\d{1,2}-\d{3}-\d{5,8})\b/.exec(texto)?.[1]);

  // Nombre = Nombres + Apellidos (orden natural), respaldo formato clásico.
  const apellidos = valorRnmc(texto, 'Apellidos');
  const nombres = valorRnmc(texto, 'Nombres');
  const solicitadoRnmc = [nombres, apellidos].filter(Boolean).join(' ').trim();
  asignar('solicitado',
    (solicitadoRnmc ||
      despuesDe(texto, [
        'APELLIDOS Y NOMBRES DEL INFRACTOR',
        'APELLIDOS Y NOMBRES',
        'NOMBRE DEL INFRACTOR',
        'PRESUNTO INFRACTOR',
      ]))?.toUpperCase());

  asignar('cedula',
    valorRnmc(texto, 'Número Identificación')?.match(/\d{6,10}/)?.[0] ??
    /(?:C\.?C\.?|CEDULA|CÉDULA|DOCUMENTO|IDENTIFICACI[ÓO]N)[^\d]{0,25}(\d{6,10})\b/i.exec(texto)?.[1]);

  asignar('telefono',
    valorRnmc(texto, 'Teléfono')?.match(/3\d{9}|\d{7,10}/)?.[0] ??
    /(?:TEL[ÉE]FONO|CELULAR)[^\d]{0,15}(3\d{9}|\d{7,10})/i.exec(texto)?.[1]);

  // Dos "Dirección Ingresada": la de Ubicación (hechos) y la de Domicilio
  // (residencia). Se separan por la posición de "Domicilio :".
  const domIdx = texto.search(/Domicilio\s*:/i);
  const direccion =
    (domIdx >= 0 ? valorRnmc(texto.slice(domIdx), 'Dirección Ingresada') : undefined) ??
    valorRnmc(texto, 'Dirección Ingresada') ??
    despuesDe(texto, ['DIRECCIÓN DE RESIDENCIA', 'DIRECCION DE RESIDENCIA', 'RESIDENCIA']);
  asignar('direccion', direccion?.toUpperCase());

  const lugar =
    valorRnmc(texto.slice(0, domIdx >= 0 ? domIdx : texto.length), 'Dirección Ingresada') ??
    despuesDe(texto, [
      'LUGAR DE LOS HECHOS',
      'DIRECCIÓN DE LOS HECHOS',
      'DIRECCION DONDE OCURRIERON LOS HECHOS',
      'SITIO DE LOS HECHOS',
    ]);
  asignar('lugar', lugar?.toUpperCase());

  asignar('fechaComparendo', buscarFecha(texto));

  const art = /\bArticulo\s*:\s*(\d{1,3})/i.exec(texto)?.[1];
  const num = /\bNumeral\s*:\s*(\d{1,3})/i.exec(texto)?.[1];
  const articuloClasico = /ART[ÍI]?C?U?L?O?\.?\s*(\d{1,3})\s*[,.·]?\s*NUM(?:ERAL)?\.?\s*(\d{1,2})/i.exec(texto);
  asignar('articuloNumeral',
    art && num
      ? `Artículo ${art} Numeral ${num}`
      : articuloClasico
        ? `Artículo ${articuloClasico[1]} Numeral ${articuloClasico[2]}`
        : undefined);

  const tipo =
    /Medida:\s*Multa\s+General\s+Tipo\s*(\d)/i.exec(texto)?.[1] ??
    /MULTA\s+GENERAL\s+TIPO\s*[:.]?\s*([1-4])/i.exec(texto)?.[1] ??
    /\bTIPO\s*[:.]?\s*([1-4])\b/.exec(texto)?.[1];
  if (tipo) asignar('tipoMulta', Number(tipo) as TipoMulta);

  asignar('solicitante',
    valorRnmc(texto, 'Cai')?.replace(/\s+/g, ' ').trim() ??
    /\b(CAI\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,30})\b/.exec(normalizar(texto))?.[1]?.trim());

  const conducta = valorRnmc(texto, 'Literal')?.replace(/^[a-z]\.\s*/i, '');
  asignar('descripcionConducta', conducta);

  const hechos =
    valorRnmc(texto, 'Descripcion Hechos') ??
    despuesDe(texto, [
      'DESCRIPCIÓN DEL COMPORTAMIENTO',
      'DESCRIPCION DEL COMPORTAMIENTO',
      'RELATO DEL HECHO',
      'OBSERVACIONES',
    ]);
  if (hechos && hechos.length > 15) asignar('hechos', hechos);

  return { datos, camposDetectados, textoDisponible: true };
}
