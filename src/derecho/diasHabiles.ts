/**
 * Días hábiles colombianos — cuenta plazos excluyendo sábados, domingos y
 * festivos (Ley 51 de 1983, "Ley Emiliani").
 *
 * ponytail: solo cubre festivos nacionales; no incluye días cívicos
 * municipales (p. ej. fundación de Manizales).
 */

/** Domingo de Pascua por el algoritmo de Butcher/Meeus (anonymous Gregorian). */
function domingoPascua(anio: number): Date {
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
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

/** Traslada una fecha al lunes siguiente si no cae lunes (Ley Emiliani). */
function trasladarALunes(fecha: Date): Date {
  const diaSemana = fecha.getDay(); // 0=domingo..6=sábado
  if (diaSemana === 1) return fecha;
  const diasHastaLunes = diaSemana === 0 ? 1 : 8 - diaSemana;
  return sumarDias(fecha, diasHastaLunes);
}

function festivosFijosTrasladables(anio: number): Date[] {
  return [
    new Date(anio, 0, 6), // Reyes Magos
    new Date(anio, 2, 19), // San José
    new Date(anio, 5, 29), // San Pedro y San Pablo
    new Date(anio, 7, 15), // Asunción de la Virgen
    new Date(anio, 9, 12), // Día de la Raza
    new Date(anio, 10, 1), // Todos los Santos
    new Date(anio, 10, 11), // Independencia de Cartagena
  ].map(trasladarALunes);
}

function festivosFijosNoTrasladables(anio: number): Date[] {
  return [
    new Date(anio, 0, 1), // Año Nuevo
    new Date(anio, 4, 1), // Día del Trabajo
    new Date(anio, 6, 20), // Independencia
    new Date(anio, 7, 7), // Batalla de Boyacá
    new Date(anio, 11, 8), // Inmaculada Concepción
    new Date(anio, 11, 25), // Navidad
  ];
}

function festivosMoviles(anio: number): Date[] {
  const pascua = domingoPascua(anio);
  return [
    sumarDias(pascua, -3), // Jueves Santo (no se traslada)
    sumarDias(pascua, -2), // Viernes Santo (no se traslada)
    trasladarALunes(sumarDias(pascua, 43)), // Ascensión del Señor
    trasladarALunes(sumarDias(pascua, 64)), // Corpus Christi
    trasladarALunes(sumarDias(pascua, 71)), // Sagrado Corazón
  ];
}

function mismaFecha(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Festivos oficiales de Colombia para el año de la fecha dada. */
export function esFestivo(fecha: Date): boolean {
  const anio = fecha.getFullYear();
  const festivos = [
    ...festivosFijosNoTrasladables(anio),
    ...festivosFijosTrasladables(anio),
    ...festivosMoviles(anio),
  ];
  return festivos.some((f) => mismaFecha(f, fecha));
}

function esDiaHabil(fecha: Date): boolean {
  const diaSemana = fecha.getDay();
  return diaSemana !== 0 && diaSemana !== 6 && !esFestivo(fecha);
}

/**
 * Cuenta `dias` días hábiles desde el día hábil SIGUIENTE a `fechaBase`
 * (sábados, domingos y festivos no cuentan).
 */
export function diasHabilesDesde(fechaBase: Date, dias: number): Date {
  let fecha = new Date(fechaBase);
  let contados = 0;
  while (contados < dias) {
    fecha = sumarDias(fecha, 1);
    if (esDiaHabil(fecha)) contados += 1;
  }
  return fecha;
}
