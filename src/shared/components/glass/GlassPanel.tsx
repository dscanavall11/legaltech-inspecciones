import {
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { motion, useReducedMotion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { PALETA } from '@/theme/theme';
import {
  GLASS_ELEVATIONS,
  GlassElevation,
  glassShadowLiquidHover,
  glassShadowPressed,
  glassOuterShell,
  glassInnerCore,
  glassSpecularRing,
  GLASS_MOTION,
  shouldReduceGlass,
} from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

export interface GlassPanelProps {
  children: ReactNode;
  /** Inline style merged with internal glass styles */
  style?: CSSProperties;
  /** Optional className for external styling */
  className?: string;
  /** Elevation level — controls blur, shadow, opacity, border */
  elevation?: GlassElevation;
  /** Accent color for shadows, highlights, sheen (default: Apple blue) */
  accent?: string;
  /** If true (default), enables interactive glass effects:
   *  - Cursor-tracking specular highlight
   *  - Hover lift + shadow intensification
   *  - Press scale-down
   *  - Focus ring
   *  Pass false for static surfaces (images, config panels, backgrounds) */
  interactive?: boolean;
  /** Internal padding (default: 22) */
  padding?: number | string;
  /** Border radius (default: 20) */
  radius?: number;
  /** Click handler — makes panel focusable and clickable */
  onClick?: () => void;
  /** ARIA role for interactive panels */
  role?: string;
  /** ARIA label for interactive panels */
  'aria-label'?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** If true, uses overlay-style background (darker, more blur) for modals/search/launchpad */
  isOverlay?: boolean;
}

/**
 * Liquid Glass Panel — Double-Bezel Architecture
 *
 * Visual anatomy (outside → in):
 * 1. Outer Shell — backdrop-filter blur + saturate, border, base shadow
 * 2. Specular Ring — inner highlight borders + glossy radial overlay + diagonal sheen
 * 3. Dynamic Highlight — cursor-tracking radial specular reflection (the "liquid" feel)
 * 4. Inner Core — content container with concentric radius, padding
 *
 * Motion:
 * - Hover: gentle lift (translateY -2px) + shadow intensification + scale 1.012
 * - Press: scale 0.985 + pressed shadow
 * - Specular highlight: spring-tracked to cursor position
 * - All motion respects prefers-reduced-motion
 *
 * Accessibility:
 * - Respects prefers-reduced-transparency (solid backgrounds, no blur)
 * - Respects prefers-reduced-motion (no animations, instant state changes)
 * - Focus-visible ring for keyboard navigation
 * - Semantic role/aria when interactive
 */
export function GlassPanel({
  children,
  style,
  className,
  elevation = 'level1',
  accent = PALETA.azul,
  interactive = true,
  padding = 22,
  radius = 20,
  onClick,
  role,
  'aria-label': ariaLabel,
  tabIndex,
  isOverlay = false,
}: GlassPanelProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const reduceTransparency = usePrefersReducedTransparency();
  const glassReductions = shouldReduceGlass(reduceMotion, reduceTransparency);

  // Mouse tracking for dynamic specular highlight
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [spot, setSpot] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const ref = useRef<HTMLDivElement>(null);

  // Motion values for spring-tracked specular highlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(
    mouseX,
    glassReductions.disableMotion
      ? { stiffness: 1000, damping: 100 }
      : GLASS_MOTION.specular
  );
  const springY = useSpring(
    mouseY,
    glassReductions.disableMotion
      ? { stiffness: 1000, damping: 100 }
      : GLASS_MOTION.specular
  );

  // Transform spring values to dynamic highlight style
  const highlightX = useTransform(springX, (x: number) => x);
  const highlightY = useTransform(springY, (y: number) => y);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!interactive || glassReductions.disableSpecular) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);
    setSpot({ x, y, visible: true });
  }, [interactive, glassReductions.disableSpecular]);

  const handleMouseLeave = useCallback(() => {
    if (!interactive) return;
    setHover(false);
    setSpot((s) => ({ ...s, visible: false }));
  }, [interactive]);

  const handleMouseEnter = useCallback(() => {
    if (!interactive) return;
    setHover(true);
  }, [interactive]);

  const handleMouseDown = useCallback(() => {
    if (!interactive) return;
    setPressed(true);
  }, [interactive]);

  const handleMouseUp = useCallback(() => {
    setPressed(false);
  }, []);

  const handleFocus = useCallback(() => {
    if (!interactive) return;
    setFocused(true);
    setHover(true);
  }, [interactive]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    setHover(false);
  }, []);

  // Determine current shadow based on state
  const getCurrentShadow = (): string => {
    if (pressed && interactive) return glassShadowPressed(accent);
    if ((hover || focused) && interactive) {
      // Map GlassElevation to shadow elevation
      const shadowElevation = elevation === 'level0' ? 'base'
        : elevation === 'level1' ? 'base'
        : elevation === 'level2' ? 'medium'
        : elevation === 'level3' ? 'high'
        : 'overlay';
      return glassShadowLiquidHover(accent, shadowElevation);
    }
    return GLASS_ELEVATIONS[elevation].shadow.replace(PALETA.azul, accent);
  };

  // Determine current transform
  const getCurrentTransform = (): string => {
    if (pressed && interactive) return 'scale(0.985)';
    if (hover && interactive && !reduceMotion) return 'translateY(-2px) scale(1.012)';
    return 'none';
  };

  // Outer shell styles
  const outerStyle: CSSProperties = {
    ...glassOuterShell(reduceTransparency ?? false, radius, accent),
    ...(isOverlay ? {
      background: reduceTransparency ? 'rgba(245, 248, 252, 0.96)' : 'rgba(238, 244, 250, 0.62)',
      backdropFilter: reduceTransparency ? 'none' : 'blur(28px) saturate(200%)',
      WebkitBackdropFilter: reduceTransparency ? 'none' : 'blur(28px) saturate(200%)',
      border: 'none',
    } : {}),
    boxShadow: getCurrentShadow(),
    transition: glassReductions.disableMotion
      ? 'none'
      : `${GLASS_MOTION.shadowTransition}, ${GLASS_MOTION.transformTransition}`,
    transform: getCurrentTransform(),
    cursor: onClick ? 'pointer' : interactive ? 'default' : 'default',
    outline: focused ? `3px solid ${accent}40` : 'none',
    outlineOffset: '2px',
  };

  // Specular ring styles (static glossy overlay + inner highlights)
  const specularRingStyle: CSSProperties = glassSpecularRing(radius, accent);

  // Dynamic specular highlight (cursor-tracking)
  const dynamicHighlightStyle: CSSProperties = glassReductions.disableSpecular
    ? { display: 'none' }
    : {
        position: 'absolute' as const,
        inset: 0,
        borderRadius: radius,
        pointerEvents: 'none' as const,
        zIndex: 2,
        opacity: spot.visible && interactive ? 1 : 0,
        transition: 'opacity 120ms ease',
        background: `radial-gradient(ellipse 140px 90px at ${highlightX.get()}px ${highlightY.get()}px, rgba(255, 255, 255, 0.35), transparent 65%)`,
      };

  // Noise texture overlay (subtle tactile grain)
  const noiseStyle: CSSProperties = reduceTransparency
    ? { display: 'none' }
    : {
        position: 'absolute' as const,
        inset: 0,
        borderRadius: radius,
        pointerEvents: 'none' as const,
        zIndex: 3,
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.02 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      };

  // Inner core styles
  const innerStyle: CSSProperties = glassInnerCore(radius, padding);

  // Motion props for Framer Motion
  const motionProps = interactive && !glassReductions.disableMotion
    ? {
        whileHover: { scale: 1.012 },
        whileTap: { scale: 0.985 },
        transition: GLASS_MOTION.gentle,
      }
    : {};

  return (
    <motion.div
      ref={ref}
      className={className}
      role={role}
      aria-label={ariaLabel}
      tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{
        ...outerStyle,
        ...style,
      }}
      {...motionProps}
    >
      {/* Specular Ring — static glossy overlay + inner highlights */}
      <span
        aria-hidden="true"
        style={specularRingStyle}
      />

      {/* Dynamic Specular Highlight — tracks cursor */}
      <span
        aria-hidden="true"
        style={dynamicHighlightStyle}
      />

      {/* Noise Texture — subtle tactile grain */}
      <span
        aria-hidden="true"
        style={noiseStyle}
      />

      {/* Inner Core — content container */}
      <span style={innerStyle}>
        {children}
      </span>
    </motion.div>
  );
}

// ============================================================================
// CONVENIENCE EXPORTS & VARIANTS
// ============================================================================

/** GlassCard — pre-configured for card-like surfaces (level2 elevation) */
export function GlassCard({
  children,
  elevation = 'level2',
  ...props
}: Omit<GlassPanelProps, 'elevation'> & { elevation?: GlassElevation }) {
  return <GlassPanel elevation={elevation} {...props}>{children}</GlassPanel>;
}

/** GlassTile — compact interactive tile (level1, smaller radius) */
export function GlassTile({
  children,
  elevation = 'level1',
  radius = 16,
  padding = 16,
  ...props
}: Omit<GlassPanelProps, 'elevation' | 'radius' | 'padding'> & { elevation?: GlassElevation; radius?: number; padding?: number | string }) {
  return <GlassPanel elevation={elevation} radius={radius} padding={padding} {...props}>{children}</GlassPanel>;
}

/** GlassOverlay — full-screen overlay background (modal, search, launchpad) */
export function GlassOverlay({
  children,
  elevation = 'overlay',
  ...props
}: Omit<GlassPanelProps, 'elevation' | 'isOverlay'> & { elevation?: GlassElevation }) {
  return <GlassPanel elevation={elevation} isOverlay interactive={false} {...props}>{children}</GlassPanel>;
}

/** GlassSurface — non-interactive static glass surface */
export function GlassSurface({
  children,
  elevation = 'level1',
  ...props
}: Omit<GlassPanelProps, 'elevation' | 'interactive'> & { elevation?: GlassElevation }) {
  return <GlassPanel elevation={elevation} interactive={false} {...props}>{children}</GlassPanel>;
}

/** GlassButton — glass-styled button with proper states */
export function GlassButton({
  children,
  variant = 'secondary',
  radius = 999,
  padding = '12px 24px',
  onClick,
  disabled = false,
  ...props
}: Omit<GlassPanelProps, 'interactive' | 'onClick' | 'accent'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  radius?: number;
  padding?: number | string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const buttonPresets = {
    primary: { background: '#007AFF', shadow: '0 4px 14px -4px rgba(0, 122, 255, 0.45)', textColor: '#fff' },
    secondary: { background: 'rgba(255, 255, 255, 0.72)', shadow: '0 1px 2px rgba(0, 30, 80, 0.06), 0 1px 1px rgba(0, 30, 80, 0.05)', textColor: '#1D1D1F' },
    ghost: { background: 'transparent', shadow: 'none', textColor: '#007AFF' },
    destructive: { background: '#FF3B30', shadow: '0 4px 14px -4px rgba(255, 59, 48, 0.45)', textColor: '#fff' },
  } as const;

  const preset = buttonPresets[variant];

  return (
    <GlassPanel
      elevation="level1"
      interactive={!disabled}
      onClick={disabled ? undefined : onClick}
      accent="#007AFF"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 15,
        fontWeight: 500,
        color: preset.textColor,
        background: variant === 'secondary' ? preset.background : preset.background,
        backdropFilter: variant === 'secondary' ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: variant === 'secondary' ? 'blur(20px) saturate(180%)' : 'none',
        border: variant === 'secondary' ? `1px solid ${PALETA.borde}` : 'none',
        boxShadow: preset.shadow,
        borderRadius: radius,
        padding,
        ...props.style,
      }}
    >
      {children}
    </GlassPanel>
  );
}