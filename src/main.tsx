import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { resolveWorkspaceContext } from '@/shared/api/workspaceContext';
import { useWorkspaceContextStore } from '@/store/workspaceContextStore';
// Efecto secundario: mantiene el espacio de trabajo (base de comparendos,
// configuración institucional) sincronizado con el inspector que quede
// autenticado en cada momento — ver el archivo para el porqué.
import '@/shared/estado/sincronizarEspacioPorUsuario';

/**
 * La capa de mocks (MSW) se eliminó: el backend real atiende todos los
 * entornos. Esto solo desregistra el service worker que quedó instalado en
 * los navegadores que sí llegaron a correr con mocks — sin esto seguiría
 * interceptando peticiones y sirviendo datos inventados para siempre.
 */
async function unregisterLegacyMockWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((reg) => reg.active?.scriptURL?.includes('mockServiceWorker'))
      .map((reg) => reg.unregister()),
  );
}

// Microsite bootstrap: resuelve el workspace del subdominio actual antes de
// renderizar. apiFetch adjunta X-Workspace-Context a partir de aca (ver
// src/shared/api/client.ts).
Promise.all([unregisterLegacyMockWorker(), resolveWorkspaceContext()]).then(([, context]) => {
  useWorkspaceContextStore.getState().setContext(context);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
