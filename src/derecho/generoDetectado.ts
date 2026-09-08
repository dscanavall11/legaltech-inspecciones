/**
 * Detección de género — SOLO por evidencia textual explícita e inequívoca,
 * nunca por el nombre propio ni por IA generativa (instrucción expresa del
 * despacho). Se usa para elegir la plantilla oficial de Acta de Firmeza
 * correcta (masculina/femenina), no para redactar texto.
 *
 * Prioridad de fuentes, tal como la pidió el despacho:
 *  1) un dato estructurado de sexo/género, si existiera en el registro
 *     (hoy `Comparendo` no trae ese campo — si en el futuro lo trae, debe
 *     consultarse antes de tocar el texto libre).
 *  2) evidencia inequívoca dentro del texto estructurado del comparendo
 *     (hoy, los "hechos" — es el único texto libre disponible del registro).
 *  3) si no hay evidencia suficiente o es contradictoria, no se decide:
 *     el llamador debe pedir confirmación manual al inspector.
 */

export type GeneroCiudadano = 'masculino' | 'femenino';

interface ParPatron {
  masculino: RegExp;
  femenino: RegExp;
}

// \b funciona aquí porque "señora"/"identificada"/etc. no terminan donde
// termina la forma masculina seguida de límite de palabra: "señor" con \b no
// matchea dentro de "señora" (el siguiente carácter, "a", es de palabra).
const PARES: ParPatron[] = [
  { masculino: /\bciudadano\b/i, femenino: /\bciudadana\b/i },
  { masculino: /\bseñor\b/i, femenino: /\bseñora\b/i },
  { masculino: /\bpresunto infractor\b/i, femenino: /\bpresunta infractora\b/i },
  { masculino: /\bidentificado\b/i, femenino: /\bidentificada\b/i },
  { masculino: /\bmasculino\b/i, femenino: /\bfemenino\b/i },
];

/**
 * Analiza un texto estructurado (p. ej. los hechos del comparendo) y
 * devuelve el género SOLO si la evidencia es inequívoca (aparecen marcas de
 * un género y ninguna del otro). Si no hay marcas, o aparecen de ambos
 * géneros (redacción contradictoria o genérica), devuelve `null` — nunca
 * adivina, y el llamador debe exigir confirmación manual.
 */
export function detectarGeneroCiudadano(textoEstructurado: string | undefined | null): GeneroCiudadano | null {
  const texto = textoEstructurado ?? '';
  let masculino = 0;
  let femenino = 0;
  for (const par of PARES) {
    if (par.masculino.test(texto)) masculino++;
    if (par.femenino.test(texto)) femenino++;
  }
  if (masculino > 0 && femenino === 0) return 'masculino';
  if (femenino > 0 && masculino === 0) return 'femenino';
  return null; // sin evidencia, o evidencia contradictoria — exige confirmación manual
}

/**
 * Columna oficial "Genero" de la base activa — dato estructurado, no texto
 * libre. Tolerante a mayúsculas/minúsculas y a espacios al inicio/final
 * ("Masculino", " masculino ", "FEMENINO "), nada más: no se hace
 * coincidencia parcial ni se reconocen abreviaturas.
 */
export function generoDesdeColumnaOficial(v: unknown): GeneroCiudadano | null {
  const t = String(v ?? '').trim().toLowerCase();
  if (t === 'masculino') return 'masculino';
  if (t === 'femenino') return 'femenino';
  return null;
}

/**
 * Resuelve el género con la prioridad exacta que pidió el despacho:
 *  1) columna estructurada "Genero" de la base activa;
 *  2) solo si está vacía o trae un valor no reconocido, evidencia textual
 *     de los "hechos" (`detectarGeneroCiudadano`);
 *  3) si tampoco se puede determinar, `null` — el llamador exige revisión
 *     manual, nunca infiere por el nombre ni con IA.
 * El dato estructurado, cuando es válido, nunca se sustituye por lo que
 * diga el texto libre.
 */
export function resolverGeneroCiudadano(
  generoColumna: unknown,
  textoEstructurado: string | undefined | null,
): GeneroCiudadano | null {
  return generoDesdeColumnaOficial(generoColumna) ?? detectarGeneroCiudadano(textoEstructurado);
}
