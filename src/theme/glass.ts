/**
 * Cristal — reservado solo para el "chrome" flotante que vive por encima del
 * contenido: Dock, buscador (CommandPalette) y el fondo del Launchpad.
 * El contenido principal (cards, listas, páginas) NO lleva vidrio: superficie
 * sólida, borde fino, una sola sombra discreta (ver theme.ts / palette.ts).
 */
import { PALETA } from './palette';

export { PALETA } from './palette';

/** Fondo translúcido con blur — la barra/panel flotante en sí. */
export function glassChrome(reduceTransparency: boolean): React.CSSProperties {
  if (reduceTransparency) {
    return { background: PALETA.superficie, backdropFilter: 'none', WebkitBackdropFilter: 'none' };
  }
  return {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  };
}

/** Fondo de respaldo para overlays de pantalla completa (Launchpad, buscador) — más blur, más dim. */
export function glassBackdrop(reduceTransparency: boolean): React.CSSProperties {
  if (reduceTransparency) {
    return { background: 'rgba(248, 249, 250, 0.96)', backdropFilter: 'none', WebkitBackdropFilter: 'none' };
  }
  return {
    background: 'rgba(248, 249, 250, 0.6)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  };
}

/** Sombra única del chrome flotante — un nivel, sin capas metálicas. */
export const SOMBRA_CHROME = '0 8px 24px rgba(32, 33, 36, 0.12), 0 2px 6px rgba(32, 33, 36, 0.08)';
