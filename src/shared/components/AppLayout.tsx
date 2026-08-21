import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { ANCHO_RIEL, ANCHO_RIEL_COLAPSADO, Dock } from './dock/Dock';
import { useDockStore } from '@/store/dockStore';

export function AppLayout() {
  const location = useLocation();
  const dockColapsado = useDockStore((s) => s.colapsado);

  // Vista de trabajo a pantalla completa: el intake y el asistente.
  const esPaginaFullBleed =
    location.pathname.startsWith('/panel/nuevo-caso') ||
    location.pathname.startsWith('/panel/asistente');

  // Areas de trabajo ocupan todo el ancho disponible y se alinean a la
  // izquierda para maximizar el espacio util; no heredan el maxWidth
  // centrado del layout general.
  const esAreaTrabajo =
    location.pathname.startsWith('/panel/querellas') ||
    location.pathname.startsWith('/panel/quejas') ||
    location.pathname.startsWith('/panel/apelaciones') ||
    location.pathname.startsWith('/panel/actas-firmeza') ||
    location.pathname.startsWith('/panel/pronto-pago') ||
    location.pathname.startsWith('/panel/conmutacion');

  const anchoDock = dockColapsado ? ANCHO_RIEL_COLAPSADO : ANCHO_RIEL;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
      }}
    >
      <Dock />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingLeft: anchoDock,
          transition: 'padding-left 200ms ease',
        }}
      >
        <TopBar />

        <main
          style={{
            flex: 1,
            padding: esPaginaFullBleed ? 0 : '20px 28px 28px 20px',
            maxWidth: esPaginaFullBleed || esAreaTrabajo ? 'none' : 1280,
            width: '100%',
            margin: esAreaTrabajo ? 0 : '0 auto',
            overflow: esPaginaFullBleed ? 'hidden' : undefined,
          }}
        >
          <div key={location.pathname} className="vista-animada">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}