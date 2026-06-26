import { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Grid } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  AuditOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  MessageOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FontSizeControl } from './FontSizeControl';
import { AiAssistant } from '@/shared/ai/AiAssistant';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

// Navegación con texto SIEMPRE acompañando al ícono (nunca solo íconos).
const MENU = [
  { key: '/', icon: <AppstoreOutlined />, label: <Link to="/">Inicio</Link> },
  {
    key: '/querellas',
    icon: <FileTextOutlined />,
    label: <Link to="/querellas">Querellas</Link>,
  },
  {
    key: '/quejas',
    icon: <MessageOutlined />,
    label: <Link to="/quejas">Quejas</Link>,
  },
  {
    key: '/audiencias',
    icon: <CalendarOutlined />,
    label: <Link to="/audiencias">Audiencias</Link>,
  },
  {
    key: '/fallos',
    icon: <AuditOutlined />,
    label: <Link to="/fallos">Fallos</Link>,
  },
  {
    key: '/actas-firmeza',
    icon: <SafetyCertificateOutlined />,
    label: <Link to="/actas-firmeza">Actas de firmeza</Link>,
  },
  {
    key: '/medidas-correctivas',
    icon: <DollarOutlined />,
    label: <Link to="/medidas-correctivas">Medidas correctivas</Link>,
  },
];

export function AppLayout() {
  const location = useLocation();
  const screens = useBreakpoint();
  const [colapsado, setColapsado] = useState(false);
  const usuario = useAuth((s) => s.usuario);

  // Resalta el ítem activo aunque estemos en una subruta (ej: /querellas/q-001).
  const selectedKey =
    MENU.map((m) => m.key)
      .filter((k) => k !== '/' && location.pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] ?? '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={screens.lg ? 80 : 0}
        collapsible
        collapsed={colapsado}
        onCollapse={setColapsado}
        width={248}
        style={{ borderRight: `1px solid ${PALETA.borde}` }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: colapsado ? 0 : '0 24px',
            justifyContent: colapsado ? 'center' : 'flex-start',
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
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
          {!colapsado && (
            <span
              style={{ fontWeight: 700, fontSize: 18, color: PALETA.texto }}
            >
              LegalTech
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU}
          style={{ border: 'none', padding: '8px 12px' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            borderBottom: `1px solid ${PALETA.borde}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Text strong style={{ fontSize: 16, color: PALETA.texto }}>
            {usuario?.despacho}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <FontSizeControl />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          </div>
        </Header>

        <Content style={{ margin: 0, padding: 28, maxWidth: 1280, width: '100%' }}>
          <Outlet />
        </Content>
      </Layout>

      <AiAssistant />
    </Layout>
  );
}
