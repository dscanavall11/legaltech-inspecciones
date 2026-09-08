import JSZip from 'jszip';
import { compararPorProceso, type Comparendo } from '@/features/actas/comparendos';
import { validarFilaParaActaMasiva } from '@/derecho/plantillas/generacionMasivaActas';
import {
  mapearCamposActaFirmezaOficial,
  nombreArchivoActaFirmezaOficial,
  valoresFijosActaFirmeza,
} from '@/derecho/plantillas/actaFirmezaOficial';
import type { CausalIncremento } from '@/derecho';
import {
  cargarPlantillaActaFirmeza,
  generarActaFirmezaOficialDocxBlob,
  PlantillaActaFirmezaNoDisponibleError,
} from './actaFirmezaOficialDocx';
import { descargarBlob } from './descargarBlob';

/**
 * Modo masivo de Acta de Firmeza — para cada fila reutiliza EXACTAMENTE la
 * misma cadena que la generación individual (validación, detección de
 * género, catálogo de plantillas, MERGEFIELD + reparo de texto fijo): no
 * hay una segunda lógica. Solo se agrega la orquestación por lote y el
 * empaquetado en un .zip.
 *
 * `Incidente` decide, antes que cualquier otra cosa, si una fila entra
 * siquiera a validarse: las filas que no son FIRMEZA se separan primero
 * (barato: una sola comparación de texto) y NUNCA llegan a detectar género,
 * liquidar la multa ni tocar una plantilla — así lo pidió el despacho.
 */

export type EstadoFilaMasiva = 'generado' | 'con_observaciones' | 'excluido_estado' | 'no_generado';

const ETIQUETA_CAUSAL: Record<CausalIncremento, string> = {
  ninguna: 'SIN REINCIDENCIA',
  reiteracion_despues_del_anio: '50%',
  reiteracion_dentro_del_anio: '75%',
  moroso_bdme: 'MOROSO BDME',
};

export interface ResultadoFilaMasiva {
  comparendo: string;
  proceso: string;
  solicitado: string;
  estado: EstadoFilaMasiva;
  /** Motivo exacto a mostrar — para 'generado', la variante (SIN REINCIDENCIA/50%/75%); para el resto, la razón por la que no se generó. */
  motivo: string;
  archivo?: { nombre: string; blob: Blob };
}

export interface ResumenGeneracionMasiva {
  resultados: ResultadoFilaMasiva[];
  totalEnBase: number;
  candidatosFirmeza: number;
  excluidosPorEstado: number;
  generados: number;
  conObservaciones: number;
  /** Candidatos FIRMEZA que no se generaron por otro motivo (reincidencia no definida, género no determinado, tipo sin plantilla, etc.). */
  noGenerados: number;
}

/** Plantillas ya descargadas en este lote, para no volver a pedir el mismo archivo por cada fila que lo comparte. */
async function plantillaCacheada(cache: Map<string, ArrayBuffer>, archivo: string): Promise<ArrayBuffer> {
  const existente = cache.get(archivo);
  if (existente) return existente;
  const plantilla = await cargarPlantillaActaFirmeza(archivo);
  cache.set(archivo, plantilla);
  return plantilla;
}

export async function generarActasMasivas(
  registrosEntrada: Comparendo[],
  fechaResolucion: string, // ISO — misma para todo el lote, como en el formulario individual
  onProgreso?: (procesados: number, total: number) => void,
): Promise<ResumenGeneracionMasiva> {
  // Orden natural por PROCESO — el mismo para el listado, el reporte y el
  // .zip, independientemente del orden en que vinieran seleccionados/cargados.
  const registros = [...registrosEntrada].sort(compararPorProceso);
  const cachePlantillas = new Map<string, ArrayBuffer>();
  const resultados: ResultadoFilaMasiva[] = [];

  for (const [indice, registro] of registros.entries()) {
    const base = { comparendo: registro.comparendo, proceso: registro.proceso, solicitado: registro.solicitado };
    const validacion = validarFilaParaActaMasiva(registro);
    if (!validacion.ok) {
      resultados.push({
        ...base,
        estado: validacion.tipoExclusion === 'estado' ? 'excluido_estado' : 'no_generado',
        motivo: validacion.motivo,
      });
      onProgreso?.(indice + 1, registros.length);
      continue;
    }
    try {
      const plantilla = await plantillaCacheada(cachePlantillas, validacion.seleccion.archivo);
      const campos = mapearCamposActaFirmezaOficial({
        proceso: registro.proceso,
        comparendo: registro.comparendo,
        articuloNumeral: registro.articuloNumeral,
        solicitante: registro.solicitante,
        solicitado: registro.solicitado,
        cedula: registro.cedula,
        direccion: registro.direccion,
        telefono: registro.telefono,
        fechaComparendo: registro.fechaComparendo,
        fechaResolucion,
        lugar: registro.lugar,
        hechos: registro.hechos,
        tipoMulta: registro.tipoMulta,
        liquidacion: validacion.liquidacion,
        apelo: registro.apelo,
        caso: 'normal',
      });
      const valoresFijos = valoresFijosActaFirmeza(validacion.liquidacion);
      const { blob, camposSinDato } = await generarActaFirmezaOficialDocxBlob(plantilla, campos, valoresFijos);
      const nombre = nombreArchivoActaFirmezaOficial(registro.proceso, registro.solicitado);
      const etiquetaCausal = ETIQUETA_CAUSAL[registro.causal];

      resultados.push({
        ...base,
        estado: camposSinDato.length > 0 ? 'con_observaciones' : 'generado',
        motivo: camposSinDato.length > 0 ? `${etiquetaCausal} — campos sin dato: ${camposSinDato.join(', ')}` : etiquetaCausal,
        archivo: { nombre, blob },
      });
    } catch (e) {
      resultados.push({
        ...base,
        estado: 'no_generado',
        motivo: e instanceof PlantillaActaFirmezaNoDisponibleError ? e.message : 'no se pudo generar el acta',
      });
    }
    onProgreso?.(indice + 1, registros.length);
  }

  return {
    resultados,
    totalEnBase: registros.length,
    candidatosFirmeza: resultados.filter((r) => r.estado !== 'excluido_estado').length,
    excluidosPorEstado: resultados.filter((r) => r.estado === 'excluido_estado').length,
    generados: resultados.filter((r) => r.estado === 'generado').length,
    conObservaciones: resultados.filter((r) => r.estado === 'con_observaciones').length,
    noGenerados: resultados.filter((r) => r.estado === 'no_generado').length,
  };
}

/** Empaqueta los .docx generados (generado + con_observaciones; ningún excluido/no generado entra al zip) en un único .zip. */
export async function generarZipActasMasivas(resultados: ResultadoFilaMasiva[]): Promise<Blob> {
  const zip = new JSZip();
  for (const r of resultados) {
    if (r.archivo) zip.file(r.archivo.nombre, await r.archivo.blob.arrayBuffer());
  }
  return zip.generateAsync({ type: 'blob' });
}

export async function descargarZipActasMasivas(resultados: ResultadoFilaMasiva[], fechaIso: string): Promise<void> {
  const blob = await generarZipActasMasivas(resultados);
  descargarBlob(blob, `ACTAS_FIRMEZA_${fechaIso}.zip`);
}
