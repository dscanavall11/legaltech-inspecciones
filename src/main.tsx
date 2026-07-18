import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

/**
 * Arranca la app. Si los mocks están activos, inicia MSW antes de renderizar
 * para que ninguna petición se escape al backend real.
 *
 * VITE_USE_MSW es el flag que apaga MSW por entorno (fase B: backend real del
 * Radicador). Si no está definido, se respeta el flag existente VITE_ENABLE_MOCKS
 * (default: mocks activos en dev, apagados en build de producción — ver
 * .env.example / .env.production).
 */
async function enableMocking() {
  const useMsw =
    import.meta.env.VITE_USE_MSW !== undefined
      ? import.meta.env.VITE_USE_MSW === 'true'
      : import.meta.env.VITE_ENABLE_MOCKS === 'true';
  if (!useMsw) {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.active?.scriptURL?.includes('mockServiceWorker')) {
          await reg.unregister();
        }
      }
    }
    return;
  }
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass', // deja pasar lo que no esté mockeado (assets, etc.)
  });

  // Tras un hard-refresh (Ctrl+Shift+R) el navegador ignora el service worker
  // durante esa carga: las peticiones se escaparían al proxy aunque MSW esté
  // "activo". Un reload normal (una sola vez) devuelve el control al worker.
  if (!navigator.serviceWorker.controller) {
    if (!sessionStorage.getItem('msw-reload')) {
      sessionStorage.setItem('msw-reload', '1');
      window.location.reload();
      return new Promise(() => {}); // la página se recarga; no renderizar
    }
    console.error(
      '[MSW] El service worker no controla la página; los mocks no interceptarán peticiones.',
    );
  }
  sessionStorage.removeItem('msw-reload');
  console.info('[MSW] Mocks activos: la app funciona sin backend.');
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
