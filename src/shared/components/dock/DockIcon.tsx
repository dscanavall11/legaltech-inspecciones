import { useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { Tooltip } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { calcularEscalaDock } from './dockMagnification';
import { PALETA } from '@/theme/palette';
import { glassShadowLiquid, glassShadowLiquidHover, glassAccentSheen } from '@/theme/glass';

interface DockIconProps {
  icon: ReactNode;
  label: string;
  color: string;
  destacado?: boolean;
  enConstruccion?: boolean;
  activo?: boolean;
  onClick: () => void;
  mouseY: MotionValue<number>;
}

const TAMANO_BASE = 44;
const TAMANO_DESTACADO = 52;

export function DockIcon({ icon, label, color, destacado, enConstruccion, activo, onClick, mouseY }: DockIconProps) {
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
        background: `radial-gradient(100px circle at ${spot.x}px ${spot.y}px, rgba(255, 255, 255, 0.35), transparent 70%)`,
      }
    : { background: 'transparent' };

  const getShadow = () => {
    if (destacado) {
      return hover
        ? glassShadowLiquidHover(PALETA.azul, 'medium')
        : glassShadowLiquid(PALETA.azul, 'medium');
    }
    if (hover || activo) {
      return '0 2px 8px rgba(32,33,36,0.10)';
    }
    return 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
      <Tooltip title={enConstruccion ? `${label} (en construcción)` : label} placement="right">
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
            borderRadius: destacado ? 16 : 12,
            border: 'none',
            cursor: enConstruccion ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: destacado ? 22 : 18,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            opacity: enConstruccion ? 0.5 : 1,
            background: destacado
              ? `linear-gradient(135deg, ${PALETA.azul}, ${PALETA.azulOscuro})`
              : hover || activo
                ? `${color}12`
                : 'transparent',
            color: destacado ? '#fff' : activo ? color : PALETA.textoSuave,
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
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
            {enConstruccion && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -4,
                  fontSize: 8,
                  color: PALETA.textoTenue,
                }}
              >
                <LockOutlined />
              </span>
            )}
          </span>
        </motion.button>
      </Tooltip>
      {destacado && (
        <span style={{ fontSize: 9, fontWeight: 600, color: PALETA.textoSuave, lineHeight: 1 }}>{label}</span>
      )}
      <span
        aria-hidden
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: activo ? color : 'transparent',
          transition: 'background 0.15s',
        }}
      />
    </div>
  );
}
