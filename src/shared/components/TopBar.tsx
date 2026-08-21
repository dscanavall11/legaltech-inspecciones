import { useState } from 'react';
import { Archive, Sparkles, ScanLine } from 'lucide-react';
import { ModalRadicarComparendo } from '@/features/comparendos/ModalRadicarComparendo';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';
import { glassChrome } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';
import { TEXTO } from '@/theme/escala';

const RUTA_MIS_PROCESOS = '/panel/procesos';
const RUTA_RADICADOR = '/panel/radicador';

/** Las dos entradas de la barra comparten forma: entra y sale del despacho. */
function estiloEntradaSuperior(activa: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 34,
    padding: '0 12px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: TEXTO.base,
    fontWeight: 500,
    background: activa ? 'var(--accent-light)' : 'transparent',
    color: activa ? PALETA.azul : PALETA.textoSuave,
    transition: 'background 150ms ease, color 150ms ease',
  };
}

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = useAuth((s) => s.usuario);
  const reducirTransparencia = usePrefersReducedTransparency();

  // Ninguna de las dos es un trámite: radicar es la entrada al despacho y Mis
  // procesos su archivo. Por eso viven arriba a la derecha y no en el riel, que
  // queda libre para las áreas de trabajo.
  const enMisProcesos = location.pathname.startsWith(RUTA_MIS_PROCESOS);
  const enRadicador = location.pathname.startsWith(RUTA_RADICADOR);

  // El comparendo se radica leyendo su PDF, no conversando: es un modal, no una
  // pantalla. Por eso va aquí y no como una segunda ruta del radicador general.
  const [radicarComparendo, setRadicarComparendo] = useState(false);


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
            fontSize: TEXTO.titulo,
            flexShrink: 0,
          }}
        >
          L
        </span>
        <div style={{ lineHeight: 1.15 }}>
          <div className="titulo-serif" style={{ fontSize: TEXTO.seccion, color: PALETA.texto }}>
            LegalTech <span style={{ color: PALETA.azul }}>Cloud</span>
          </div>
          <div style={{ fontSize: TEXTO.nota, color: PALETA.textoTenue }}>{usuario?.despacho}</div>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Grupo de radicación: dos entradas del mismo trámite, mismo trato
            visual, sin colapsarlas en un dropdown. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 3,
            borderRadius: 12,
            background: 'var(--accent-light)',
          }}
        >
          <button
            onClick={() => navigate(RUTA_RADICADOR)}
            aria-current={enRadicador ? 'page' : undefined}
            style={{ ...estiloEntradaSuperior(enRadicador), background: 'transparent' }}
          >
            <Sparkles size={16} strokeWidth={1.75} color={PALETA.azul} />
            Radicar con Legal AI
          </button>

          <button onClick={() => setRadicarComparendo(true)} style={{ ...estiloEntradaSuperior(false), background: 'transparent' }}>
            <ScanLine size={16} strokeWidth={1.75} color={PALETA.azul} />
            Cargar PDF comparendo
          </button>
        </div>

        <button
          onClick={() => navigate(RUTA_MIS_PROCESOS)}
          aria-current={enMisProcesos ? 'page' : undefined}
          style={estiloEntradaSuperior(enMisProcesos)}
        >
          <Archive size={16} strokeWidth={1.75} />
          Mis procesos
        </button>
      </div>

      <ModalRadicarComparendo
        abierto={radicarComparendo}
        onCerrar={() => setRadicarComparendo(false)}
        onRadicado={(id) => {
          setRadicarComparendo(false);
          navigate(`/panel/comparendos/${id}`);
        }}
      />
    </header>
  );
}
