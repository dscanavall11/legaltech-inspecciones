/**
 * Cristal — funciones de glassmorphism para el Dock macOS, CommandPalette y
 * Launchpad. Fondo translúcido con blur, sombras neutrales Google Material,
 * sheen sutil en elementos destacados.
 */
import { PALETA } from './palette';

export { PALETA } from './palette';

// ─── Chrome flotante (TopBar, CommandPalette, Launchpad) ────────────────────

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

/** Fondo de respaldo para overlays de pantalla completa (Launchpad, buscador). */
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

// ─── Dock macOS — glassmorphism + magnificación ─────────────────────────────

type NivelSombra = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Fondo del dock: cristal translúcido con blur. El dock es un pill flotante
 * vertical sobre el gradiente del body — el fondo se lee a través del vidrio.
 */
export function glassBackground(reduceTransparency: boolean): React.CSSProperties {
  if (reduceTransparency) {
    return {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    };
  }
  return {
    background: 'rgba(255, 255, 255, 0.28)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
  };
}

/**
 * Sombra del dock — capas neutrales Google Material. El nivel controla la
 * intensidad: 'low' reposo, 'medium' hover item, 'high' destacado (Radicar).
 * Sin halos de color; la profundidad viene de sombras grises.
 */
export function glassShadowLiquid(_accent: string, level: NivelSombra = 'low'): string {
  switch (level) {
    case 'low':
      return '0 4px 16px rgba(32,33,36,0.08), 0 1px 4px rgba(32,33,36,0.06)';
    case 'medium':
      return '0 6px 20px rgba(32,33,36,0.12), 0 2px 6px rgba(32,33,36,0.08)';
    case 'high':
      return '0 8px 28px rgba(32,33,36,0.16), 0 2px 8px rgba(32,33,36,0.10)';
    case 'ultra':
      return '0 12px 36px rgba(32,33,36,0.20), 0 4px 12px rgba(32,33,36,0.12)';
  }
}

/** Sombra al hacer hover sobre un item del dock. */
export function glassShadowLiquidHover(_accent: string, level: NivelSombra = 'medium'): string {
  return glassShadowLiquid(_accent, level);
}

/**
 * Sheen sutil en el icono destacado (Radicar) — highlight linear que imita
 * el reflejo de luz sobre vidrio pulido. Color acento neutro (blanco).
 */
export function glassAccentSheen(_accent: string): string {
  return 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(255,255,255,0.10) 100%)';
}
