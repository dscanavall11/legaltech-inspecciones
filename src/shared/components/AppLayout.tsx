import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Dock } from './dock/Dock';
import { Launchpad } from './launchpad/Launchpad';
import { CommandPalette } from './CommandPalette';
import { AiAssistant } from '@/shared/ai/AiAssistant';
import { ConfigAssistant } from '@/shared/ai/ConfigAssistant';
import { PALETA } from '@/theme/theme';

export function AppLayout() {
  const location = useLocation();
  const [launchpadAbierto, setLaunchpadAbierto] = useState(false);

  const esPaginaFullBleed = location.pathname.startsWith('/panel/nuevo-caso');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: PALETA.fondo,
      }}
    >
      <TopBar />

      <main
        style={{
          flex: 1,
          padding: esPaginaFullBleed ? 0 : '28px 28px 120px',
          maxWidth: esPaginaFullBleed ? 'none' : 1280,
          width: '100%',
          margin: '0 auto',
          overflow: esPaginaFullBleed ? 'hidden' : undefined,
        }}
      >
        {/* key por ruta: cada vista entra con la animación orquestada */}
        <div key={location.pathname} className="vista-animada">
          <Outlet />
        </div>
      </main>

      <Dock onAbrirLaunchpad={() => setLaunchpadAbierto(true)} />
      <Launchpad abierto={launchpadAbierto} onCerrar={() => setLaunchpadAbierto(false)} />

      <AiAssistant />
      <ConfigAssistant />
      <CommandPalette />
    </div>
  );
}
