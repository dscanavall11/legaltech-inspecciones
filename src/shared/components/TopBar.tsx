import { Typography, Avatar, Dropdown, Tooltip, Tag } from 'antd';
import { UserOutlined, LogoutOutlined, CalendarOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { FontSizeControl } from './FontSizeControl';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';
import { glassBackground, glassShadowLiquid } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const { Text } = Typography;

export function TopBar() {
  const navigate = useNavigate();
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);
  const reducirTransparencia = usePrefersReducedTransparency();
  const glass = glassBackground(reducirTransparencia);

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
        background: glass.background,
        backdropFilter: glass.backdropFilter,
        WebkitBackdropFilter: glass.WebkitBackdropFilter,
        boxShadow: glassShadowLiquid(PALETA.azul, 'base'),
        zIndex: 10,
      }}
    >
      {/* Marca LegalTech — separada visualmente del despacho/inspección */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Link
          to="/panel"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${PALETA.azul}, ${PALETA.azulOscuro})`,
              color: '#fff',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            }}
          >
            L
          </span>
          <span style={{ fontWeight: 700, fontSize: 18, color: PALETA.texto }}>
            LegalTech <span style={{ color: PALETA.azul }}>Cloud</span>
          </span>
        </Link>
      </div>

      {/* Centro: información del despacho / Inspección de Convivencia y Paz,
          separada de la marca como un chip/breadcrumb de papiro glass. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 14px',
          borderRadius: 999,
          background: reducirTransparencia ? '#eef4fa' : 'rgba(238, 244, 250, 0.6)',
          border: `1px solid ${PALETA.borde}`,
          maxWidth: 'calc(100% - 480px)',
        }}
      >
        <Tag
          color="blue"
          style={{
            marginInlineEnd: 0,
            background: PALETA.azulSuave,
            color: PALETA.azulOscuro,
            border: 'none',
            fontWeight: 600,
            fontSize: 10.5,
            letterSpacing: '0.04em',
          }}
        >
          DESPACHO
        </Tag>
        <div style={{ lineHeight: 1.2, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: PALETA.texto,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {usuario?.despacho ?? 'Inspección de Convivencia y Paz'}
          </div>
          <div style={{ fontSize: 10.5, color: PALETA.textoTenue }}>
            Inspección de Convivencia y Paz
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Tooltip title="Calendario de audiencias">
          <Link
            to="/panel/audiencias"
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PALETA.textoSuave,
              fontSize: 17,
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