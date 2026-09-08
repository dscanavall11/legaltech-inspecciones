import { useAuth } from '@/shared/auth/auth';
import { useComparendosStore } from '@/shared/comparendos/store';
import { useInspeccionStore } from '@/store/inspeccionStore';

/**
 * Cada inspector autenticado tiene su propio espacio de trabajo
 * (`storagePorUsuario.ts`), pero `zustand/persist` solo hidrata una vez, al
 * crear el store. Si el usuario cambia DESPUÉS de eso (login, logout, o un
 * segundo inspector que inicia sesión en la misma pestaña sin recargar), sin
 * esto el estado en memoria seguiría mostrando los datos de la sesión
 * anterior. Se importa una sola vez, por su efecto secundario, en el
 * arranque de la app (`main.tsx`).
 *
 * Solo cubre los stores que representan el "espacio de trabajo" del
 * inspector (base de comparendos cargada, configuración institucional) — no
 * toca Querellas, Autos, Resoluciones ni Apelaciones, que hoy no persisten
 * datos de caso en el navegador.
 */
let idUsuarioAnterior = useAuth.getState().usuario?.id ?? null;

useAuth.subscribe((estado) => {
  const idActual = estado.usuario?.id ?? null;
  if (idActual === idUsuarioAnterior) return;
  idUsuarioAnterior = idActual;
  void useComparendosStore.persist.rehydrate();
  void useInspeccionStore.persist.rehydrate();
});
