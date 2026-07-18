import { useRef, type ReactNode } from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { Tooltip } from 'antd';
import { calcularEscalaDock } from './dockMagnification';
import type { DockTileColor } from './dockItems';
import { PALETA, ELEVACION } from '@/theme/theme';
import { sombraGlass } from '@/theme/glass';

interface DockIconProps {
  icon: ReactNode;
  label: string;
  color: DockTileColor;
  destacado?: boolean;
  activo?: boolean;
  onClick: () => void;
  mouseY: MotionValue<number>;
}

const TAMANO_BASE = 44;
const TAMANO_DESTACADO = 56;

const COLOR_TILE: Record<DockTileColor, string> = {
  azul: PALETA.azul,
  verde: PALETA.verde,
  amarillo: PALETA.amarillo,
  rojo: PALETA.rojo,
};

// PALETA.amarillo es demasiado claro para un glifo blanco encima (no pasa
// contraste WCAG AA no-textual) — ese tile usa el glifo oscuro en su lugar.
const GLIFO_OSCURO: DockTileColor[] = ['amarillo'];

export function DockIcon({ icon, label, color, destacado, activo, onClick, mouseY }: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const distancia = useTransform(mouseY, (valorY) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return Infinity;
    return valorY - (rect.top + rect.height / 2);
  });
  const escalaCruda = useTransform(distancia, (d) => calcularEscalaDock(d));
  const escala = useSpring(escalaCruda, { stiffness: 300, damping: 20, mass: 0.5 });

  const tamano = destacado ? TAMANO_DESTACADO : TAMANO_BASE;
  const colorGlifo = destacado ? '#fff' : GLIFO_OSCURO.includes(color) ? PALETA.texto : '#fff';
  const fondo = destacado
    ? `linear-gradient(135deg, ${PALETA.azul}, ${PALETA.azulOscuro})`
    : COLOR_TILE[color];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <Tooltip title={label} placement="right">
        <motion.button
          ref={ref}
          onClick={onClick}
          aria-label={label}
          style={{
            scale: escala,
            width: tamano,
            height: tamano,
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: destacado ? 24 : 20,
            flexShrink: 0,
            background: fondo,
            color: colorGlifo,
            boxShadow: sombraGlass(destacado ? ELEVACION.media : ELEVACION.base),
          }}
        >
          {icon}
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
