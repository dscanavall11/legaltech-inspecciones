import JSZip from 'jszip';
import { escaparXml } from './mergeFieldDocx';
import type { LiquidacionMulta } from '@/derecho/multas';

/**
 * Verificación posterior a la generación de CADA Acta de Firmeza masiva —
 * "confiabilidad antes que velocidad": el .docx ya generado se vuelve a abrir
 * como OOXML/ZIP y se compara byte a byte contra los datos que debía traer,
 * antes de decidir si entra al .zip final. Ningún acta se agrega al .zip sin
 * pasar por aquí.
 *
 * Reutiliza exactamente la misma detección de "valor cacheado" que ya
 * probaba `plantillasOficiales.integration.test.ts` a mano — ahora vive aquí
 * para que la misma regla corra en producción, fila por fila, no solo en un
 * escenario de prueba fijo.
 */

/** Runs de resultado cacheado (justo después de "separate") — el dato del caso real que traía la plantilla, no su texto fijo. */
export function extraerValoresCacheadosDocx(xmlPlantillaOriginal: string): string[] {
  return [
    ...xmlPlantillaOriginal.matchAll(
      /fldCharType="separate"\/><\/w:r><w:r\b[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>([^<]+)<\/w:t>/g,
    ),
  ]
    .map((m) => m[1])
    .filter((t) => t.trim().length > 4); // valores cortos (un dígito, una letra) no son un dato personal identificable
}

export interface VerificacionIntegridadActa {
  ok: boolean;
  /** Solo cuando ok=false — el motivo exacto, listo para mostrar en el reporte. */
  motivo?: string;
}

export interface DatosVerificacionActa {
  /**
   * Valores cacheados del caso real que traía la plantilla original, ya
   * extraídos con `extraerValoresCacheadosDocx` — se calcula una sola vez por
   * plantilla y se reutiliza para cada fila del lote que comparte el mismo
   * archivo (repetir el parseo del ZIP original por cada fila sería costoso
   * sin aportar nada distinto).
   */
  valoresCacheadosPlantilla: string[];
  /** El .docx ya generado para este registro. */
  blobGenerado: Blob;
  /** El mismo objeto de campos MERGEFIELD → valor usado para generar — única fuente de comparación. */
  camposEsperados: Record<string, string>;
  valoresFijosEsperados: { anioVigenciaLetras: string; valorTotalLetras?: string };
  /** Para el punto 6 (plantilla correcta): carpeta del archivo elegido y género resuelto de esta fila. */
  archivoPlantilla: string;
  generoResuelto: 'masculino' | 'femenino';
  /** Para el punto 7 (cálculo): se revalida la aritmética base+incremento=total, no solo que el texto esté presente. */
  liquidacion: LiquidacionMulta;
}

/**
 * Verifica, en este orden, que el .docx generado:
 *  1) sea un ZIP/OOXML válido, no vacío, con word/document.xml;
 *  2) la plantilla usada corresponda al género resuelto de la fila;
 *  3) la aritmética de la liquidación sea consistente (base + incremento = total);
 *  4) traiga TODOS los datos esperados (los mismos que se usaron para generarlo);
 *  5) no conserve NINGÚN valor cacheado del caso real que traía la plantilla
 *     original, salvo que coincida por casualidad con un valor correcto de
 *     esta liquidación (p. ej. el SMDLV en letras es el mismo para cualquier
 *     caso del mismo tipo — no es un residuo, es la fórmula legal).
 */
export async function verificarIntegridadActaGenerada(datos: DatosVerificacionActa): Promise<VerificacionIntegridadActa> {
  const { valoresCacheadosPlantilla, blobGenerado, camposEsperados, valoresFijosEsperados, archivoPlantilla, generoResuelto, liquidacion } =
    datos;

  // 1) Estructura DOCX válida.
  if (blobGenerado.size === 0) {
    return { ok: false, motivo: 'ERROR DE INTEGRIDAD DOCUMENTAL — el archivo generado está vacío' };
  }
  let zipSalida: JSZip;
  try {
    zipSalida = await JSZip.loadAsync(await blobGenerado.arrayBuffer());
  } catch {
    return { ok: false, motivo: 'ERROR DE INTEGRIDAD DOCUMENTAL — el archivo generado no es un .docx/ZIP válido' };
  }
  const docXml = zipSalida.file('word/document.xml');
  if (!docXml) {
    return { ok: false, motivo: 'ERROR DE INTEGRIDAD DOCUMENTAL — el archivo generado no contiene word/document.xml' };
  }
  const xmlSalida = await docXml.async('string');

  // 2) La plantilla elegida corresponde al género resuelto de esta fila
  //    (las plantillas femeninas viven bajo "Femenino/"; las masculinas, en la raíz).
  const esPlantillaFemenina = archivoPlantilla.startsWith('Femenino/');
  if (esPlantillaFemenina !== (generoResuelto === 'femenino')) {
    return {
      ok: false,
      motivo: 'ERROR DE INTEGRIDAD DOCUMENTAL — la plantilla usada no corresponde al género de este registro',
    };
  }

  // 3) Aritmética de la liquidación: base + incremento = total.
  if (liquidacion.valorBase + liquidacion.valorIncremento !== liquidacion.valorTotal) {
    return {
      ok: false,
      motivo: 'ERROR DE INTEGRIDAD DOCUMENTAL — el valor total no coincide con base + incremento',
    };
  }

  // 4) Todos los datos esperados están presentes (la misma fuente que llenó la plantilla).
  for (const [campo, valor] of Object.entries(camposEsperados)) {
    if (!valor) continue; // campo intencionalmente vacío (p. ej. sin representante legal) no se exige
    if (!xmlSalida.includes(escaparXml(valor))) {
      return { ok: false, motivo: `ERROR DE INTEGRIDAD DOCUMENTAL — falta el dato de "${campo}" en el documento generado` };
    }
  }
  if (valoresFijosEsperados.anioVigenciaLetras && !xmlSalida.includes(escaparXml(valoresFijosEsperados.anioVigenciaLetras))) {
    return { ok: false, motivo: 'ERROR DE INTEGRIDAD DOCUMENTAL — falta el año de vigencia esperado' };
  }
  if (valoresFijosEsperados.valorTotalLetras && !xmlSalida.includes(escaparXml(valoresFijosEsperados.valorTotalLetras))) {
    return { ok: false, motivo: 'ERROR DE INTEGRIDAD DOCUMENTAL — falta el valor total esperado' };
  }

  // 5) Cero residuos del caso real que traía la plantilla original.
  const legitimos = new Set(
    [...Object.values(camposEsperados), valoresFijosEsperados.anioVigenciaLetras, valoresFijosEsperados.valorTotalLetras].filter(
      (v): v is string => Boolean(v),
    ),
  );
  for (const valorCacheado of valoresCacheadosPlantilla) {
    if (legitimos.has(valorCacheado)) continue;
    if (xmlSalida.includes(valorCacheado)) {
      return { ok: false, motivo: 'ERROR DE INTEGRIDAD DOCUMENTAL — DATO RESIDUAL' };
    }
  }

  return { ok: true };
}
