import { Typography, Avatar, Tooltip, Dropdown } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  SettingOutlined,
  LogoutOutlined,
  AuditOutlined,
  InboxOutlined,
  BookOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { NotificationCenter } from './NotificationCenter';
import { LAUNCHPAD_ITEMS, type LaunchpadIconKey } from './launchpad/launchpadItems';
import { useAuth } from '@/shared/auth/auth';
import { useOverlayStore } from '@/store/overlayStore';
import { PALETA } from '@/theme/theme';
import { glassChrome } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const { Text } = Typography;

const ICONOS_MODULO: Partial<Record<LaunchpadIconKey, ReactNode>> = {
  'fallos-proferidos': <AuditOutlined />,
  'cola-trabajo': <InboxOutlined />,
  'consulta-normas': <BookOutlined />,
  'medidas-correctivas': <CalculatorOutlined />,
};

/** Módulos secundarios (registro único en launchpadItems): menú discreto. */
const MODULOS = LAUNCHPAD_ITEMS.flatMap((item) =>
  item.area === 'modulos' && item.accion.tipo === 'ruta'
    ? [{ key: item.key, icon: ICONOS_MODULO[item.iconKey], label: item.label, ruta: item.accion.ruta }]
    : [],
);

export function TopBar() {
  const navigate = useNavigate();
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);
  const agendaAbierta = useOverlayStore((s) => s.agendaAbierta);
  const abrirAgenda = useOverlayStore((s) => s.abrirAgenda);
  const cerrarAgenda = useOverlayStore((s) => s.cerrarAgenda);
  const reducirTransparencia = usePrefersReducedTransparency();

  const botonIcono: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: PALETA.textoSuave,
    fontSize: 16,
    cursor: 'pointer',
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 24px',
        borderBottom: `1px solid ${PALETA.borde}`,
        position: 'sticky',
        top: 0,
        ...glassChrome(reducirTransparencia),
        zIndex: 10,
      }}
    >
      {/* Marca — un solo bloque, sin caja de despacho pegada al lado */}
      <Link
        to="/panel"
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: PALETA.azul,
            color: '#fff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          L
        </span>
        <div style={{ lineHeight: 1.15 }}>
          <div className="titulo-serif" style={{ fontSize: 17, color: PALETA.texto }}>
            LegalTech <span style={{ color: PALETA.azul }}>Cloud</span>
          </div>
          <div style={{ fontSize: 11, color: PALETA.textoTenue }}>{usuario?.despacho}</div>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Dropdown
          menu={{
            items: MODULOS.map((m) => ({ key: m.key, icon: m.icon, label: m.label })),
            onClick: ({ key }) => {
              const modulo = MODULOS.find((m) => m.key === key);
              if (modulo) navigate(modulo.ruta);
            },
          }}
          placement="bottomRight"
        >
          <button aria-label="Módulos" style={botonIcono}>
            <AppstoreOutlined />
          </button>
        </Dropdown>

        <Tooltip title="Agenda de audiencias">
          <button
            onClick={() => (agendaAbierta ? cerrarAgenda() : abrirAgenda())}
            aria-label="Agenda de audiencias"
            style={botonIcono}
          >
            <CalendarOutlined />
          </button>
        </Tooltip>

        <NotificationCenter />

        <Dropdown
          menu={{
            items: [
              { key: 'ajustes', icon: <SettingOutlined />, label: 'Configurar inspección' },
              { type: 'divider' },
              { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión' },
            ],
            onClick: ({ key }) => {
              if (key === 'ajustes') navigate('/panel/ajustes');
              if (key === 'logout') {
                cerrarSesion();
                navigate('/login');
              }
            },
          }}
          placement="bottomRight"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <Avatar
              style={{ background: PALETA.azulSuave, color: PALETA.azulOscuro }}
              icon={<UserOutlined />}
            />
            <div style={{ lineHeight: 1.2, maxWidth: 180 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Text strong>{usuario?.nombre}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12, textTransform: 'capitalize' }}>
                {usuario?.rol}
              </Text>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
