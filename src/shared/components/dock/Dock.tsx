import type { ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'motion/react';
import {
  HomeOutlined,
  FolderOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { DOCK_ITEMS, type DockIconKey } from './dockItems';
import { DockIcon } from './DockIcon';
import { PALETA } from '@/theme/theme';
import { glassBackground, glassShadowLiquid } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const ICONOS_DOCK: Record<DockIconKey, ReactNode> = {
  inicio: <HomeOutlined />,
  querellas: <FolderOutlined />,
  audiencias: <CalendarOutlined />,
  'actas-firmeza': <SafetyCertificateOutlined />,
  radicar: <PlusOutlined />,
};

interface DockProps {
  onAbrirLaunchpad: () => void;
}

export function Dock({ onAbrirLaunchpad }: DockProps) {
  const reducirMovimiento = useReducedMotion();
  const reducirTransparencia = usePrefersReducedTransparency();
  const mouseY = useMotionValue(Infinity);
  const location = useLocation();
  const navigate = useNavigate();
  const glassBg = glassBackground(reducirTransparencia);
  // El botón "+" del Launchpad se eliminó; el acceso queda por teclado
  // (Cmd/Ctrl + Shift + L, gestionado en AppLayout) y CommandPalette.
  void onAbrirLaunchpad;

  return (
    <motion.div
      onPointerMove={(e) => {
        if (!reducirMovimiento) mouseY.set(e.clientY);
      }}
      onPointerLeave={() => mouseY.set(Infinity)}
      style={{
        position: 'fixed',
        left: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '24px 14px',
        borderRadius: 28,
        ...glassBg,
        border: `1px solid ${PALETA.borde}`,
        boxShadow: glassShadowLiquid(PALETA.azul, 'high'),
        zIndex: 20,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
      }}
    >
      {DOCK_ITEMS.map((item) => {
        const activo =
          item.ruta === '/panel'
            ? location.pathname === '/panel'
            : location.pathname.startsWith(item.ruta);
        return (
          <DockIcon
            key={item.key}
            icon={ICONOS_DOCK[item.iconKey]}
            label={item.label}
            destacado={item.destacado}
            activo={activo}
            onClick={() => navigate(item.ruta)}
            mouseY={mouseY}
          />
        );
      })}

      {/* El botón "+" que abría el Launchpad se eliminó por petición del usuario.
          El Launchpad sigue accesible con Cmd/Ctrl + Shift + L (gestionado en AppLayout)
          y desde el CommandPalette (Cmd/Ctrl + K). */}
      {false && onAbrirLaunchpad}
    </motion.div>
  );
}