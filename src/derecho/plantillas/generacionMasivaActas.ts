import type { Comparendo } from '@/features/actas/comparendos';
import { detectarGeneroCiudadano, type GeneroCiudadano } from '../generoDetectado';
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
 * Regla del despacho: nunca se completa con IA, nunca se infiere género por
 * el nombre, nunca se calcula una reincidencia que no esté ya en la BD
 * (`registro.causal`, que ya viene de la columna REINCIDENTE del Excel —
 * ver `causalDesdeBd` en `features/actas/comparendos.ts`).
 */

export interface ValidacionFilaOk {
  ok: true;
  genero: GeneroCiudadano;
  seleccion: ResultadoSeleccionPlantilla;
  liquidacion: LiquidacionMulta;
}

export interface ValidacionFilaError {
  ok: false;
  motivo: string;
}

export function validarFilaParaActaMasiva(registro: Comparendo): ValidacionFilaOk | ValidacionFilaError {
  const faltantes = camposFaltantesActaFirmezaOficial({
    proceso: registro.proceso,
    comparendo: registro.comparendo,
    solicitado: registro.solicitado,
    cedula: registro.cedula,
    fechaComparendo: registro.fechaComparendo,
    hechos: registro.hechos,
  });
  if (faltantes.length > 0) return { ok: false, motivo: `faltan datos obligatorios (${faltantes.join(', ')})` };

  if (registro.apelo) return { ok: false, motivo: 'el comparendo registra objeción; no procede acta de firmeza' };

  const genero = detectarGeneroCiudadano(registro.hechos);
  if (!genero) return { ok: false, motivo: 'género no determinado' };

  if (registro.tipoMulta === 1) return { ok: false, motivo: 'no existe plantilla tipo 1' };
  if (![1, 2, 3, 4].includes(registro.tipoMulta)) return { ok: false, motivo: 'inconsistencia en tipo de multa' };

  const seleccion = seleccionarPlantillaActaFirmeza({
    caso: 'normal',
    genero,
    tipoMulta: registro.tipoMulta,
    causal: registro.causal,
  });
  if (!seleccion) return { ok: false, motivo: 'no existe plantilla oficial para esta combinación (género/tipo/causal)' };

  const liquidacion = liquidarMulta(registro.tipoMulta, registro.causal);
  return { ok: true, genero, seleccion, liquidacion };
}
