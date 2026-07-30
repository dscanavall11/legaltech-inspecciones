// palette.ts - Core design tokens, no dependencies
// Identidad "tinta y expediente", segunda pasada: los mismos roles (azul tinta
// primario, violeta de sello para Legal, papel cálido) pero con acentos más
// vivos — la página es glassmorphism y el vidrio necesita color detrás.

export const PALETA = {
  azul: '#2f5fb3', // azul tinta vivo — primario institucional
  azulOscuro: '#1f4183',
  azulSuave: '#e7eefb', // fondo de estado activo
  rojo: '#d93025',
  amarillo: '#c77800',
  verde: '#188038',
  texto: '#20232a',
  textoSuave: '#5d6066',
  textoTenue: '#95948d',
  superficie: '#ffffff',
  fondo: '#f6f5f1', // papel cálido
  borde: '#e3e0d8',
  // Acentos semánticos para la navegación y los tiles.
  naranja: '#e8710a',
  morado: '#7a56c9', // violeta de sello — identidad del asistente Legal
  moradoOscuro: '#5b3fa3',
  teal: '#0d9bb8',
  azul2: '#4a7bd0',
  // Tintes de fondo suaves (bg tints).
  verdeBg: '#e4f4e8',
  amarilloBg: '#fdf3dc',
  rojoBg: '#fce9e7',
  azulBg: '#e7eefb',
  naranjaBg: '#fdeee0',
  moradoBg: '#f0eafb',
  tealBg: '#e0f5f9',
} as const;

// Sombras cálidas — un solo nivel discreto, sin capas metálicas.
export const ELEVACION = {
  base: '0 1px 2px rgba(50, 47, 40, 0.14), 0 1px 3px rgba(50, 47, 40, 0.10)',
  media: '0 1px 3px rgba(50, 47, 40, 0.24), 0 4px 8px 3px rgba(50, 47, 40, 0.10)',
} as const;
