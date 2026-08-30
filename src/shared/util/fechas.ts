import dayjs, { type Dayjs } from 'dayjs';

/**
 * Fechas en español: dayjs entrega "lunes, 27 de julio" en minúscula y un
 * textTransform:capitalize rompe las preposiciones ("27 De Julio"). Acá se
 * capitaliza solo la primera letra, que es la regla tipográfica correcta.
 */
export function fechaLarga(fecha: Dayjs = dayjs(), formato = 'dddd, D [de] MMMM'): string {
  const cruda = fecha.format(formato);
  return cruda.charAt(0).toUpperCase() + cruda.slice(1);
}

/** Saludo según la hora local: Buenos días / Buenas tardes / Buenas noches. */
export function saludoPorHora(hora: number = dayjs().hour()): string {
  return hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
}
