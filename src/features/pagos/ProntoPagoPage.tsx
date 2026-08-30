import { AreaTrabajoAcogida } from './AreaTrabajoAcogida';
import { VIA_PRONTO_PAGO } from './viaAcogida';

/** Área de trabajo del pronto pago (art. 180 par.: descuento del 50%). */
export function ProntoPagoPage() {
  return <AreaTrabajoAcogida via={VIA_PRONTO_PAGO} />;
}
