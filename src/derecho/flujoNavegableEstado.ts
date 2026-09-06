/**
 * Estado visual de un nodo del mapa navegable (Task 15, generalizado en Task
 * 20 para servir cualquier máquina de estados — comparendo, querella, y las
 * que vengan). Pura — sin React ni AntD, sin conocer ningún dominio concreto
 * — para poder testearla sin montar el componente.
 */
export type EstadoNodoFlujo = 'actual' | 'visitado' | 'alcanzable' | 'neutral';

/** Forma mínima de transición que esta lógica necesita — de/a bastan, evento/label son solo del componente. */
export interface TransicionFlujo<TEstado extends string> {
  de: TEstado;
  a: TEstado | string;
}

/**
 * Destinos alcanzables en un solo salto desde `estado`.
 * `excluirDestino` deja fuera un destino que no es un estado propio de la
 * máquina (p. ej. `acta_firmeza`, el `convierte_a` del comparendo) — ninguna
 * máquina sin conversión lo necesita, por eso es opcional.
 */
export function estadosAlcanzablesDesde<TEstado extends string>(
  estado: TEstado,
  transiciones: ReadonlyArray<TransicionFlujo<TEstado>>,
  excluirDestino?: string,
): ReadonlySet<TEstado> {
  return new Set(
    transiciones
      .filter((t) => t.de === estado && t.a !== excluirDestino)
      .map((t) => t.a as TEstado),
  );
}

function estadoDeNodo<TEstado extends string>(
  estado: TEstado,
  estadoActual: TEstado,
  visitados: ReadonlySet<string>,
  alcanzables: ReadonlySet<TEstado>,
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
 * Deriva, para cada estado de la máquina, su estado visual dado el estado
 * actual del expediente y los códigos de estado por los que ya pasó (del
 * historial de actuaciones).
 */
export function derivarEstadosFlujo<TEstado extends string>(
  todosLosEstados: ReadonlyArray<TEstado>,
  estadoActual: TEstado,
  estadosVisitados: ReadonlyArray<string | null | undefined>,
  transiciones: ReadonlyArray<TransicionFlujo<TEstado>>,
  excluirDestino?: string,
): Record<TEstado, EstadoNodoFlujo> {
  const visitados = new Set(estadosVisitados.filter((s): s is string => Boolean(s)));
  const alcanzables = estadosAlcanzablesDesde(estadoActual, transiciones, excluirDestino);
  return todosLosEstados.reduce<Record<TEstado, EstadoNodoFlujo>>(
    (acc, estado) => ({ ...acc, [estado]: estadoDeNodo(estado, estadoActual, visitados, alcanzables) }),
    {} as Record<TEstado, EstadoNodoFlujo>,
  );
}

/** Agrupa los estados por índice de etapa (0-based), para las columnas del mapa. */
export function agruparEstadosPorEtapa<TEstado extends string>(
  todosLosEstados: ReadonlyArray<TEstado>,
  etapaActivaPorEstado: Record<TEstado, number>,
  cantidadEtapas: number,
): TEstado[][] {
  return Array.from({ length: cantidadEtapas }, (_, i) =>
    todosLosEstados.filter((estado) => etapaActivaPorEstado[estado] === i),
  );
}
