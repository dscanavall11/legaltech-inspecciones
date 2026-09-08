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
 * La capa de mocks (MSW) se eliminó por completo: el backend real atiende
 * todos los entornos, y esta app nunca registra un service worker propio.
 * Cualquiera que haya quedado instalado en el navegador —el de MSW, o
 * cualquier otro de un despliegue anterior— puede seguir interceptando
 * peticiones y sirviendo respuestas o páginas cacheadas indefinidamente,
 * incluida una versión vieja de esta misma app: eso puede verse exactamente
 * como "el login funciona pero la pantalla no cambia" si el worker sirve un
 * `index.html`/bundle cacheado en vez de dejar pasar la navegación real. Se
 * desregistra cualquiera, no solo el de MSW por nombre.
 */
async function unregisterStaleServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((reg) => reg.unregister()));
}

// Microsite bootstrap: resuelve el workspace del subdominio actual antes de
// renderizar. apiFetch adjunta X-Workspace-Context a partir de aca (ver
// src/shared/api/client.ts).
Promise.all([unregisterStaleServiceWorkers(), resolveWorkspaceContext()]).then(([, context]) => {
  useWorkspaceContextStore.getState().setContext(context);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
