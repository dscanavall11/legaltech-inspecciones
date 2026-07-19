export interface OpcionesMagnificacion {
  /** Distancia en px a la que un icono empieza a crecer. */
  radioInfluenciaPx: number;
  /** Escala normal, sin cursor cerca. */
  escalaBase: number;
  /** Escala en el pico, cursor exactamente sobre el icono. */
  escalaMax: number;
}

export const MAGNIFICACION_DOCK_DEFAULT: OpcionesMagnificacion = {
  radioInfluenciaPx: 120,
  escalaBase: 1,
  escalaMax: 1.6,
};

/**
 * Escala de un icono del dock segun su distancia al cursor. Replica el
 * efecto de magnificacion de un dock estilo macOS: crece al acercarse el
 * cursor, decae linealmente hasta escalaBase fuera del radio de influencia.
 */
export function calcularEscalaDock(
  distanciaPx: number,
  opts: OpcionesMagnificacion = MAGNIFICACION_DOCK_DEFAULT,
): number {
  const { radioInfluenciaPx, escalaBase, escalaMax } = opts;
  const distancia = Math.abs(distanciaPx);
  if (!Number.isFinite(distancia) || distancia >= radioInfluenciaPx) return escalaBase;
  const proximidad = 1 - distancia / radioInfluenciaPx;
  return escalaBase + (escalaMax - escalaBase) * proximidad;
}
