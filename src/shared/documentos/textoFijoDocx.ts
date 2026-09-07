/**
 * Reparador de TEXTO FIJO residual en las plantillas oficiales reales.
 *
 * Hallazgo bloqueante (revisión de PR #7): en las plantillas de Acta de
 * Firmeza, dos valores dependen del caso pero NO son MERGEFIELD — son texto
 * plano que quedó tecleado del último caso real combinado en Word:
 *   1) El año de "vigencia" junto a `valor_Salarios`
 *      (p. ej. "para la vigencia dos mil veintiséis (2026)").
 *   2) En las plantillas de REINCIDENCIA, el "VALOR TOTAL A RECAUDAR"
 *      (base + incremento) — una frase completa con el monto en letras.
 * Si no se corrigen, el documento generado conserva el año o el valor total
 * de OTRO ciudadano. Ninguno de los dos puede quedar así: mergeFieldDocx.ts
 * no los toca porque no son campos.
 *
 * Este módulo NO reconstruye el documento: localiza el run (o los runs —
 * Word parte frecuentemente una misma frase en varios runs por historial de
 * edición/autocorrección) que contienen el texto fijo dentro del párrafo que
 * lo ancla, y los colapsa en un único run nuevo con el mismo formato
 * (`rPr`) del primero, dejando el resto del documento intacto.
 */

const PARRAFO_RE = /<w:p\b[\s\S]*?<\/w:p>/g;
const RUN_CON_TEXTO_RE = /<w:r\b[\s\S]*?<w:t[^>]*>([^<]*)<\/w:t>[\s\S]*?<\/w:r>/g;
const RPR_RE = /<w:rPr>[\s\S]*?<\/w:rPr>/;

function escaparXml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface RunTexto {
  start: number;
  end: number;
  texto: string;
  rPr: string;
}

function runsDeTexto(parrafoXml: string): RunTexto[] {
  const runs: RunTexto[] = [];
  RUN_CON_TEXTO_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RUN_CON_TEXTO_RE.exec(parrafoXml))) {
    const rPr = RPR_RE.exec(m[0]);
    runs.push({ start: m.index, end: m.index + m[0].length, texto: m[1], rPr: rPr ? rPr[0] : '' });
  }
  return runs;
}

/**
 * Busca `patronValor` en el texto plano del párrafo (concatenando solo los
 * runs con `<w:t>`) y, si aparece, colapsa los runs que lo contienen en uno
 * solo con `nuevoValor`, preservando el `rPr` del primer run abarcado.
 * Devuelve el párrafo sin cambios si `ancla` no aparece en su texto plano —
 * así una misma pasada puede recorrer todo el documento sin arriesgarse a
 * tocar un párrafo ajeno a este texto fijo conocido.
 */
function repararParrafo(
  parrafoXml: string,
  ancla: RegExp,
  patronValor: RegExp,
  nuevoValor: string,
): { xml: string; aplicado: boolean } {
  const runs = runsDeTexto(parrafoXml);
  const plano = runs.map((r) => r.texto).join('');
  if (!ancla.test(plano)) return { xml: parrafoXml, aplicado: false };

  patronValor.lastIndex = 0;
  const match = patronValor.exec(plano);
  if (!match) return { xml: parrafoXml, aplicado: false };

  const matchStart = match.index;
  const matchEnd = matchStart + match[0].length;

  let acumulado = 0;
  let primerRun = -1;
  let ultimoRun = -1;
  let offsetEnPrimero = 0;
  let offsetEnUltimo = 0;
  for (let i = 0; i < runs.length; i++) {
    const inicioRun = acumulado;
    const finRun = acumulado + runs[i].texto.length;
    if (primerRun === -1 && matchStart < finRun) {
      primerRun = i;
      offsetEnPrimero = matchStart - inicioRun;
    }
    if (matchEnd <= finRun) {
      ultimoRun = i;
      offsetEnUltimo = matchEnd - inicioRun;
      break;
    }
    acumulado = finRun;
  }
  if (primerRun === -1 || ultimoRun === -1) return { xml: parrafoXml, aplicado: false };

  const prefijo = runs[primerRun].texto.slice(0, offsetEnPrimero);
  const sufijo = runs[ultimoRun].texto.slice(offsetEnUltimo);
  const nuevoRun = `<w:r>${runs[primerRun].rPr}<w:t xml:space="preserve">${escaparXml(prefijo + nuevoValor + sufijo)}</w:t></w:r>`;

  const xml = parrafoXml.slice(0, runs[primerRun].start) + nuevoRun + parrafoXml.slice(runs[ultimoRun].end);
  return { xml, aplicado: true };
}

export interface ReparacionValoresFijos {
  xml: string;
  /** Etiquetas de las reparaciones aplicadas (para pruebas y depuración). */
  aplicadas: string[];
}

/**
 * Repara, sobre el documento completo, el año de vigencia y (si se pasa) el
 * valor total con incremento de las plantillas de reincidencia. Cada
 * reparación es opcional e independiente: si el patrón no aparece (p. ej.
 * una plantilla "sin reincidencia" no tiene frase de total), no se toca nada.
 */
export function repararValoresFijosActaFirmeza(
  xml: string,
  opciones: { anioVigenciaLetras: string; valorTotalLetras?: string },
): ReparacionValoresFijos {
  const aplicadas: string[] = [];

  PARRAFO_RE.lastIndex = 0;
  let salida = '';
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = PARRAFO_RE.exec(xml))) {
    let parrafo = m[0];

    // 1) "... para la vigencia|para el año <año en letras> (AAAA), equivalentes ..."
    const r1 = repararParrafo(
      parrafo,
      /vigencia|para el año/i,
      // Ancla en "dos mil" (todas las vigencias de esta plataforma caen en esa
      // década-milenio) para no comerse el texto fijo anterior ("vigencia ",
      // "para el año ") cuando el límite superior del cuantificador se alcanza.
      /dos mil[a-záéíóúñ\s]{0,20}\(\d{4}\)/,
      opciones.anioVigenciaLetras,
    );
    if (r1.aplicado) {
      parrafo = r1.xml;
      aplicadas.push('vigencia');
    }

    // 2) "... VALOR TOTAL A RECAUDAR ... corresponde a la suma de <TOTAL EN LETRAS PESOS MCTE ($X)>."
    if (opciones.valorTotalLetras) {
      const r2 = repararParrafo(
        parrafo,
        /VALOR TOTAL A RECAUDAR/,
        /[A-ZÁÉÍÓÚÑ\s]{5,120}PESOS MCTE\s*\([^)]*\)\.?/,
        `${opciones.valorTotalLetras}.`,
      );
      if (r2.aplicado) {
        parrafo = r2.xml;
        aplicadas.push('valorTotal');
      }
    }

    salida += xml.slice(cursor, m.index) + parrafo;
    cursor = m.index + m[0].length;
  }
  salida += xml.slice(cursor);

  return { xml: salida, aplicadas };
}

/** Repara el "AÑO:" fijo de la carátula del expediente (texto plano, no MERGEFIELD). */
export function repararAnioCaratulaExpediente(xml: string, anio: string): ReparacionValoresFijos {
  PARRAFO_RE.lastIndex = 0;
  let salida = '';
  let cursor = 0;
  let m: RegExpExecArray | null;
  const aplicadas: string[] = [];
  while ((m = PARRAFO_RE.exec(xml))) {
    let parrafo = m[0];
    const r = repararParrafo(parrafo, /AÑO:/, /\d{4}/, anio);
    if (r.aplicado) {
      parrafo = r.xml;
      aplicadas.push('anioCaratula');
    }
    salida += xml.slice(cursor, m.index) + parrafo;
    cursor = m.index + m[0].length;
  }
  salida += xml.slice(cursor);
  return { xml: salida, aplicadas };
}
