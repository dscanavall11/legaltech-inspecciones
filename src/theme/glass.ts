/**
 * Apple Liquid Glass / Glassmorphism System for Web
 *
 * This is an honest approximation — there is no official Apple Liquid Glass
 * package for the web. We compose the look using:
 *   - backdrop-filter: blur(20px) saturate(180%)
 *   - Layered inner highlight borders (specular reflections)
 *   - Radial glossy overlay (top-center light catch)
 *   - Blue-tinted multi-layer shadows (depth + identity)
 *   - Dynamic specular sheen that tracks pointer (the "liquid" feel)
 *   - Nested Double-Bezel shells (outer shell + inner core)
 *
 * All effects respect prefers-reduced-transparency and prefers-reduced-motion.
 */

import { PALETA } from './palette';

// Re-export for backwards compatibility
export { PALETA } from './palette';

// ============================================================================
// CORE TOKENS — The building blocks of Liquid Glass
// ============================================================================

/** Inner specular highlight — the crisp 1px white line at the top inner edge */
export const GLASS_INNER_HIGHLIGHT =
  'inset 0 1px 0 rgba(255, 255, 255, 0.7)';

/** Secondary inner highlight — softer, slightly larger catch */
export const GLASS_INNER_HIGHLIGHT_SOFT =
  'inset 0 1px 1px rgba(255, 255, 255, 0.5)';

/** Tertiary inner highlight — for pressed/active states */
export const GLASS_INNER_HIGHLIGHT_PRESSED =
  'inset 0 2px 4px rgba(0, 0, 0, 0.08)';

/** Radial glossy overlay — the "liquid" light catch at top center */
export const GLASS_GLOSSY_OVERLAY =
  'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255, 255, 255, 0.55), transparent 50%)';

/** Specular sheen — diagonal highlight that gives the "pearl" quality */
export const GLASS_SPECULAR_SHEEN =
  'linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 35%, transparent 65%)';

/** Blue-tinted accent sheen — for primary/accent surfaces */
export function glassAccentSheen(accentColor: string): string {
  const rgb = hexToRgb(accentColor) ?? { r: 0, g: 122, b: 255 };
  return `linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) 35%, transparent 65%)`;
}

/** Dynamic specular sheen — tracks cursor position (set via CSS custom property) */
export const GLASS_DYNAMIC_SHEEN = (x: number, y: number) =>
  `radial-gradient(ellipse 120px 80px at ${x}px ${y}px, rgba(255, 255, 255, 0.4), transparent 70%)`;

/** Subtle noise texture overlay — adds tactile "glass grain" */
export const GLASS_NOISE_OVERLAY = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.02 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ============================================================================
// LEGACY EXPORTS — Backwards compatibility for existing components
// ============================================================================

/** @deprecated Use glassShadowLiquid instead */
export function sombraGlass(sombraExterior: string): string {
  return `${GLASS_INNER_HIGHLIGHT}, ${sombraExterior}`;
}

/** @deprecated Use glassBackground or composeGlassSurface instead */
export function fondoGlass(colorFondo: string): string {
  return `${GLASS_GLOSSY_OVERLAY}, ${colorFondo}`;
}

/** @deprecated Use glassOverlayBackground instead */
export function focusBlurOverlay(reducirTransparencia: boolean) {
  return {
    background: reducirTransparencia
      ? 'rgba(245, 248, 252, 0.96)'
      : 'rgba(238, 244, 250, 0.62)',
    backdropFilter: reducirTransparencia ? 'none' : 'blur(22px) saturate(160%)',
    WebkitBackdropFilter: reducirTransparencia ? 'none' : 'blur(22px) saturate(160%)',
  } as const;
}

/** @deprecated Use glassAccentSheen instead */
export function opalSheen(colorAcento: string): string {
  return glassAccentSheen(colorAcento);
}

/** @deprecated Use glassShadowLiquid instead */
export function sombraOpal(colorAcento: string, sombraExterior: string): string {
  const accentRgba = hexToRgba(colorAcento, 0.18);
  return `${GLASS_INNER_HIGHLIGHT}, 0 6px 18px -6px ${accentRgba}, ${sombraExterior}`;
}

/** @deprecated Use glassBackground instead */
export function fondoLiquidGlass(reducirTransparencia: boolean) {
  return {
    background: reducirTransparencia ? PALETA.superficie : 'rgba(255, 255, 255, 0.72)',
    backdropFilter: reducirTransparencia ? 'none' : 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: reducirTransparencia ? 'none' : 'blur(20px) saturate(180%)',
  } as const;
}

// ============================================================================
// SHADOW SYSTEM — Multi-layer, blue-tinted depth
// ============================================================================

/** Base elevation — subtle ground shadow */
export const GLASS_SHADOW_BASE =
  '0 1px 2px rgba(0, 30, 80, 0.06), 0 1px 1px rgba(0, 30, 80, 0.05)';

/** Medium elevation — cards, panels */
export const GLASS_SHADOW_MEDIUM =
  '0 4px 12px rgba(0, 30, 80, 0.10), 0 2px 4px rgba(0, 30, 80, 0.06)';

/** High elevation — modals, dropdowns, floating panels */
export const GLASS_SHADOW_HIGH =
  '0 12px 32px rgba(0, 30, 80, 0.15), 0 4px 8px rgba(0, 30, 80, 0.10)';

/** Maximum elevation — overlays, search, launchpad */
export const GLASS_SHADOW_OVERLAY =
  '0 24px 64px rgba(0, 30, 80, 0.20), 0 8px 16px rgba(0, 30, 80, 0.12)';

/**
 * Liquid Glass shadow — the signature multi-layer shadow:
 *   1. Inner highlight border
 *   2. Soft inner highlight
 *   3. Blue-tinted ambient halo (the "glow")
 *   4. Base elevation shadow
 */
export function glassShadowLiquid(
  accentColor: string,
  elevation: 'base' | 'medium' | 'high' | 'overlay' = 'medium'
): string {
  const elevationMap = {
    base: GLASS_SHADOW_BASE,
    medium: GLASS_SHADOW_MEDIUM,
    high: GLASS_SHADOW_HIGH,
    overlay: GLASS_SHADOW_OVERLAY,
  };
  const accentRgba = hexToRgba(accentColor, 0.18);
  return `${GLASS_INNER_HIGHLIGHT}, ${GLASS_INNER_HIGHLIGHT_SOFT}, 0 8px 24px -8px ${accentRgba}, ${elevationMap[elevation]}`;
}

/**
 * Glass shadow for hover/focus states — stronger halo
 */
export function glassShadowLiquidHover(
  accentColor: string,
  elevation: 'base' | 'medium' | 'high' | 'overlay' = 'medium'
): string {
  const elevationMap = {
    base: GLASS_SHADOW_MEDIUM,
    medium: GLASS_SHADOW_HIGH,
    high: GLASS_SHADOW_OVERLAY,
    overlay: GLASS_SHADOW_OVERLAY,
  };
  const accentRgba = hexToRgba(accentColor, 0.28);
  return `${GLASS_INNER_HIGHLIGHT}, ${GLASS_INNER_HIGHLIGHT_SOFT}, 0 12px 32px -8px ${accentRgba}, ${elevationMap[elevation]}`;
}

/**
 * Pressed/active state shadow
 */
export function glassShadowPressed(
  accentColor: string
): string {
  const accentRgba = hexToRgba(accentColor, 0.12);
  return `${GLASS_INNER_HIGHLIGHT_PRESSED}, 0 2px 8px -4px ${accentRgba}, ${GLASS_SHADOW_BASE}`;
}

// ============================================================================
// BACKGROUND SYSTEM — Translucent glass surfaces
// ============================================================================

/** Base glass background — rgba white with subtle blue tint */
export const GLASS_BG_BASE = 'rgba(255, 255, 255, 0.72)';

/** Stronger glass background — for more prominent surfaces */
export const GLASS_BG_STRONG = 'rgba(255, 255, 255, 0.82)';

/** Subtle glass background — for background layers */
export const GLASS_BG_SUBTLE = 'rgba(255, 255, 255, 0.55)';

/** Accent-tinted glass background */
export function glassBgAccent(accentColor: string, opacity = 0.12): string {
  const rgb = hexToRgb(accentColor) ?? { r: 0, g: 122, b: 255 };
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Complete glass background style object — respects reduced transparency
 */
export function glassBackground(
  reduceTransparency: boolean,
  variant: 'base' | 'strong' | 'subtle' | 'accent' = 'base',
  accentColor?: string
): React.CSSProperties {
  if (reduceTransparency) {
    return {
      background: PALETA.superficie,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    } as const;
  }

  const bgMap = {
    base: GLASS_BG_BASE,
    strong: GLASS_BG_STRONG,
    subtle: GLASS_BG_SUBTLE,
    accent: accentColor ? glassBgAccent(accentColor) : GLASS_BG_BASE,
  };

  return {
    background: bgMap[variant],
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  } as const;
}

/**
 * Overlay/backdrop background — for modals, search, launchpad
 * Darker, more saturated blur to push content back
 */
export function glassOverlayBackground(
  reduceTransparency: boolean
): React.CSSProperties {
  if (reduceTransparency) {
    return {
      background: 'rgba(245, 248, 252, 0.96)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    } as const;
  }

  return {
    background: 'rgba(238, 244, 250, 0.62)',
    backdropFilter: 'blur(28px) saturate(200%)',
    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  } as const;
}

// ============================================================================
// DOUBLE-BEZEL (DOPPELRAND) SYSTEM — Nested shells for true depth
// ============================================================================

/**
 * Outer shell styles — the "bezel" that catches light
 */
export function glassOuterShell(
  reduceTransparency: boolean,
  radius: number,
  accentColor?: string
): React.CSSProperties {
  const bg = reduceTransparency
    ? PALETA.superficie
    : GLASS_BG_BASE;

  return {
    position: 'relative',
    isolation: 'isolate' as const,
    borderRadius: radius,
    background: bg,
    backdropFilter: reduceTransparency ? 'none' : 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: reduceTransparency ? 'none' : 'blur(20px) saturate(180%)',
    border: `1px solid ${PALETA.borde}`,
    boxShadow: glassShadowLiquid(accentColor ?? PALETA.azul, 'medium'),
    overflow: 'hidden',
  } as const;
}

/**
 * Inner core styles — the content container, slightly smaller radius
 */
export function glassInnerCore(
  radius: number,
  padding: number | string
): React.CSSProperties {
  return {
    position: 'relative' as const,
    zIndex: 1,
    borderRadius: Math.max(0, radius - 2), // concentric radius
    padding,
  } as const;
}

/**
 * Specular highlight ring — sits between outer and inner
 * This is the key "liquid glass" visual: a bright ring at the bezel edge
 */
export function glassSpecularRing(
  radius: number,
  accentColor?: string
): React.CSSProperties {
  return {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: radius,
    pointerEvents: 'none' as const,
    zIndex: 0,
    boxShadow: `
      ${GLASS_INNER_HIGHLIGHT},
      ${GLASS_INNER_HIGHLIGHT_SOFT},
      inset 0 -1px 0 rgba(255, 255, 255, 0.15)
    `,
    background: `
      ${GLASS_GLOSSY_OVERLAY},
      ${accentColor ? glassAccentSheen(accentColor) : GLASS_SPECULAR_SHEEN}
    `,
  } as const;
}

/**
 * Dynamic specular highlight — tracks pointer position
 * Applied as an absolutely positioned overlay
 */
export function glassDynamicHighlight(
  x: number,
  y: number,
  radius: number,
  visible: boolean
): React.CSSProperties {
  return {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: radius,
    pointerEvents: 'none' as const,
    zIndex: 2,
    opacity: visible ? 1 : 0,
    transition: 'opacity 120ms ease',
    background: `radial-gradient(ellipse 140px 90px at ${x}px ${y}px, rgba(255, 255, 255, 0.35), transparent 65%)`,
  } as const;
}

// ============================================================================
// ELEVATION VARIANTS — Pre-configured glass levels
// ============================================================================

export type GlassElevation = 'level0' | 'level1' | 'level2' | 'level3' | 'overlay';

export interface GlassElevationTokens {
  background: string;
  backdropFilter: string;
  border: string;
  shadow: string;
  shadowHover: string;
  shadowPressed: string;
  innerHighlight: string;
}

export const GLASS_ELEVATIONS: Record<GlassElevation, GlassElevationTokens> = {
  /** Background layer — barely visible glass */
  level0: {
    background: 'rgba(255, 255, 255, 0.45)',
    backdropFilter: 'blur(16px) saturate(160%)',
    border: `1px solid ${PALETA.borde}`,
    shadow: 'none',
    shadowHover: glassShadowLiquid(PALETA.azul, 'base'),
    shadowPressed: glassShadowPressed(PALETA.azul),
    innerHighlight: GLASS_INNER_HIGHLIGHT,
  },

  /** Default card/panel level */
  level1: {
    background: GLASS_BG_BASE,
    backdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${PALETA.borde}`,
    shadow: glassShadowLiquid(PALETA.azul, 'base'),
    shadowHover: glassShadowLiquidHover(PALETA.azul, 'base'),
    shadowPressed: glassShadowPressed(PALETA.azul),
    innerHighlight: `${GLASS_INNER_HIGHLIGHT}, ${GLASS_INNER_HIGHLIGHT_SOFT}`,
  },

  /** Elevated cards, sidebar panels */
  level2: {
    background: GLASS_BG_STRONG,
    backdropFilter: 'blur(24px) saturate(190%)',
    border: `1px solid ${PALETA.borde}`,
    shadow: glassShadowLiquid(PALETA.azul, 'medium'),
    shadowHover: glassShadowLiquidHover(PALETA.azul, 'medium'),
    shadowPressed: glassShadowPressed(PALETA.azul),
    innerHighlight: `${GLASS_INNER_HIGHLIGHT}, ${GLASS_INNER_HIGHLIGHT_SOFT}`,
  },

  /** Floating panels, dropdowns, modals */
  level3: {
    background: GLASS_BG_STRONG,
    backdropFilter: 'blur(28px) saturate(200%)',
    border: `1px solid ${PALETA.borde}`,
    shadow: glassShadowLiquid(PALETA.azul, 'high'),
    shadowHover: glassShadowLiquidHover(PALETA.azul, 'high'),
    shadowPressed: glassShadowPressed(PALETA.azul),
    innerHighlight: `${GLASS_INNER_HIGHLIGHT}, ${GLASS_INNER_HIGHLIGHT_SOFT}`,
  },

  /** Full-screen overlays: search, launchpad, modal backdrop */
  overlay: {
    background: 'rgba(238, 244, 250, 0.62)',
    backdropFilter: 'blur(32px) saturate(220%)',
    border: 'none',
    shadow: glassShadowLiquid(PALETA.azul, 'overlay'),
    shadowHover: glassShadowLiquid(PALETA.azul, 'overlay'),
    shadowPressed: glassShadowLiquid(PALETA.azul, 'overlay'),
    innerHighlight: `${GLASS_INNER_HIGHLIGHT}, ${GLASS_INNER_HIGHLIGHT_SOFT}`,
  },
};

// ============================================================================
// COMPONENT-SPECIFIC GLASS PRESETS
// ============================================================================

/** Button glass variants */
export const GLASS_BUTTON = {
  primary: {
    background: PALETA.azul,
    backdropFilter: 'none',
    border: 'none',
    shadow: '0 4px 14px -4px rgba(0, 122, 255, 0.45)',
    shadowHover: '0 6px 20px -4px rgba(0, 122, 255, 0.55)',
    shadowPressed: '0 2px 6px -2px rgba(0, 122, 255, 0.4)',
    innerHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    textColor: '#ffffff',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${PALETA.borde}`,
    shadow: glassShadowLiquid(PALETA.azul, 'base'),
    shadowHover: glassShadowLiquidHover(PALETA.azul, 'base'),
    shadowPressed: glassShadowPressed(PALETA.azul),
    innerHighlight: `${GLASS_INNER_HIGHLIGHT}, ${GLASS_INNER_HIGHLIGHT_SOFT}`,
    textColor: PALETA.texto,
  },
  ghost: {
    background: 'transparent',
    backdropFilter: 'none',
    border: 'none',
    shadow: 'none',
    shadowHover: glassShadowLiquid(PALETA.azul, 'base'),
    shadowPressed: glassShadowPressed(PALETA.azul),
    innerHighlight: 'none',
    textColor: PALETA.azul,
  },
  destructive: {
    background: PALETA.rojo,
    backdropFilter: 'none',
    border: 'none',
    shadow: '0 4px 14px -4px rgba(255, 59, 48, 0.45)',
    shadowHover: '0 6px 20px -4px rgba(255, 59, 48, 0.55)',
    shadowPressed: '0 2px 6px -2px rgba(255, 59, 48, 0.4)',
    innerHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    textColor: '#ffffff',
  },
} as const;

/** Input glass variant */
export const GLASS_INPUT = {
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${PALETA.borde}`,
  shadow: 'inset 0 1px 2px rgba(0, 30, 80, 0.04)',
  shadowFocus: `0 0 0 3px ${hexToRgba(PALETA.azul, 0.15)}, ${GLASS_INNER_HIGHLIGHT}`,
  innerHighlight: GLASS_INNER_HIGHLIGHT,
} as const;

/** Tag/badge glass variant */
export const GLASS_TAG = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(16px) saturate(160%)',
  border: `1px solid ${PALETA.borde}`,
  shadow: glassShadowLiquid(PALETA.azul, 'base'),
  innerHighlight: GLASS_INNER_HIGHLIGHT,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0, 122, 255, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Compose a complete glass surface style for a given elevation
 * Usage: const style = composeGlassSurface('level2', false, PALETA.azul);
 */
export function composeGlassSurface(
  elevation: GlassElevation,
  reduceTransparency: boolean,
  _accentColor?: string
): React.CSSProperties {
  const tokens = GLASS_ELEVATIONS[elevation];

  if (reduceTransparency) {
    return {
      background: PALETA.superficie,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      border: tokens.border,
      boxShadow: 'none',
      borderRadius: 16,
    } as const;
  }

  return {
    background: tokens.background,
    backdropFilter: tokens.backdropFilter,
    WebkitBackdropFilter: tokens.backdropFilter,
    border: tokens.border,
    boxShadow: tokens.shadow,
    borderRadius: 16,
  } as const;
}

/**
 * Get hover shadow for elevation
 */
export function getGlassHoverShadow(elevation: GlassElevation, accentColor?: string): string {
  const tokens = GLASS_ELEVATIONS[elevation];
  return tokens.shadowHover.replace(PALETA.azul, accentColor ?? PALETA.azul);
}

/**
 * Get pressed shadow for elevation
 */
export function getGlassPressedShadow(elevation: GlassElevation, accentColor?: string): string {
  const tokens = GLASS_ELEVATIONS[elevation];
  return tokens.shadowPressed.replace(PALETA.azul, accentColor ?? PALETA.azul);
}

// ============================================================================
// MOTION TOKENS — Fluid spring physics for Liquid Glass feel
// ============================================================================

export const GLASS_MOTION = {
  /** Gentle spring for hover/tap */
  gentle: { type: 'spring' as const, stiffness: 280, damping: 22, mass: 0.9 },

  /** Snappy spring for focus/selection */
  snappy: { type: 'spring' as const, stiffness: 380, damping: 24, mass: 0.8 },

  /** Slow spring for panel open/close */
  fluid: { type: 'spring' as const, stiffness: 220, damping: 20, mass: 1.0 },

  /** Micro-spring for specular highlight tracking */
  specular: { type: 'spring' as const, stiffness: 450, damping: 28, mass: 0.5 },

  /** Transition for shadow changes */
  shadowTransition: 'box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1)',

  /** Transition for background changes */
  bgTransition: 'background 200ms cubic-bezier(0.22, 1, 0.36, 1)',

  /** Transition for transform (hover lift) */
  transformTransition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

// ============================================================================
// REDUCED MOTION / TRANSPARENCY HELPERS
// ============================================================================

/**
 * Check if we should disable glass effects
 */
export function shouldReduceGlass(
  reduceMotion: boolean,
  reduceTransparency: boolean
): { disableBlur: boolean; disableMotion: boolean; disableSpecular: boolean } {
  return {
    disableBlur: reduceTransparency,
    disableMotion: reduceMotion,
    disableSpecular: reduceMotion || reduceTransparency,
  };
}

/**
 * Get the appropriate background for current accessibility settings
 */
export function getGlassBackground(
  reduceTransparency: boolean,
  variant: 'base' | 'strong' | 'subtle' = 'base'
): string {
  if (reduceTransparency) return PALETA.superficie;
  const map = { base: GLASS_BG_BASE, strong: GLASS_BG_STRONG, subtle: GLASS_BG_SUBTLE };
  return map[variant];
}

/**
 * Get the appropriate backdrop-filter for current accessibility settings
 */
export function getGlassBackdropFilter(
  reduceTransparency: boolean,
  intensity: 'low' | 'standard' | 'high' | 'overlay' = 'standard'
): string {
  if (reduceTransparency) return 'none';
  const map = {
    low: 'blur(16px) saturate(160%)',
    standard: 'blur(20px) saturate(180%)',
    high: 'blur(28px) saturate(200%)',
    overlay: 'blur(32px) saturate(220%)',
  };
  return map[intensity];
}