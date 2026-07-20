import type { ReactNode } from 'react';
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
  AppstoreOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { SIDEBAR_SECTIONS, type SidebarIconKey, type SidebarItem } from './sidebarItems';
import { PALETA } from '@/theme/palette';
import { glassChrome, SOMBRA_CHROME, glassAccentSheen } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const ICONOS_SIDEBAR: Record<SidebarIconKey, ReactNode> = {
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

const ANCHO_SIDEBAR = 240;

interface GlassSidebarProps {
  onAbrirLaunchpad: () => void;
}

function FilaItem({
  item,
  activo,
  onClick,
}: {
  item: SidebarItem;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip
      title={item.enConstruccion ? `${item.label} (en construcción)` : ''}
      placement="right"
    >
      <button
        onClick={onClick}
        disabled={item.enConstruccion}
        aria-current={activo ? 'page' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 10px',
          borderRadius: 10,
          border: 'none',
          textAlign: 'left',
          cursor: item.enConstruccion ? 'not-allowed' : 'pointer',
          opacity: item.enConstruccion ? 0.5 : 1,
          background: activo ? `${item.color}14` : 'transparent',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (!activo) e.currentTarget.style.background = `${item.color}0c`;
        }}
        onMouseLeave={(e) => {
          if (!activo) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            background: `${item.color}1f`,
            color: item.color,
          }}
        >
          {ICONOS_SIDEBAR[item.iconKey]}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: activo ? 600 : 500,
            color: activo ? PALETA.texto : PALETA.textoSuave,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.label}
        </span>
      </button>
    </Tooltip>
  );
}

export function GlassSidebar({ onAbrirLaunchpad }: GlassSidebarProps) {
  const reducirTransparencia = usePrefersReducedTransparency();
  const location = useLocation();
  const navigate = useNavigate();
  const chrome = glassChrome(reducirTransparencia);

  const radicar = SIDEBAR_SECTIONS.flatMap((s) => s.items).find((i) => i.destacado);

  function esActivo(ruta: string): boolean {
    return ruta === '/panel' ? location.pathname === '/panel' : location.pathname.startsWith(ruta);
  }

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: ANCHO_SIDEBAR,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        padding: '84px 14px 16px',
        zIndex: 20,
        ...chrome,
        borderRight: `1px solid ${PALETA.borde}`,
        boxShadow: SOMBRA_CHROME,
        overflowY: 'auto',
      }}
    >
      {radicar && (
        <button
          onClick={() => navigate(radicar.ruta)}
          aria-current={esActivo(radicar.ruta) ? 'page' : undefined}
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '11px 14px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: `linear-gradient(135deg, ${PALETA.azul}, ${PALETA.azulOscuro})`,
          }}
        >
          <span aria-hidden style={{ position: 'absolute', inset: 0, background: glassAccentSheen(PALETA.azul), pointerEvents: 'none' }} />
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
            {ICONOS_SIDEBAR[radicar.iconKey]}
            {radicar.label}
          </span>
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0 }}>
        {SIDEBAR_SECTIONS.map((section) => {
          const items = section.items.filter((i) => !i.destacado);
          if (items.length === 0) return null;
          return (
            <div key={section.titulo} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  padding: '0 10px 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  color: PALETA.textoTenue,
                }}
              >
                {section.titulo}
              </div>
              {items.map((item) => (
                <FilaItem
                  key={item.key}
                  item={item}
                  activo={esActivo(item.ruta)}
                  onClick={() => {
                    if (item.enConstruccion) return;
                    navigate(item.ruta);
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      <button
        onClick={onAbrirLaunchpad}
        aria-label="Abrir Launchpad"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 10px',
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          color: PALETA.textoSuave,
          fontSize: 14,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
          }}
        >
          <AppstoreOutlined />
        </span>
        Más
      </button>
    </nav>
  );
}
