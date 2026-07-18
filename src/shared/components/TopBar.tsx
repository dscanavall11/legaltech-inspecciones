import { Typography, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { FontSizeControl } from './FontSizeControl';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';
import { sombraGlass, fondoGlass } from '@/theme/glass';
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
        background: reducirTransparencia
          ? PALETA.superficie
          : fondoGlass('rgba(255, 255, 255, 0.75)'),
        backdropFilter: reducirTransparencia ? 'none' : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: reducirTransparencia ? 'none' : 'blur(20px) saturate(180%)',
        boxShadow: sombraGlass('0 4px 12px rgba(32,33,36,.04)'),
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link
          to="/panel"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 12,
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
          <span style={{ fontWeight: 700, fontSize: 18, color: PALETA.texto }}>LegalTech</span>
        </Link>
        <Text strong style={{ fontSize: 16, color: PALETA.texto }}>
          {usuario?.despacho}
        </Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
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
