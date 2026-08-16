import { type ReactNode } from 'react';
import {
  Home,
  FileText,
  Gavel,
  Stamp,
  HeartHandshake,
  Wallet,
  Scale,
  Sparkles,
  SquareSlash,
  Settings,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DOCK_SECTIONS, type DockIconKey } from './dockItems';
import { DockItemBoton } from './DockItemBoton';
import { PALETA } from '@/theme/palette';
import { glassChrome } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

/** Ancho del riel. AppLayout compensa este mismo valor con su paddingLeft. */
export const ANCHO_RIEL = 228;

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
  'chat-ia': <Sparkles size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  asistente: <SquareSlash size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
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

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: ANCHO_RIEL,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 10px 18px',
        overflowY: 'auto',
        ...glassChrome(reducirTransparencia),
        borderRight: `1px solid ${PALETA.borde}`,
        userSelect: 'none',
      }}
    >
      {DOCK_SECTIONS.map((section, i) => (
        <div key={section.titulo || `grupo-${i}`} style={{ marginBottom: 10 }}>
          {section.titulo && (
            <div
              style={{
                fontSize: 10.5,
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
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
