import type { ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'motion/react';
import { Tooltip } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  MessageOutlined,
  BookOutlined,
  PlusSquareOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { DOCK_ITEMS, type DockIconKey } from './dockItems';
import { DockIcon } from './DockIcon';
import { PALETA, ELEVACION } from '@/theme/theme';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const ICONOS_DOCK: Record<DockIconKey, ReactNode> = {
  inicio: <AppstoreOutlined />,
  querellas: <FileTextOutlined />,
  quejas: <MessageOutlined />,
  audiencias: <CalendarOutlined />,
  'actas-firmeza': <SafetyCertificateOutlined />,
  normas: <BookOutlined />,
  radicar: <PlusSquareOutlined />,
};

interface DockProps {
  onAbrirLaunchpad: () => void;
}

export function Dock({ onAbrirLaunchpad }: DockProps) {
  const reducirMovimiento = useReducedMotion();
  const reducirTransparencia = usePrefersReducedTransparency();
  const mouseX = useMotionValue(Infinity);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.div
      onPointerMove={(e) => {
        if (!reducirMovimiento) mouseX.set(e.clientX);
      }}
      onPointerLeave={() => mouseX.set(Infinity)}
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 22,
        background: reducirTransparencia ? PALETA.superficie : 'rgba(255, 255, 255, 0.72)',
        backdropFilter: reducirTransparencia ? 'none' : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: reducirTransparencia ? 'none' : 'blur(20px) saturate(180%)',
        border: `1px solid ${PALETA.borde}`,
        boxShadow: ELEVACION.media,
        zIndex: 20,
        maxWidth: 'calc(100vw - 24px)',
        overflowX: 'auto',
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
            mouseX={mouseX}
          />
        );
      })}

      <div
        style={{ width: 1, alignSelf: 'stretch', background: PALETA.borde, margin: '4px 2px' }}
      />

      <Tooltip title="Más">
        <motion.button
          onClick={onAbrirLaunchpad}
          aria-label="Abrir Launchpad"
          whileHover={reducirMovimiento ? undefined : { scale: 1.15 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            background: 'transparent',
            color: PALETA.textoSuave,
            flexShrink: 0,
          }}
        >
          <TableOutlined />
        </motion.button>
      </Tooltip>
    </motion.div>
  );
}
