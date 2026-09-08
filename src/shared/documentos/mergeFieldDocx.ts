import JSZip from 'jszip';

/**
 * Motor de reemplazo para plantillas DOCX reales del despacho.
 *
 * Las plantillas oficiales (carpeta `public/plantillas/`) NO usan marcadores
 * de texto tipo `{TAG}`: usan campos de combinación de correspondencia
 * nativos de Word (Insertar > Campo > MERGEFIELD), que Word representa como
 * tres piezas encadenadas dentro de un mismo párrafo:
 *
 *   <w:fldChar w:fldCharType="begin"/>
 *   <w:instrText> MERGEFIELD NombreDelCampo </w:instrText>
 *   <w:fldChar w:fldCharType="separate"/>
 *   <w:t>valor cacheado de la última vez que se combinó</w:t>   ← se reemplaza
 *   <w:fldChar w:fldCharType="end"/>
 *
 * `docx` (patchDocument) no entiende esta estructura — está pensado para
 * texto literal `{tag}`. Este módulo edita el OOXML directamente: ubica cada
 * campo por su nombre real (el mismo que ya usa el despacho en Word) y
 * sustituye únicamente el/los run(s) de resultado, conservando el resto del
 * documento — membrete, logos, tablas, negritas, cursivas, subrayados,
 * alineación, saltos y pie de página — sin tocarlo.
 *
 * Un campo del mismo nombre puede repetirse muchas veces en el documento
 * (así funciona la combinación de correspondencia de Word): todas sus
 * apariciones reciben el mismo valor.
 */

const RUN_RE = /<w:r\b[\s\S]*?<\/w:r>/g;
const RPR_RE = /<w:rPr>[\s\S]*?<\/w:rPr>/;

export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface CampoDetectado {
  nombre: string;
  /** Posición del primer run de resultado (o, si no hay resultado cacheado, del run "separate"). */
  inicioResultado: number;
  /** Posición justo después del último run de resultado (o del run "separate" si no hay resultado). */
  finResultado: number;
  /** rPr (formato) a reutilizar en el run de reemplazo. */
  rPr: string;
}

/** Recorre el XML de una parte del documento (document.xml, header*.xml, footer*.xml) y localiza cada campo MERGEFIELD. */
function detectarCampos(xml: string): CampoDetectado[] {
  const campos: CampoDetectado[] = [];
  let estado: null | {
    instrBuf: string;
    rPrInstr: string;
    separateFin: number | null;
    resultadoInicio: number | null;
    resultadoFin: number | null;
    rPrResultado: string | null;
  } = null;

  RUN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RUN_RE.exec(xml))) {
    const run = m[0];
    const inicio = m.index;
    const fin = inicio + run.length;

    if (/<w:fldChar\b[^>]*w:fldCharType="begin"/.test(run)) {
      estado = { instrBuf: '', rPrInstr: '', separateFin: null, resultadoInicio: null, resultadoFin: null, rPrResultado: null };
      continue;
    }
    if (!estado) continue;

    if (estado.separateFin === null && /<w:instrText\b/.test(run)) {
      const texto = /<w:instrText\b[^>]*>([\s\S]*?)<\/w:instrText>/.exec(run);
      if (texto) estado.instrBuf += texto[1];
      const rPr = RPR_RE.exec(run);
      if (rPr) estado.rPrInstr = rPr[0];
      continue;
    }
    if (estado.separateFin === null && /<w:fldChar\b[^>]*w:fldCharType="separate"/.test(run)) {
      estado.separateFin = fin;
      continue;
    }
    if (/<w:fldChar\b[^>]*w:fldCharType="end"/.test(run)) {
      const nombre = estado.instrBuf.replace(/^\s*MERGEFIELD\s+/i, '').trim();
      if (nombre) {
        // Campo nunca combinado (sin "separate", p. ej. una columna que nunca tuvo
        // dato de origen): se inserta el resultado justo antes de este run "end".
        const puntoSinResultado = estado.separateFin ?? inicio;
        campos.push({
          nombre,
          inicioResultado: estado.resultadoInicio ?? puntoSinResultado,
          finResultado: estado.resultadoFin ?? puntoSinResultado,
          rPr: estado.rPrResultado ?? estado.rPrInstr,
        });
      }
      estado = null;
      continue;
    }
    if (estado.separateFin !== null) {
      // Run de resultado cacheado (uno o varios entre "separate" y "end").
      if (estado.resultadoInicio === null) estado.resultadoInicio = inicio;
      estado.resultadoFin = fin;
      if (!estado.rPrResultado) {
        const rPr = RPR_RE.exec(run);
        if (rPr) estado.rPrResultado = rPr[0];
      }
    }
  }
  return campos;
}

export interface ResultadoReemplazoMerge {
  xml: string;
  /** Nombres de campo encontrados en esta parte del documento. */
  camposEncontrados: string[];
  /** Campos encontrados en la plantilla para los que no había valor en el mapa de datos (se dejan en blanco, nunca con el dato cacheado de ejemplo). */
  camposSinDato: string[];
}

/** Sustituye, en un fragmento de OOXML, cada campo MERGEFIELD por su valor — o por vacío si no hay dato, nunca dejando el valor cacheado de una combinación anterior. */
export function reemplazarCamposMerge(xml: string, valores: Record<string, string>): ResultadoReemplazoMerge {
  const campos = detectarCampos(xml);
  const camposEncontrados = [...new Set(campos.map((c) => c.nombre))];
  const camposSinDato = camposEncontrados.filter((n) => !(n in valores));

  // Aplicar de atrás hacia adelante para no invalidar los índices ya calculados.
  let salida = xml;
  for (let i = campos.length - 1; i >= 0; i--) {
    const campo = campos[i];
    const valor = valores[campo.nombre] ?? '';
    const nuevoRun = `<w:r>${campo.rPr}<w:t xml:space="preserve">${escaparXml(valor)}</w:t></w:r>`;
    salida = salida.slice(0, campo.inicioResultado) + nuevoRun + salida.slice(campo.finResultado);
  }
  return { xml: salida, camposEncontrados, camposSinDato };
}

const PARTES_CON_CAMPOS = /^word\/(document|header\d*|footer\d*)\.xml$/;

export interface ResultadoGenerarDocx {
  blob: Blob;
  camposEncontrados: string[];
  camposSinDato: string[];
}

/**
 * Abre el DOCX real (plantilla oficial), reemplaza los MERGEFIELD por los
 * datos del registro en document.xml y en cualquier header/footer que
 * también los use, y reempaqueta el archivo — todo lo demás (membrete,
 * logos, tablas, estilos) queda intacto porque nunca se toca.
 */
export async function generarDocxDesdeMergeFields(
  plantilla: ArrayBuffer,
  valores: Record<string, string>,
  /**
   * Se ejecuta sobre el XML de cada parte (document.xml, headers, footers)
   * DESPUÉS de reemplazar los MERGEFIELD — para reparar texto fijo residual
   * que no es un campo (ver `textoFijoDocx.ts`). Recibe y devuelve el XML de
   * esa parte; si no aplica ninguna reparación, debe devolverlo sin cambios.
   */
  posprocesarXml?: (nombreParte: string, xml: string) => string,
): Promise<ResultadoGenerarDocx> {
  const zip = await JSZip.loadAsync(plantilla);
  const camposEncontrados = new Set<string>();
  const camposSinDato = new Set<string>();

  for (const nombre of Object.keys(zip.files)) {
    if (!PARTES_CON_CAMPOS.test(nombre)) continue;
    const archivo = zip.file(nombre);
    if (!archivo) continue;
    const xmlOriginal = await archivo.async('string');
    const resultado = reemplazarCamposMerge(xmlOriginal, valores);
    resultado.camposEncontrados.forEach((c) => camposEncontrados.add(c));
    resultado.camposSinDato.forEach((c) => camposSinDato.add(c));
    const xmlFinal = posprocesarXml ? posprocesarXml(nombre, resultado.xml) : resultado.xml;
    if (xmlFinal !== xmlOriginal) zip.file(nombre, xmlFinal);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  return { blob, camposEncontrados: [...camposEncontrados], camposSinDato: [...camposSinDato] };
}
