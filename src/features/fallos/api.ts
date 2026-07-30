import { useLegalCases } from '@/shared/legalCases/api';
import type { LegalCase } from '@/shared/legalCases/types';
import type { EstadoFallo, Fallo } from './types';

const ESTADOS_FALLO: EstadoFallo[] = ['fallo_emitido', 'en_firmeza', 'apelado', 'archivada'];

function nombrePorRol(caso: LegalCase, rol: string): string {
  return caso.parties?.find((p) => p.partyRole?.toLowerCase() === rol)?.fullName ?? 'No identificado';
}

function legalCaseToFallo(caso: LegalCase): Fallo {
  return {
    id: caso.id,
    radicado: caso.filingNumber,
    tipo: caso.caseType,
    fechaFallo: caso.stateHistory?.find((h) => h.reason?.includes('fallo_emitido'))?.changedAt ?? caso.createdAt ?? '',
    querellante: nombrePorRol(caso, 'querellante') !== 'No identificado' ? nombrePorRol(caso, 'querellante') : nombrePorRol(caso, 'quejoso'),
    querellado: nombrePorRol(caso, 'querellado') !== 'No identificado' ? nombrePorRol(caso, 'querellado') : nombrePorRol(caso, 'acusado'),
    comportamiento: caso.background?.allegedFacts ?? caso.background?.reliefSought ?? '',
    fundamentacion: caso.legalReasoning ?? '',
    pruebas: caso.evidenceAssessment ?? '',
    estado: (ESTADOS_FALLO.includes(caso.currentStateCode as EstadoFallo)
      ? caso.currentStateCode
      : 'fallo_emitido') as EstadoFallo,
  };
}

/**
 * Casos con fallo real: caseType querella/queja en un estado post-decisión,
 * y con legalReasoning efectivamente guardado (ver AnalisisPage "Guardar y
 * proferir fallo"). Sin eso, el caso está en fallo_emitido pero sin
 * contenido - no se muestra como si tuviera un fallo redactado.
 */
export function useFallos() {
  const querellas = useLegalCases({ caseType: 'querella', size: 200 });
  const quejas = useLegalCases({ caseType: 'queja', size: 200 });

  const todos = [...(querellas.data?.content ?? []), ...(quejas.data?.content ?? [])]
    .filter((c) => ESTADOS_FALLO.includes(c.currentStateCode as EstadoFallo) && c.legalReasoning)
    .map(legalCaseToFallo);

  return {
    isLoading: querellas.isLoading || quejas.isLoading,
    isError: querellas.isError || quejas.isError,
    data: todos,
  };
}
