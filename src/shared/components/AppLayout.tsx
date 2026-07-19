import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { GlassSidebar } from './GlassSidebar';
import { Launchpad } from './launchpad/Launchpad';
import { CommandPalette } from './CommandPalette';
import { AiAssistant } from '@/shared/ai/AiAssistant';
import { ConfigAssistant } from '@/shared/ai/ConfigAssistant';

export function AppLayout() {
  const location = useLocation();
  const [launchpadAbierto, setLaunchpadAbierto] = useState(false);
  const [colapsado, setColapsado] = useState(false);

  const esPaginaFullBleed = location.pathname.startsWith('/panel/nuevo-caso');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setLaunchpadAbierto((a) => !a);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
      }}
    >
      <GlassSidebar collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingLeft: colapsado ? 80 : 248,
        }}
      >
        <TopBar />

        <main
          style={{
            flex: 1,
            padding: esPaginaFullBleed ? 0 : 28,
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
      </div>

      <Launchpad abierto={launchpadAbierto} onCerrar={() => setLaunchpadAbierto(false)} />

      <AiAssistant />
      <ConfigAssistant />
      <CommandPalette />
    </div>
  );
}