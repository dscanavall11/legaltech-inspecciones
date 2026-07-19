import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  MessageOutlined,
  CalendarOutlined,
  PlusSquareOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/palette';

type NavItem = { ruta: string; label: string; icon: React.ReactNode; color: string };
type NavGroup = { titulo: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    titulo: 'Casos',
    items: [
      { ruta: '/panel', label: 'Inicio', icon: <HomeOutlined />, color: PALETA.azul },
      { ruta: '/panel/querellas', label: 'Querellas', icon: <FileTextOutlined />, color: PALETA.azul2 },
      { ruta: '/panel/quejas', label: 'Quejas', icon: <MessageOutlined />, color: PALETA.morado },
      { ruta: '/panel/audiencias', label: 'Audiencias', icon: <CalendarOutlined />, color: PALETA.teal },
    ],
  },
  {
    titulo: 'Gestión',
    items: [
      { ruta: '/panel/radicador', label: 'Radicador', icon: <PlusSquareOutlined />, color: PALETA.verde },
      { ruta: '/panel/cola', label: 'Cola', icon: <InboxOutlined />, color: PALETA.naranja },
      { ruta: '/panel/actas-firmeza', label: 'Actas de firmeza', icon: <SafetyCertificateOutlined />, color: PALETA.amarillo },
      { ruta: '/panel/medidas-correctivas', label: 'Medidas correctivas', icon: <DollarOutlined />, color: PALETA.rojo },
    ],
  },
  {
    titulo: 'Referencia',
    items: [
      { ruta: '/panel/normas', label: 'Normas', icon: <BookOutlined />, color: PALETA.morado },
    ],
  },
];

function isActive(ruta: string, pathname: string): boolean {
  if (ruta === '/panel') return pathname === '/panel' || pathname === '/panel/';
  return pathname.startsWith(ruta);
}

export function GlassSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);

  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: collapsed ? 80 : 248,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
        borderRight: '1px solid rgba(255,255,255,0.5)',
        zIndex: 20,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div style={{ padding: collapsed ? '20px 0' : '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: PALETA.azul, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          L
        </div>
        {!collapsed && (
          <div style={{ lineHeight: 1.15, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: PALETA.texto, whiteSpace: 'nowrap' }}>
              LegalTech <span style={{ color: PALETA.azul }}>Cloud</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: collapsed ? '0 12px' : '0 16px', marginBottom: 12 }}>
        <button
          onClick={() => navigate('/panel/radicador')}
          style={{
            width: '100%',
            height: 40,
            borderRadius: 12,
            border: 'none',
            background: PALETA.azul,
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = PALETA.azulOscuro; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = PALETA.azul; }}
        >
          <PlusSquareOutlined style={{ fontSize: 16 }} />
          {!collapsed && 'Radicar'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 8px' : '0 12px' }}>
        {NAV.map((grupo) => (
          <div key={grupo.titulo} style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div style={{ fontSize: 11, fontWeight: 600, color: PALETA.textoTenue, textTransform: 'uppercase', letterSpacing: 0.5, padding: '8px 8px 4px', whiteSpace: 'nowrap' }}>
                {grupo.titulo}
              </div>
            )}
            {grupo.items.map((item) => {
              const active = isActive(item.ruta, location.pathname);
              return (
                <Link
                  key={item.ruta}
                  to={item.ruta}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: collapsed ? '8px 0' : '8px 10px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? PALETA.azulOscuro : PALETA.textoSuave,
                    background: active ? PALETA.azulSuave : 'transparent',
                    transition: 'background 0.12s, color 0.12s',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 16, color: active ? item.color : PALETA.textoTenue, flexShrink: 0, display: 'flex' }}>
                    {item.icon}
                  </span>
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: collapsed ? '0 8px 8px' : '0 12px 8px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <button
          onClick={onToggle}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: `1px solid ${PALETA.borde}`,
            background: PALETA.superficie,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            transform: collapsed ? 'rotate(180deg)' : 'none',
          }}
        >
          <LeftOutlined style={{ fontSize: 10, color: PALETA.textoSuave }} />
        </button>
      </div>

      <div style={{ padding: collapsed ? '12px 8px' : '12px 16px', borderTop: `1px solid ${PALETA.borde}`, display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <Dropdown
          menu={{
            items: [
              { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión', onClick: () => { cerrarSesion(); navigate('/login', { replace: true }); } },
            ],
          }}
          trigger={['click']}
          placement="topRight"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <Avatar size={32} style={{ background: PALETA.azulSuave, color: PALETA.azulOscuro, flexShrink: 0 }} icon={<UserOutlined />} />
            {!collapsed && (
              <div style={{ lineHeight: 1.2, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: PALETA.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{usuario?.nombre}</div>
                <div style={{ fontSize: 11, color: PALETA.textoTenue, textTransform: 'capitalize' }}>{usuario?.rol}</div>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </nav>
  );
}
