import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { useAuth } from '@/shared/auth/auth';

/**
 * Adaptador de almacenamiento por usuario para `zustand/persist` — cada
 * inspector autenticado tiene su propio espacio en localStorage
 * (`<claveBase>:<usuarioId>`), nunca una clave global compartida por
 * cualquiera que use el mismo navegador.
 *
 * `zustand/persist` solo hidrata una vez, al crear el store — si el usuario
 * cambia (login/logout) después de eso, el store no vuelve a leer por su
 * cuenta. Ver `sincronizarEspacioPorUsuario.ts`, que llama a
 * `store.persist.rehydrate()` cada vez que cambia el usuario autenticado,
 * para que este adaptador vuelva a resolver la clave correcta.
 *
 * Migración de una sola vez: la primera sesión autenticada que exista
 * después de este cambio hereda los datos que antes vivían en la clave
 * global `<claveBase>` (para no perder el trabajo ya hecho — hoy solo hay
 * un inspector usando el sistema). Desde ese momento la clave global queda
 * marcada como consumida y ningún otro usuario vuelve a heredarla: cada
 * inspector nuevo arranca con su propio espacio vacío.
 */
export function crearStoragePorUsuario<S>(claveBase: string): PersistStorage<S> {
  const claveMigrado = `${claveBase}:__migrado`;

  function idUsuarioActual(): string | null {
    return useAuth.getState().usuario?.id ?? null;
  }

  return {
    getItem: (_name) => {
      const idUsuario = idUsuarioActual();
      if (!idUsuario) return null; // sin sesión: ni se lee ni se escribe nada

      const clavePropia = `${claveBase}:${idUsuario}`;
      const propio = localStorage.getItem(clavePropia);
      if (propio) return JSON.parse(propio) as StorageValue<S>;

      if (!localStorage.getItem(claveMigrado)) {
        const global = localStorage.getItem(claveBase);
        localStorage.setItem(claveMigrado, idUsuario);
        if (global) {
          localStorage.setItem(clavePropia, global);
          localStorage.removeItem(claveBase);
          return JSON.parse(global) as StorageValue<S>;
        }
      }
      return null;
    },
    setItem: (_name, value) => {
      const idUsuario = idUsuarioActual();
      if (!idUsuario) return;
      localStorage.setItem(`${claveBase}:${idUsuario}`, JSON.stringify(value));
    },
    removeItem: (_name) => {
      const idUsuario = idUsuarioActual();
      if (!idUsuario) return;
      localStorage.removeItem(`${claveBase}:${idUsuario}`);
    },
  };
}
