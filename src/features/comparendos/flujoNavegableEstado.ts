import { ETAPA_COMPARENDO_ACTIVA, TRANSICIONES_COMPARENDO, type EstadoComparendo } from '@/derecho';

/**
 * Estado visual de un nodo del mapa navegable (Task 15). Pura — sin React ni
 * AntD — para poder testearla sin montar FlujoNavegable.tsx.
 */
export type EstadoNodoFlujo = 'actual' | 'visitado' | 'alcanzable' | 'neutral';

/** Los 17 EstadoComparendo, en el mismo orden declarativo de ETAPA_COMPARENDO_ACTIVA. */
export const TODOS_LOS_ESTADOS_COMPARENDO = Object.keys(ETAPA_COMPARENDO_ACTIVA) as EstadoComparendo[];

/** Destinos alcanzables en un solo salto desde `estado` (ignora el convierte_a de generar_acta_firmeza). */
export function estadosAlcanzablesDesde(estado: EstadoComparendo): ReadonlySet<EstadoComparendo> {
  return new Set(
    TRANSICIONES_COMPARENDO.filter((t) => t.de === estado && t.a !== 'acta_firmeza').map((t) => t.a as EstadoComparendo),
  );
}

function estadoDeNodo(
  estado: EstadoComparendo,
  estadoActual: EstadoComparendo,
  visitados: ReadonlySet<string>,
  alcanzables: ReadonlySet<EstadoComparendo>,
): EstadoNodoFlujo {
  return estado === estadoActual
    ? 'actual'
    : visitados.has(estado)
      ? 'visitado'
      : alcanzables.has(estado)
        ? 'alcanzable'
        : 'neutral';
}

/**
 * Deriva, para cada uno de los 17 EstadoComparendo, su estado visual dado el
 * estado actual del expediente y los códigos de estado por los que ya pasó
 * (del historial de actuaciones — ver ActuacionComparendo.estadoCodigo).
 */
export function derivarEstadosFlujo(
  estadoActual: EstadoComparendo,
  estadosVisitados: ReadonlyArray<string | null | undefined>,
): Record<EstadoComparendo, EstadoNodoFlujo> {
  const visitados = new Set(estadosVisitados.filter((s): s is string => Boolean(s)));
  const alcanzables = estadosAlcanzablesDesde(estadoActual);
  return TODOS_LOS_ESTADOS_COMPARENDO.reduce<Record<EstadoComparendo, EstadoNodoFlujo>>(
    (acc, estado) => ({ ...acc, [estado]: estadoDeNodo(estado, estadoActual, visitados, alcanzables) }),
    {} as Record<EstadoComparendo, EstadoNodoFlujo>,
  );
}

/** Agrupa los EstadoComparendo por índice de etapa (ETAPAS_COMPARENDO), para las columnas del mapa. */
export function agruparEstadosPorEtapa(cantidadEtapas: number): EstadoComparendo[][] {
  return Array.from({ length: cantidadEtapas }, (_, i) =>
    TODOS_LOS_ESTADOS_COMPARENDO.filter((estado) => ETAPA_COMPARENDO_ACTIVA[estado] === i),
  );
}
