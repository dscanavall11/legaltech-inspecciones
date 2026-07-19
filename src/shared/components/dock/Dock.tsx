import type { ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'motion/react';
import { Tooltip } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  MessageOutlined,
  CalendarOutlined,
  PlusSquareOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { DOCK_SECTIONS, type DockIconKey } from './dockItems';
import { DockIcon } from './DockIcon';
import { PALETA } from '@/theme/palette';
import { glassBackground, glassShadowLiquid } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';
import { useAuth } from '@/shared/auth/auth';

const ICONOS_DOCK: Record<DockIconKey, ReactNode> = {
  inicio: <HomeOutlined />,
  querellas: <FileTextOutlined />,
  quejas: <MessageOutlined />,
  audiencias: <CalendarOutlined />,
  'consulta-norma': <BookOutlined />,
  radicar: <PlusSquareOutlined />,
  cola: <InboxOutlined />,
  'actas-firmeza': <SafetyCertificateOutlined />,
  calendario: <CalendarOutlined />,
  'chat-ia': <LockOutlined />,
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
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);
  void onAbrirLaunchpad;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: 72,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 20,
        userSelect: 'none',
      }}
    >
      <motion.div
        onPointerMove={(e) => {
          if (!reducirMovimiento) mouseY.set(e.clientY);
        }}
        onPointerLeave={() => mouseY.set(Infinity)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '16px 10px',
          marginTop: 12,
          borderRadius: 24,
          ...glassBg,
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: glassShadowLiquid(PALETA.azul, 'low'),
          maxHeight: 'calc(100vh - 140px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: PALETA.azul,
            color: '#fff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            marginBottom: 8,
            flexShrink: 0,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/panel')}
        >
          L
        </div>

        {DOCK_SECTIONS.map((section) => (
          <div key={section.titulo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
            {section.items.map((item) => {
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
                  enConstruccion={item.enConstruccion}
                  activo={activo}
                  onClick={() => {
                    if (item.enConstruccion) return;
                    navigate(item.ruta);
                  }}
                  mouseY={mouseY}
                />
              );
            })}
          </div>
        ))}
      </motion.div>

      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          width: 72,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Tooltip title={usuario?.nombre || 'Usuario'} placement="right">
          <motion.button
            onClick={() => cerrarSesion()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: PALETA.azulSuave,
              color: PALETA.azulOscuro,
              fontSize: 18,
              ...glassBg,
              border: '1px solid rgba(255,255,255,0.4)',
            }}
            whileHover={{ scale: 1.08 }}
            aria-label="Cerrar sesión"
          >
            <UserOutlined />
          </motion.button>
        </Tooltip>
      </div>
    </div>
  );
}