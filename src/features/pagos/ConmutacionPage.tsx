import { AreaTrabajoAcogida } from './AreaTrabajoAcogida';
import { VIA_CONMUTACION } from './viaAcogida';

/** Área de trabajo de la conmutación (art. 180 par.: solo multas tipo 1 y 2). */
export function ConmutacionPage() {
  return <AreaTrabajoAcogida via={VIA_CONMUTACION} />;
}
