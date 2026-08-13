import { type ReactNode } from 'react';
import {
  FileText,
  MessageSquare,
  Siren,
  Calendar,
  FilePlus2,
  FileCheck2,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DOCK_SECTIONS, type DockIconKey } from './dockItems';
import { DockIcon } from './DockIcon';
import { PALETA } from '@/theme/palette';
import { glassChrome } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

// El item "Inicio" lleva la marca LegalTech en vez de un icono de casa —
// mismo glifo "L" que el badge del logo en TopBar.tsx.
const LOGO_LEGALTECH = <span style={{ fontWeight: 800 }}>L</span>;

// Trazo fino y monocromo, sin relleno — lenguaje minimalista uniforme.
const ICONO_TAMANO = 18;
const ICONO_TRAZO = 1.75;

const ICONOS_DOCK: Record<DockIconKey, ReactNode> = {
  inicio: LOGO_LEGALTECH,
  querellas: <FileText size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  quejas: <MessageSquare size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  comparendos: <Siren size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  audiencias: <Calendar size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  radicar: <FilePlus2 size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  'actas-firmeza': <FileCheck2 size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  'pronto-pago': <Wallet size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  // El acento "IA": sparkle, no un ícono de robot/candado.
  'chat-ia': <Sparkles size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
};

/**
 * Riel de navegación integrado: una franja de vidrio pegada al borde
 * izquierdo, de alto completo, continua con el TopBar. Íconos uniformes con
 * tooltip — sin flotar, sin magnificación, sin labels ni dobles acentos.
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
        width: 68,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 0 16px',
        ...glassChrome(reducirTransparencia),
        borderRight: `1px solid ${PALETA.borde}`,
        userSelect: 'none',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {DOCK_SECTIONS.map((section, i) => (
          <div
            key={section.titulo}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            {i > 0 && <div style={{ width: 26, height: 1, background: 'var(--border)', margin: '7px 0' }} />}
            {section.items.map((item) => {
              const activo =
                item.ruta === '/panel'
                  ? location.pathname === '/panel'
                  : location.pathname.startsWith(item.ruta);
              return (
                <DockIcon
                  key={item.key}
                  icon={ICONOS_DOCK[item.iconKey]}
                  label={item.label}
                  color={item.color}
                  destacado={item.destacado}
                  enConstruccion={item.enConstruccion}
                  activo={activo}
                  onClick={() => {
                    if (item.enConstruccion) return;
                    navigate(item.ruta);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
