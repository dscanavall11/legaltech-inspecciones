import { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Grid, Dropdown } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  MessageOutlined,
  DollarOutlined,
  UserOutlined,
  LogoutOutlined,
  FolderOpenOutlined,
  BookOutlined,
  LeftOutlined,
  InboxOutlined,
  PlusSquareOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FontSizeControl } from './FontSizeControl';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { AiAssistant } from '@/shared/ai/AiAssistant';
import { ConfigAssistant } from '@/shared/ai/ConfigAssistant';
import { useAuth } from '@/shared/auth/auth';
import { PALETA, ELEVACION } from '@/theme/theme';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const MENU_ITEMS_COMPLETO = [
  {
    key: '/panel',
    icon: <AppstoreOutlined />,
    label: <Link to="/panel">Inicio</Link>,
  },
  {
    key: 'g-casos',
    type: 'group' as const,
    label: 'Casos',
    children: [
      {
        key: '/panel/querellas',
        icon: <FileTextOutlined />,
        label: <Link to="/panel/querellas">Querellas</Link>,
      },
      {
        key: '/panel/quejas',
        icon: <MessageOutlined />,
        label: <Link to="/panel/quejas">Quejas</Link>,
      },
      {
        key: '/panel/audiencias',
        icon: <CalendarOutlined />,
        label: <Link to="/panel/audiencias">Audiencias</Link>,
      },
    ],
  },
  {
    key: 'g-gestion',
    type: 'group' as const,
    label: 'Gestión',
    children: [
      {
        key: '/panel/radicador',
        icon: <PlusSquareOutlined />,
        label: <Link to="/panel/radicador">Radicador</Link>,
      },
      {
        key: '/panel/cola',
        icon: <InboxOutlined />,
        label: <Link to="/panel/cola">Cola de trabajo</Link>,
      },
      {
        key: '/panel/actas-firmeza',
        icon: <SafetyCertificateOutlined />,
        label: <Link to="/panel/actas-firmeza">Actas de firmeza</Link>,
      },
      {
        key: '/panel/medidas-correctivas',
        icon: <DollarOutlined />,
        label: <Link to="/panel/medidas-correctivas">Medidas correctivas</Link>,
      },
    ],
  },
  {
    key: 'g-referencia',
    type: 'group' as const,
    label: 'Referencia',
    children: [
      {
        key: '/panel/normas',
        icon: <BookOutlined />,
        label: <Link to="/panel/normas">Normas nacionales</Link>,
      },
      {
        key: '/panel/archivo',
        icon: <FolderOpenOutlined />,
        label: <Link to="/panel/archivo">Archivo digital</Link>,
      },
    ],
  },
];

// Rutas de hoja navegables (excluye grupos y /panel raíz)
const NAV_RUTAS_COMPLETO = [
  '/panel/querellas',
  '/panel/quejas',
  '/panel/audiencias',
  '/panel/radicador',
  '/panel/cola',
  '/panel/actas-firmeza',
  '/panel/medidas-correctivas',
  '/panel/normas',
  '/panel/archivo',
];

function getMenuItems() {
  return MENU_ITEMS_COMPLETO;
}

function getNavRutas() {
  return NAV_RUTAS_COMPLETO;
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [colapsado, setColapsado] = useState(false);
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);

  const navRutas = getNavRutas();
  const menuItems = getMenuItems();

  const selectedKey =
    navRutas.filter((k) => location.pathname.startsWith(k)).sort((a, b) => b.length - a.length)[0] ??
    '/panel';

  const esPaginaFullBleed = location.pathname.startsWith('/panel/nuevo-caso');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={screens.lg ? 80 : 0}
        collapsible
        collapsed={colapsado}
        onCollapse={setColapsado}
        width={248}
        trigger={null}
        style={{ borderRight: `1px solid ${PALETA.borde}`, position: 'relative' }}
      >
        {/* Logo */}
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
          {!colapsado && (
            <span style={{ fontWeight: 700, fontSize: 18, color: PALETA.texto }}>LegalTech</span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ border: 'none', padding: '4px 12px' }}
        />

        <button
          aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'}
          onClick={() => setColapsado((c) => !c)}
          style={{
            position: 'absolute',
            right: -14,
            top: '50%',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: PALETA.superficie,
            border: `1px solid ${PALETA.borde}`,
            boxShadow: ELEVACION.base,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 200ms ease',
            transform: `translateY(-50%) rotate(${colapsado ? '180deg' : '0deg'})`,
            zIndex: 10,
          }}
        >
          <LeftOutlined style={{ fontSize: 10, color: PALETA.textoSuave }} />
        </button>
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
        </Header>

        <Content
          style={{
            margin: 0,
            padding: esPaginaFullBleed ? 0 : 28,
            maxWidth: esPaginaFullBleed ? 'none' : 1280,
            width: '100%',
            overflow: esPaginaFullBleed ? 'hidden' : undefined,
          }}
        >
          {/* key por ruta: cada vista entra con la animación orquestada */}
          <div key={location.pathname} className="vista-animada">
            <Outlet />
          </div>
        </Content>

        <StatusBar />
      </Layout>

      <AiAssistant />
      <ConfigAssistant />
      <CommandPalette />
    </Layout>
  );
}