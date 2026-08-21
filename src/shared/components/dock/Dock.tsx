import { useState, type ReactNode } from 'react';
import {
  Home,
  FileText,
  Gavel,
  Stamp,
  HeartHandshake,
  Wallet,
  Scale,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DOCK_SECTIONS, type DockIconKey } from './dockItems';
import { DockItemBoton } from './DockItemBoton';
import { PALETA } from '@/theme/palette';
import { glassChrome } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';
import { TEXTO } from '@/theme/escala';
import { useDockStore } from '@/store/dockStore';
import { useAuth } from '@/shared/auth/auth';

/** Ancho del riel expandido. AppLayout compensa este mismo valor con su paddingLeft. */
export const ANCHO_RIEL = 228;
export const ANCHO_RIEL_COLAPSADO = 64;

// Trazo fino y monocromo, sin relleno — lenguaje uniforme.
const ICONO_TAMANO = 18;
const ICONO_TRAZO = 1.75;

const ICONOS_DOCK: Record<DockIconKey, ReactNode> = {
  inicio: <Home size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  querellas: <FileText size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  quejas: <Gavel size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  firmeza: <Stamp size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  conmutacion: <HeartHandshake size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  'pronto-pago': <Wallet size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  apelaciones: <Scale size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  // El acento "IA": sparkle, no un ícono de robot.
  asistente: <Sparkles size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  configuracion: <Settings size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
};

/** Inicio solo está activo en su ruta exacta; el resto, por prefijo. */
function esActiva(ruta: string, pathname: string): boolean {
  return ruta === '/panel' ? pathname === '/panel' : pathname.startsWith(ruta);
}

/**
 * Riel de navegación: una columna de vidrio pegada al borde izquierdo, de alto
 * completo, continua con el TopBar. Cada entrada muestra su nombre y para qué
 * sirve; los grupos llevan encabezado para que el trámite se entienda de una
 * lectura, sin tooltips ni menús desplegables.
 */
export function Dock() {
  const reducirTransparencia = usePrefersReducedTransparency();
  const location = useLocation();
  const navigate = useNavigate();
  const colapsado = useDockStore((s) => s.colapsado);
  const toggle = useDockStore((s) => s.toggle);
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);
  const [menuPerfil, setMenuPerfil] = useState(false);

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: colapsado ? ANCHO_RIEL_COLAPSADO : ANCHO_RIEL,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        padding: colapsado ? '14px 6px 18px' : '14px 10px 18px',
        overflowY: 'auto',
        overflowX: 'hidden',
        ...glassChrome(reducirTransparencia),
        borderRight: `1px solid ${PALETA.borde}`,
        userSelect: 'none',
        transition: 'width 200ms ease',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={colapsado ? 'Expandir navegación' : 'Colapsar navegación'}
        style={{
          alignSelf: colapsado ? 'center' : 'flex-end',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          color: PALETA.textoTenue,
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        {colapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {DOCK_SECTIONS.map((section, i) => (
        <div key={section.titulo || `grupo-${i}`} style={{ marginBottom: 10 }}>
          {section.titulo && !colapsado && (
            <div
              style={{
                fontSize: TEXTO.nota,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: PALETA.textoTenue,
                padding: '10px 14px 6px',
              }}
            >
              {section.titulo}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {section.items.map((item) => (
              <DockItemBoton
                key={item.key}
                icon={ICONOS_DOCK[item.iconKey]}
                label={item.label}
                ayuda={item.ayuda}
                color={item.color}
                destacado={item.destacado}
                activo={esActiva(item.ruta, location.pathname)}
                onClick={() => navigate(item.ruta)}
                compacto={colapsado}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Perfil al pie del dock, al estilo de los chats de IA modernos */}
      <div style={{ marginTop: 'auto', position: 'relative' }}>
        <button
          type="button"
          onClick={() => setMenuPerfil((v) => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: colapsado ? 'center' : undefined,
            gap: colapsado ? 0 : 10,
            padding: colapsado ? '10px 4px' : '8px 12px',
            borderRadius: 10,
            border: 'none',
            background: menuPerfil ? 'var(--surface-2)' : 'transparent',
            cursor: 'pointer',
            color: PALETA.texto,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              background: PALETA.azulSuave,
              color: PALETA.azulOscuro,
              fontSize: TEXTO.nota,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {usuario?.nombre?.charAt(0).toUpperCase() ?? <User size={14} />}
          </span>
          {!colapsado && (
            <span style={{ minWidth: 0, textAlign: 'left' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: TEXTO.base,
                  fontWeight: 500,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {usuario?.nombre}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: TEXTO.nota,
                  color: PALETA.textoTenue,
                  lineHeight: 1.35,
                  textTransform: 'capitalize',
                }}
              >
                {usuario?.rol}
              </span>
            </span>
          )}
        </button>

        {menuPerfil && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: colapsado ? 'calc(100% + 8px)' : 0,
              right: colapsado ? undefined : 0,
              minWidth: 180,
              background: PALETA.superficie,
              border: `1px solid ${PALETA.borde}`,
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(32,33,36,0.12)',
              padding: '6px',
              zIndex: 30,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMenuPerfil(false);
                navigate('/panel/ajustes');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: TEXTO.base,
                fontFamily: 'inherit',
                color: PALETA.texto,
              }}
            >
              <Settings size={14} strokeWidth={1.75} />
              Configurar inspección
            </button>
            <div style={{ height: 1, background: PALETA.borde, margin: '4px 6px' }} />
            <button
              type="button"
              onClick={() => {
                setMenuPerfil(false);
                cerrarSesion();
                navigate('/login');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: TEXTO.base,
                fontFamily: 'inherit',
                color: PALETA.texto,
              }}
            >
              <LogOut size={14} strokeWidth={1.75} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
