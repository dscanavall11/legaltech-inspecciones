import { useLegalCases, useChangeCaseState, useUpdateCaseFields, legalCasesKeys } from '@/shared/legalCases/api';
import { parseCaseMetadata, buildCaseMetadata, type LegalCase } from '@/shared/legalCases/types';
import { useQueryClient } from '@tanstack/react-query';
import type { QuerellaMetadata } from '@/features/querellas/types';

/**
 * "Audiencias" no es un recurso propio en el backend - es una vista derivada
 * de los legal-cases tipo querella que ya están en estado
 * audiencia_programada, con la fecha guardada en su caseMetadata (ver
 * SiguientePaso.tsx). Nada de esto vive en una tabla /audiencias separada.
 */
export interface Audiencia {
  id: string; // id del legal-case
  querellaId: string;
  radicado: string;
  fecha: string; // ISO datetime
  asunto: string;
  querellante: string;
  querellado: string;
}

function nombrePorRol(caso: LegalCase, rol: string): string {
  return caso.parties?.find((p) => p.partyRole?.toLowerCase() === rol)?.fullName ?? 'No identificado';
}

function legalCaseToAudiencia(caso: LegalCase): Audiencia | null {
  const meta = parseCaseMetadata<QuerellaMetadata & { fechaAudiencia?: string }>(caso.caseMetadata);
  if (!meta.fechaAudiencia) return null;
  return {
    id: caso.id,
    querellaId: caso.id,
    radicado: caso.filingNumber ?? 'Sin radicar',
    fecha: meta.fechaAudiencia,
    asunto: meta.asunto ?? caso.background?.reliefSought ?? 'Sin asunto registrado',
    querellante: nombrePorRol(caso, 'querellante'),
    querellado: nombrePorRol(caso, 'querellado'),
  };
}

export function useAudiencias() {
  const query = useLegalCases({ caseType: 'querella', state: 'audiencia_programada' });
  return {
    ...query,
    data: query.data?.content
      .map(legalCaseToAudiencia)
      .filter((a): a is Audiencia => a !== null),
  };
}

export interface ProgramarAudiencia {
  querellaId: string;
  fecha: string; // ISO datetime
}

/** Asigna fecha de audiencia a un caso que aún no la tiene - transición de estado + metadata, no un POST a un recurso aparte. */
export function useProgramarAudiencia() {
  const cambiarEstado = useChangeCaseState();
  const actualizarCampos = useUpdateCaseFields();
  const queryClient = useQueryClient();

  return {
    isPending: cambiarEstado.isPending || actualizarCampos.isPending,
    mutate: (
      { querellaId, fecha }: ProgramarAudiencia,
      options?: { onSuccess?: () => void; onError?: () => void },
    ) => {
      const casoActual = queryClient.getQueryData<LegalCase>(legalCasesKeys.detalle(querellaId));
      const metaActual = parseCaseMetadata<Record<string, unknown>>(casoActual?.caseMetadata ?? null);

      cambiarEstado.mutate(
        { id: querellaId, state: 'audiencia_programada' },
        {
          onSuccess: () => {
            actualizarCampos.mutate(
              { id: querellaId, fields: { caseMetadata: buildCaseMetadata({ ...metaActual, fechaAudiencia: fecha }) } },
              {
                onSuccess: () => options?.onSuccess?.(),
                onError: () => options?.onError?.(),
              },
            );
          },
          onError: () => options?.onError?.(),
        },
      );
    },
  };
}
