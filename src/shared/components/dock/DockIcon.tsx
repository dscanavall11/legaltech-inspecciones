import { useRef, type ReactNode } from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { Tooltip } from 'antd';
import { calcularEscalaDock } from './dockMagnification';
import { PALETA, ELEVACION } from '@/theme/theme';

interface DockIconProps {
  icon: ReactNode;
  label: string;
  destacado?: boolean;
  activo?: boolean;
  onClick: () => void;
  mouseX: MotionValue<number>;
}

const TAMANO_BASE = 44;

export function DockIcon({ icon, label, destacado, activo, onClick, mouseX }: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const distancia = useTransform(mouseX, (valorX) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return Infinity;
    return valorX - (rect.left + rect.width / 2);
  });
  const escalaCruda = useTransform(distancia, (d) => calcularEscalaDock(d));
  const escala = useSpring(escalaCruda, { stiffness: 300, damping: 20, mass: 0.5 });

  return (
    <Tooltip title={label}>
      <motion.button
        ref={ref}
        onClick={onClick}
        aria-label={label}
        style={{
          scale: escala,
          width: TAMANO_BASE,
          height: TAMANO_BASE,
          borderRadius: 14,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
          background: destacado ? PALETA.azul : activo ? PALETA.azulSuave : 'transparent',
          color: destacado ? '#fff' : activo ? PALETA.azulOscuro : PALETA.textoSuave,
          boxShadow: destacado ? ELEVACION.media : 'none',
        }}
      >
        {icon}
      </motion.button>
    </Tooltip>
  );
}
