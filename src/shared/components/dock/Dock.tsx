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
import { sombraGlass, fondoGlass } from '@/theme/glass';
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
  const mouseY = useMotionValue(Infinity);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.div
      onPointerMove={(e) => {
        if (!reducirMovimiento) mouseY.set(e.clientY);
      }}
      onPointerLeave={() => mouseY.set(Infinity)}
      style={{
        position: 'fixed',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '16px 10px',
        borderRadius: 24,
        background: reducirTransparencia
          ? PALETA.superficie
          : fondoGlass('rgba(255, 255, 255, 0.72)'),
        backdropFilter: reducirTransparencia ? 'none' : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: reducirTransparencia ? 'none' : 'blur(20px) saturate(180%)',
        border: `1px solid ${PALETA.borde}`,
        boxShadow: sombraGlass(ELEVACION.media),
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
            color={item.color}
            destacado={item.destacado}
            activo={activo}
            onClick={() => navigate(item.ruta)}
            mouseY={mouseY}
          />
        );
      })}

      <div
        style={{ height: 1, alignSelf: 'stretch', background: PALETA.borde, margin: '2px 4px' }}
      />

      <Tooltip title="Más" placement="right">
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
