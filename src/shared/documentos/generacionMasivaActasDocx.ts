import JSZip from 'jszip';
import type { Comparendo } from '@/features/actas/comparendos';
import { validarFilaParaActaMasiva } from '@/derecho/plantillas/generacionMasivaActas';
import {
  mapearCamposActaFirmezaOficial,
  nombreArchivoActaFirmezaOficial,
  valoresFijosActaFirmeza,
} from '@/derecho/plantillas/actaFirmezaOficial';
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
 */

export type EstadoFilaMasiva = 'generado' | 'con_observaciones' | 'error';

export interface ResultadoFilaMasiva {
  comparendo: string;
  proceso: string;
  solicitado: string;
  estado: EstadoFilaMasiva;
  motivo?: string;
  archivo?: { nombre: string; blob: Blob };
}

export interface ResumenGeneracionMasiva {
  resultados: ResultadoFilaMasiva[];
  generados: number;
  conObservaciones: number;
  errores: number;
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
  registros: Comparendo[],
  fechaResolucion: string, // ISO — misma para todo el lote, como en el formulario individual
): Promise<ResumenGeneracionMasiva> {
  const cachePlantillas = new Map<string, ArrayBuffer>();
  const resultados: ResultadoFilaMasiva[] = [];

  for (const registro of registros) {
    const base = { comparendo: registro.comparendo, proceso: registro.proceso, solicitado: registro.solicitado };
    const validacion = validarFilaParaActaMasiva(registro);
    if (!validacion.ok) {
      resultados.push({ ...base, estado: 'error', motivo: validacion.motivo });
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

      resultados.push({
        ...base,
        estado: camposSinDato.length > 0 ? 'con_observaciones' : 'generado',
        motivo: camposSinDato.length > 0 ? `campos sin dato: ${camposSinDato.join(', ')}` : undefined,
        archivo: { nombre, blob },
      });
    } catch (e) {
      resultados.push({
        ...base,
        estado: 'error',
        motivo: e instanceof PlantillaActaFirmezaNoDisponibleError ? e.message : 'no se pudo generar el acta',
      });
    }
  }

  return {
    resultados,
    generados: resultados.filter((r) => r.estado === 'generado').length,
    conObservaciones: resultados.filter((r) => r.estado === 'con_observaciones').length,
    errores: resultados.filter((r) => r.estado === 'error').length,
  };
}

/** Empaqueta los .docx generados (generado + con_observaciones; los "error" nunca se generaron) en un único .zip. */
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
