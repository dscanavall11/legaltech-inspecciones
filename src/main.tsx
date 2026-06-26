import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

/**
 * Arranca la app. Si los mocks están activos (VITE_ENABLE_MOCKS=true),
 * inicia MSW antes de renderizar para que ninguna petición se escape al backend real.
 */
async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return;
  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass', // deja pasar lo que no esté mockeado (assets, etc.)
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
