import { Typography, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { FontSizeControl } from './FontSizeControl';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

export function TopBar() {
  const navigate = useNavigate();
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);

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
        background: PALETA.superficie,
        zIndex: 10,
      }}
    >
      <Text strong style={{ fontSize: 16, color: PALETA.texto }}>
        {usuario?.despacho}
      </Text>
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
