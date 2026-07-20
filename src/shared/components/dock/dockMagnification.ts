export interface OpcionesEfectoDock {
  /** Distancia en px a la que un icono empieza a reaccionar al cursor. */
  radioInfluenciaPx: number;
  /** Escala en el pico, cursor exactamente sobre el icono. */
  escalaMax: number;
  /** Desplazamiento maximo (px) de un icono vecino, empujado para hacer lugar. */
  desplazamientoMaxPx: number;
}

export const EFECTO_DOCK_DEFAULT: OpcionesEfectoDock = {
  radioInfluenciaPx: 130,
  escalaMax: 1.9,
  desplazamientoMaxPx: 26,
};

export interface EfectoDock {
  escala: number;
  desplazamiento: number;
}

/**
 * Escala + desplazamiento de un icono del dock segun su distancia al
 * cursor — misma curva coseno/seno que la demo real de GSAP
 * (demos.gsap.com/demo/macos-dock-effect), no una interpolacion lineal.
 *
 * `distanciaPx` = posicion del icono menos posicion del cursor (positivo si
 * el icono esta mas abajo que el cursor). En el pico (distancia 0) la
 * escala es maxima y el desplazamiento es 0 — el icono bajo el cursor no
 * necesita moverse, solo agrandarse. Los vecinos se desplazan para hacer
 * lugar, decayendo a 0 en el borde del radio de influencia; fuera de ese
 * radio quedan con un desplazamiento residual constante (no vuelven de
 * golpe a 0), igual que en la demo original.
 */
export function calcularEfectoDock(
  distanciaPx: number,
  opts: OpcionesEfectoDock = EFECTO_DOCK_DEFAULT,
): EfectoDock {
  const { radioInfluenciaPx, escalaMax, desplazamientoMaxPx } = opts;
  if (!Number.isFinite(distanciaPx)) return { escala: 1, desplazamiento: 0 };
  if (distanciaPx <= -radioInfluenciaPx || distanciaPx >= radioInfluenciaPx) {
    return { escala: 1, desplazamiento: distanciaPx > 0 ? desplazamientoMaxPx : -desplazamientoMaxPx };
  }
  const rad = (distanciaPx / radioInfluenciaPx) * (Math.PI / 2);
  const escala = 1 + (escalaMax - 1) * Math.cos(rad);
  const desplazamiento = desplazamientoMaxPx * Math.sin(rad);
  return { escala, desplazamiento };
}
