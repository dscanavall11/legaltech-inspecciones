import type { Comparendo } from '@/features/actas/comparendos';
import { esIncidenteFirmeza } from '@/features/actas/comparendos';
import { resolverGeneroCiudadano, type GeneroCiudadano } from '../generoDetectado';
import { liquidarMulta, type LiquidacionMulta } from '../multas';
import {
  seleccionarPlantillaActaFirmeza,
  type ResultadoSeleccionPlantilla,
} from './catalogoActaFirmeza';
import { camposFaltantesActaFirmezaOficial } from './actaFirmezaOficial';

/**
 * Validación de UNA fila para el modo masivo — reutiliza exactamente las
 * mismas funciones que la generación individual (detección de género,
 * catálogo de plantillas, liquidación): no hay una segunda lógica. Es pura
 * (sin I/O) para poder probarla sin red ni archivos.
 *
 * Orden exigido por el despacho (no hacer validaciones costosas para filas
 * que no son FIRMEZA):
 *   1) Incidente — si no es "FIRMEZA", se excluye de inmediato, sin seguir
 *      validando nada más de esa fila.
 *   2) Reincidencia (columna oficial "Reincidencia" — nunca "REINCIDENTE" ni
 *      texto libre) — si está vacía o no se reconoce, no se genera.
 *   3) Objeción registrada (apelo).
 *   4) Campos obligatorios.
 *   5) Género (nunca por el nombre, nunca IA).
 *   6) Tipo de multa (debe ser uno con plantilla real: 2, 3 o 4).
 *   7) Selección de plantilla (catálogo real, sin heurísticas).
 */

export type MotivoExclusion = 'estado' | 'invalido';

export interface ValidacionFilaOk {
  ok: true;
  genero: GeneroCiudadano;
  seleccion: ResultadoSeleccionPlantilla;
  liquidacion: LiquidacionMulta;
}

export interface ValidacionFilaError {
  ok: false;
  motivo: string;
  /** 'estado' = el Incidente no es FIRMEZA (exclusión normal, no es un error jurídico). 'invalido' = es FIRMEZA pero algo le impide generarse. */
  tipoExclusion: MotivoExclusion;
}

export function validarFilaParaActaMasiva(registro: Comparendo): ValidacionFilaOk | ValidacionFilaError {
  // 1) Incidente — primero y más barato: descarta sin tocar nada más.
  if (!esIncidenteFirmeza(registro.incidente)) {
    return { ok: false, tipoExclusion: 'estado', motivo: `NO GENERADO — ESTADO DISTINTO DE FIRMEZA (${registro.incidente || 'vacío'})` };
  }

  // 2) Reincidencia — columna oficial, nunca calculada ni inferida.
  if (!registro.reincidenciaValida) {
    return { ok: false, tipoExclusion: 'invalido', motivo: 'REINCIDENCIA NO DEFINIDA O INVÁLIDA' };
  }

  // 3) Objeción registrada — no procede acta de firmeza.
  if (registro.apelo) {
    return { ok: false, tipoExclusion: 'invalido', motivo: 'el comparendo registra objeción; no procede acta de firmeza' };
  }

  // 4) Campos obligatorios.
  const faltantes = camposFaltantesActaFirmezaOficial({
    proceso: registro.proceso,
    comparendo: registro.comparendo,
    solicitado: registro.solicitado,
    cedula: registro.cedula,
    fechaComparendo: registro.fechaComparendo,
    hechos: registro.hechos,
  });
  if (faltantes.length > 0) {
    return { ok: false, tipoExclusion: 'invalido', motivo: `faltan datos obligatorios (${faltantes.join(', ')})` };
  }

  // 5) Género — fuente principal: columna oficial "Genero" de la base activa;
  //    solo si falta o no se reconoce, se recurre a evidencia textual de los
  //    "hechos". Nunca el nombre, nunca IA.
  const genero = resolverGeneroCiudadano(registro.genero, registro.hechos);
  if (!genero) {
    return { ok: false, tipoExclusion: 'invalido', motivo: 'GÉNERO NO DETERMINADO — REQUIERE REVISIÓN' };
  }

  // 6) Tipo de multa — la BD real puede traer valores sin plantilla (p. ej. 5): se reportan, no se descartan en silencio.
  if (registro.tipoMulta === 1) {
    return { ok: false, tipoExclusion: 'invalido', motivo: 'no existe plantilla tipo 1' };
  }
  if (![2, 3, 4].includes(registro.tipoMulta)) {
    return {
      ok: false,
      tipoExclusion: 'invalido',
      motivo: `tipo de multa no reconocido (${registro.tipoMulta}) — no está modelado en el sistema`,
    };
  }

  // 7) Selección de plantilla — catálogo real, determinístico.
  const seleccion = seleccionarPlantillaActaFirmeza({
    caso: 'normal',
    genero,
    tipoMulta: registro.tipoMulta,
    causal: registro.causal,
  });
  if (!seleccion) {
    return { ok: false, tipoExclusion: 'invalido', motivo: 'no existe plantilla oficial para esta combinación (género/tipo/causal)' };
  }

  const liquidacion = liquidarMulta(registro.tipoMulta, registro.causal);
  return { ok: true, genero, seleccion, liquidacion };
}
