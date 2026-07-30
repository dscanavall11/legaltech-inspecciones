import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Dock } from './dock/Dock';
import { CommandPalette } from './CommandPalette';
import { AgendaFloatingPanel } from './AgendaFloatingPanel';

export function AppLayout() {
  const location = useLocation();

  // Vistas de trabajo a pantalla completa: el intake y el workspace de Legal.
  const esPaginaFullBleed =
    location.pathname.startsWith('/panel/nuevo-caso') || location.pathname.startsWith('/panel/chat');

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
          paddingLeft: 68,
        }}
      >
        <TopBar />

        <main
          style={{
            flex: 1,
            padding: esPaginaFullBleed ? 0 : '20px 28px 28px',
            maxWidth: esPaginaFullBleed ? 'none' : 1280,
            width: '100%',
            margin: '0 auto',
            overflow: esPaginaFullBleed ? 'hidden' : undefined,
          }}
        >
          <div key={location.pathname} className="vista-animada">
            <Outlet />
          </div>
        </main>
      </div>

      <AgendaFloatingPanel />
      <CommandPalette />
    </div>
  );
}