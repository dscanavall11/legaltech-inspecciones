import { useLegalCases } from '@/shared/legalCases/api';
import { parseCaseMetadata, type LegalCase } from '@/shared/legalCases/types';
import type { ItemCola } from './types';

/**
 * La cola unifica TODOS los tipos de caso (querella, queja, acta_firmeza,
 * apelación...) en una sola vista de trabajo pendiente - por eso no filtra
 * por caseType, a diferencia de las demás features. Cada tipo simplemente
 * usa su propio currentStateCode como estado (acta_firmeza ya tiene
 * pendiente/generada/revisada/expedida como estados reales, no hace falta
 * un "estadoActa" aparte).
 */
function legalCaseToItemCola(caso: LegalCase): ItemCola {
  const meta = parseCaseMetadata<{ asunto?: string }>(caso.caseMetadata);
  return {
    id: caso.id,
    tipo: (caso.caseType as ItemCola['tipo']) ?? 'querella',
    radicado: caso.filingNumber,
    titulo: meta.asunto ?? caso.background?.reliefSought ?? caso.background?.allegedFacts ?? 'Sin título',
    estado: caso.currentStateCode,
    fecha: (caso.createdAt ?? caso.stateHistory?.[0]?.changedAt ?? '').slice(0, 10),
  };
}

export function useCola() {
  const query = useLegalCases({ size: 200 });
  return {
    ...query,
    data: query.data?.content.map(legalCaseToItemCola),
  };
}
