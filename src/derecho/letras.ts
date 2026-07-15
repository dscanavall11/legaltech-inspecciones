/**
 * Conversión de cifras y fechas a letras, como exigen las actas del despacho:
 * los valores en pesos van en mayúsculas ("NOVECIENTOS TREINTA Y TRES MIL...")
 * y las fechas en la forma "veinticuatro (24) de abril de dos mil veintiséis (2026)".
 */

const UNIDADES = [
  '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
  'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
  'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];

const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

const CENTENAS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
];

function hastaNoventaYNueve(n: number): string {
  if (n < 30) return UNIDADES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
}

function hastaNovecientos(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const centena = CENTENAS[c];
  if (resto === 0) return centena;
  return c === 0 ? hastaNoventaYNueve(resto) : `${centena} ${hastaNoventaYNueve(resto)}`;
}

/** Número entero (0 a 999.999.999) en letras, en minúsculas. */
export function numeroALetras(n: number): string {
  n = Math.round(Math.abs(n));
  if (n === 0) return 'cero';

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];
  if (millones === 1) partes.push('un millón');
  else if (millones > 1) partes.push(`${hastaNovecientos(millones)} millones`);

  if (miles === 1) partes.push('mil');
  else if (miles > 1) {
    // "uno mil" → "un mil"? En las actas se usa "un mil"? Modelo usa "TREINTA Y TRES MIL": apócope solo del 1 final.
    partes.push(`${hastaNovecientos(miles).replace(/uno$/, 'un')} mil`);
  }

  if (resto > 0) partes.push(hastaNovecientos(resto).replace(/uno$/, 'un'));

  return partes.join(' ').trim();
}

/** Valor en pesos, en mayúsculas y con la cifra, como en el acta. */
export function pesosALetras(valor: number): string {
  const entero = Math.round(valor);
  const letras = numeroALetras(entero).toUpperCase();
  const cifra = entero.toLocaleString('es-CO');
  return `${letras} PESOS MCTE ($ ${cifra})`;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "2026" → "dos mil veintiséis". */
function anioALetras(anio: number): string {
  return numeroALetras(anio);
}

/** Año con su cifra, como en el acta: "dos mil veintiséis (2026)". */
export function anioConCifra(anio: number): string {
  return `${anioALetras(anio)} (${anio})`;
}

/**
 * Fecha ISO (YYYY-MM-DD) en la forma del acta:
 * "veinticuatro (24) de abril de dos mil veintiséis (2026)".
 */
export function fechaALetras(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return iso;
  const diaLetras = numeroALetras(dia);
  const diaCifra = String(dia).padStart(2, '0');
  return `${diaLetras} (${diaCifra}) de ${MESES[mes - 1]} de ${anioALetras(anio)} (${anio})`;
}
