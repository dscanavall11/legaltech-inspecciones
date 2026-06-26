import dayjs, { type Dayjs } from 'dayjs';
import { esFestivo } from './festivos';

/**
 * Conteo de días hábiles para términos procesales.
 *
 * ⚠️ Pendiente de validación jurídica y pruebas. Un error aquí tiene
 * consecuencias legales — no usar en producción sin revisión del equipo legal.
 *
 * Día hábil = no sábado, no domingo, no festivo nacional.
 * No contempla aún: suspensión de términos, vacancia judicial, ni festivos
 * locales. Esos casos se agregarán como una capa de "excepciones" configurable.
 */

export function esDiaHabil(fecha: Dayjs): boolean {
  const dia = fecha.day(); // 0 = domingo, 6 = sábado
  if (dia === 0 || dia === 6) return false;
  return !esFestivo(fecha);
}

/**
 * Suma N días hábiles a una fecha. El día de inicio no se cuenta;
 * se empieza a contar desde el siguiente día hábil.
 */
export function sumarDiasHabiles(inicio: Dayjs, dias: number): Dayjs {
  let fecha = inicio.startOf('day');
  let restantes = dias;
  while (restantes > 0) {
    fecha = fecha.add(1, 'day');
    if (esDiaHabil(fecha)) restantes--;
  }
  return fecha;
}

/** Cuenta los días hábiles transcurridos entre dos fechas (excluye la inicial). */
export function diasHabilesEntre(inicio: Dayjs, fin: Dayjs): number {
  if (fin.isBefore(inicio)) return 0;
  let fecha = inicio.startOf('day');
  const limite = fin.startOf('day');
  let contador = 0;
  while (fecha.isBefore(limite)) {
    fecha = fecha.add(1, 'day');
    if (esDiaHabil(fecha)) contador++;
  }
  return contador;
}

export interface EstadoTermino {
  diasTranscurridos: number;
  diasRestantes: number;
  fechaVencimiento: Dayjs;
  vencido: boolean;
}

/**
 * Calcula el estado de un término procesal: cuántos días hábiles han pasado,
 * cuántos quedan y la fecha de vencimiento.
 */
export function calcularTermino(
  fechaInicio: Dayjs,
  diasTermino: number,
  hoy: Dayjs = dayjs(),
): EstadoTermino {
  const fechaVencimiento = sumarDiasHabiles(fechaInicio, diasTermino);
  const diasTranscurridos = diasHabilesEntre(fechaInicio, hoy);
  const diasRestantes = Math.max(0, diasTermino - diasTranscurridos);
  return {
    diasTranscurridos,
    diasRestantes,
    fechaVencimiento,
    vencido: hoy.isAfter(fechaVencimiento, 'day'),
  };
}
