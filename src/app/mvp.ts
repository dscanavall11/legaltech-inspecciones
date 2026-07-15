/**
 * Configuración del MVP (Mínimo Producto Viable) — Radicador.
 *
 * Cuando MVP = true:
 * - El menú lateral muestra SOLO: Inicio · Radicador · Cola de trabajo (+ avatar/salir).
 * - El CTA principal pasa a llamarse "Radicar" y navega a /panel/radicador.
 * - Los módulos listados en MODULOS_DIFERIDOS permanecen montados en el router
 *   (deep-links no rompen) pero se ocultan del menú y del dashboard.
 *
 * Cuando MVP = false: se muestra la navegación completa (Dashboard completo).
 */
export const MVP = true;

export const MODULOS_DIFERIDOS = [
  'normas',
  'archivo',
  'analisis',
  'procesos',
  'audiencias',
  'medidas-correctivas',
] as const;

export type ModuloDiferido = (typeof MODULOS_DIFERIDOS)[number];

export function esModuloDiferido(ruta: string): boolean {
  return MODULOS_DIFERIDOS.some((m) => ruta.includes(m));
}