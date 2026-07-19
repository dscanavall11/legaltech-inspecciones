// palette.ts - Core design tokens, no dependencies
// Fuente única de verdad para colores y elevación. Paleta plana estilo
// Google (azul institucional), alineada con resguardo-saas.

export const PALETA = {
  azul: '#1a73e8',
  azulOscuro: '#1557b0',
  azulSuave: '#e8f0fe', // fondo de estado activo
  rojo: '#c5221f',
  amarillo: '#b06000',
  verde: '#137333',
  texto: '#202124',
  textoSuave: '#5f6368',
  textoTenue: '#9aa0a6',
  superficie: '#ffffff',
  fondo: '#f8f9fa',
  borde: '#dadce0',
  // Acentos semánticos google para la navegación y los tiles.
  naranja: '#fa7b17',
  morado: '#a142f4',
  teal: '#0891b2',
  azul2: '#1967d2',
  // Tintes de fondo suaves (bg tints) google.
  verdeBg: '#e6f4ea',
  amarilloBg: '#fef9e0',
  rojoBg: '#fce8e6',
  azulBg: '#e8f0fe',
  naranjaBg: '#fef0e0',
  moradoBg: '#f3e8fd',
  tealBg: '#e0f4f8',
} as const;

// Sombras Google — un solo nivel discreto, sin capas metálicas.
export const ELEVACION = {
  base: '0 1px 2px rgba(60,64,67,.15), 0 1px 3px rgba(60,64,67,.1)',
  media: '0 1px 3px rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.12)',
} as const;
