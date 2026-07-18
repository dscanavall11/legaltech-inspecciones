import { useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { Tooltip } from 'antd';
import { calcularEscalaDock } from './dockMagnification';
import { PALETA } from '@/theme/palette';
import { glassShadowLiquid, glassShadowLiquidHover, glassAccentSheen } from '@/theme/glass';

interface DockIconProps {
  icon: ReactNode;
  label: string;
  destacado?: boolean;
  activo?: boolean;
  onClick: () => void;
  mouseY: MotionValue<number>;
}

const TAMANO_BASE = 52;
const TAMANO_DESTACADO = 64;

/**
 * Icono del dock con magnificación real estilo macOS (escala por distancia al
 * cursor vía motion values) y efecto lupa/vidrio al hover: highlight radial que
 * sigue al cursor + sheen ópalo en el destacado. Monocromo por diseño: solo
 * "Radicar" lleva el acento (círculo azul con sheen ópalo).
 */
export function DockIcon({ icon, label, destacado, activo, onClick, mouseY }: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);
  const [spot, setSpot] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const distancia = useTransform(mouseY, (valorY) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return Infinity;
    return valorY - (rect.top + rect.height / 2);
  });
  const escalaCruda = useTransform(distancia, (d) => calcularEscalaDock(d));
  const escala = useSpring(escalaCruda, { stiffness: 300, damping: 20, mass: 0.5 });

  const tamano = destacado ? TAMANO_DESTACADO : TAMANO_BASE;

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
  }

  const spotStyle: CSSProperties = spot.visible
    ? {
        background: `radial-gradient(120px circle at ${spot.x}px ${spot.y}px, rgba(255, 255, 255, 0.40), transparent 70%)`,
      }
    : { background: 'transparent' };

  const getShadow = () => {
    if (destacado) {
      return hover
        ? glassShadowLiquidHover(PALETA.azul, 'medium')
        : glassShadowLiquid(PALETA.azul, 'medium');
    }
    if (hover) {
      return 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 12px rgba(0, 30, 80, 0.10)';
    }
    return 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <Tooltip title={label} placement="right">
        <motion.button
          ref={ref}
          onClick={onClick}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => {
            setHover(false);
            setSpot((s) => ({ ...s, visible: false }));
          }}
          onMouseMove={onMove}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          aria-label={label}
          style={{
            scale: escala,
            width: tamano,
            height: tamano,
            borderRadius: destacado ? 18 : 14,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: destacado ? 26 : 21,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            background: destacado
              ? `linear-gradient(135deg, ${PALETA.azul}, ${PALETA.azulOscuro})`
              : hover || activo
                ? '#eef4fa'
                : 'transparent',
            color: destacado ? '#fff' : activo ? PALETA.texto : PALETA.textoSuave,
            boxShadow: getShadow(),
            transition: 'background 150ms ease, color 150ms ease, box-shadow 200ms ease',
          }}
        >
          {destacado && (
            <span
              aria-hidden
              style={{ position: 'absolute', inset: 0, background: glassAccentSheen(PALETA.azul), pointerEvents: 'none' }}
            />
          )}
          {/* Spotlight que sigue al cursor — efecto lupa/vidrio */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              ...spotStyle,
              pointerEvents: 'none',
              transition: 'background 120ms ease',
            }}
          />
          <span style={{ position: 'relative' }}>{icon}</span>
        </motion.button>
      </Tooltip>
      {destacado && (
        <span style={{ fontSize: 10, fontWeight: 600, color: PALETA.textoSuave }}>{label}</span>
      )}
      <span
        aria-hidden
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: activo ? PALETA.azul : 'transparent',
        }}
      />
    </div>
  );
}