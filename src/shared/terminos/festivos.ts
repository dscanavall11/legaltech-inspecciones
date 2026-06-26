import dayjs, { type Dayjs } from 'dayjs';

/**
 * Festivos colombianos.
 *
 * ⚠️ VALIDACIÓN JURÍDICA PENDIENTE: esta lógica implementa la Ley 51 de 1983
 * (Ley Emiliani) y las fiestas movibles de Semana Santa. Debe ser revisada y
 * cubierta con pruebas unitarias por el equipo legal antes de usarse para
 * calcular términos con efectos procesales reales.
 *
 * Reglas:
 * - Festivos fijos: se celebran en su fecha exacta.
 * - Festivos "Emiliani": si no caen lunes, se trasladan al lunes siguiente.
 * - Fiestas movibles: se calculan a partir de la Pascua (algoritmo de Butcher/Meeus).
 */

/** Domingo de Pascua para un año dado (algoritmo de Butcher para calendario gregoriano). */
function domingoDePascua(anio: number): Dayjs {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return dayjs(new Date(anio, mes - 1, dia));
}

/** Traslada al lunes siguiente si la fecha no cae en lunes (regla Emiliani). */
function trasladarAlLunes(fecha: Dayjs): Dayjs {
  const diaSemana = fecha.day(); // 0 = domingo, 1 = lunes ...
  if (diaSemana === 1) return fecha;
  const diasHastaLunes = (8 - diaSemana) % 7;
  return fecha.add(diasHastaLunes, 'day');
}

/** Devuelve el set de festivos (YYYY-MM-DD) de un año en Colombia. */
export function festivosColombia(anio: number): Set<string> {
  const fijos: Dayjs[] = [
    dayjs(new Date(anio, 0, 1)), // Año Nuevo
    dayjs(new Date(anio, 4, 1)), // Día del Trabajo
    dayjs(new Date(anio, 6, 20)), // Independencia
    dayjs(new Date(anio, 7, 7)), // Batalla de Boyacá
    dayjs(new Date(anio, 11, 8)), // Inmaculada Concepción
    dayjs(new Date(anio, 11, 25)), // Navidad
  ];

  const emiliani: Dayjs[] = [
    dayjs(new Date(anio, 0, 6)), // Reyes Magos
    dayjs(new Date(anio, 2, 19)), // San José
    dayjs(new Date(anio, 5, 29)), // San Pedro y San Pablo
    dayjs(new Date(anio, 7, 15)), // Asunción de la Virgen
    dayjs(new Date(anio, 9, 12)), // Día de la Raza
    dayjs(new Date(anio, 10, 1)), // Todos los Santos
    dayjs(new Date(anio, 10, 11)), // Independencia de Cartagena
  ].map(trasladarAlLunes);

  const pascua = domingoDePascua(anio);
  const movibles: Dayjs[] = [
    pascua.subtract(3, 'day'), // Jueves Santo
    pascua.subtract(2, 'day'), // Viernes Santo
    trasladarAlLunes(pascua.add(39, 'day')), // Ascensión del Señor
    trasladarAlLunes(pascua.add(60, 'day')), // Corpus Christi
    trasladarAlLunes(pascua.add(68, 'day')), // Sagrado Corazón
  ];

  const todos = [...fijos, ...emiliani, ...movibles];
  return new Set(todos.map((d) => d.format('YYYY-MM-DD')));
}

/** ¿La fecha es festivo en Colombia? */
export function esFestivo(fecha: Dayjs): boolean {
  return festivosColombia(fecha.year()).has(fecha.format('YYYY-MM-DD'));
}
