import { Typography, Avatar, Dropdown, Tooltip } from 'antd';
import { UserOutlined, LogoutOutlined, CalendarOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { FontSizeControl } from './FontSizeControl';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';
import { glassChrome } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const { Text } = Typography;

export function TopBar() {
  const navigate = useNavigate();
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);
  const reducirTransparencia = usePrefersReducedTransparency();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
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
          <div style={{ fontWeight: 700, fontSize: 16, color: PALETA.texto }}>
            LegalTech <span style={{ color: PALETA.azul }}>Cloud</span>
          </div>
          <div style={{ fontSize: 11, color: PALETA.textoTenue }}>{usuario?.despacho}</div>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Tooltip title="Calendario de audiencias">
          <Link
            to="/panel/audiencias"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PALETA.textoSuave,
              fontSize: 16,
            }}
          >
            <CalendarOutlined />
          </Link>
        </Tooltip>
        <FontSizeControl />
        <Dropdown
          menu={{
            items: [
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Cerrar sesión',
                onClick: () => {
                  cerrarSesion();
                  navigate('/login', { replace: true });
                },
              },
            ],
          }}
          trigger={['click']}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <Avatar
              style={{ background: PALETA.azulSuave, color: PALETA.azulOscuro }}
              icon={<UserOutlined />}
            />
            <div style={{ lineHeight: 1.2 }}>
              <div>
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
