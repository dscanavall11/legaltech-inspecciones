// palette.ts - Core design tokens, no dependencies
// This is the single source of truth for all design tokens

/**
 * Paleta institucional (Liquid Glass + azul Apple):
 *  superficie #ffffff · fondo #f5f8fc · acento azul #007aff
 */
export const PALETA = {
  azul: '#007aff', // azul Apple
  azulOscuro: '#0051d5', // azul Apple pressed
  azulSuave: '#e3f0ff', // fondo de estado activo (tinte azul sobre cristal)
  rojo: '#ff3b30', // rojo Apple
  amarillo: '#ff9500', // naranja Apple
  verde: '#34c759', // verde Apple
  texto: '#1d1d1f', // gris oscuro Apple sobre cristal
  textoSuave: '#6e6e73', // gris medio Apple
  textoTenue: '#86868b', // gris tenue Apple
  superficie: '#ffffff', // blanco cristal
  fondo: '#f5f8fc', // fondo azul muy sutil
  borde: '#d2d7de', // bordes fríos gris-azul
  // Variante translúcida del blanco para glass (rgba sobre fondo azul).
  superficieGlass: 'rgba(255, 255, 255, 0.72)',
  // Acento azul Apple en rgba para halos y sombras tintadas.
  acentoGlass: 'rgba(0, 122, 255, 0.18)',
} as const;

// Elevación fría y suave — sombras tintadas azuladas, no negras puras.
export const ELEVACION = {
  base: '0 1px 2px rgba(0, 30, 80, 0.06), 0 1px 1px rgba(0, 30, 80, 0.05)',
  media: '0 4px 12px rgba(0, 30, 80, 0.10), 0 2px 4px rgba(0, 30, 80, 0.06)',
} as const;