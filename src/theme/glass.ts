/**
 * Aproximacion de "Liquid Glass" para web: borde interior con brillo + gradiente
 * radial sutil + sombra en capas. No es el material nativo de Apple (no existe
 * un paquete oficial para web) — es una aproximacion honesta con backdrop-filter,
 * que se compone con ELEVACION/PALETA existentes en vez de reemplazarlos.
 */
export const GLASS_BORDE_INTERIOR = 'inset 0 1px 0 rgba(255,255,255,.5)';
export const GLASS_GRADIENTE_OVERLAY =
  'radial-gradient(circle at 20% 0%, rgba(255,255,255,.4), transparent 40%)';

/** Compone el borde interior de brillo con una sombra exterior existente (p. ej. ELEVACION.media). */
export function sombraGlass(sombraExterior: string): string {
  return `${GLASS_BORDE_INTERIOR}, ${sombraExterior}`;
}

/** Compone el gradiente de brillo sobre un color de fondo solido/rgba existente. */
export function fondoGlass(colorFondo: string): string {
  return `${GLASS_GRADIENTE_OVERLAY}, ${colorFondo}`;
}
