import { Typography, Avatar, Dropdown } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
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
