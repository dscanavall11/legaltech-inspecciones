import { useLegalCases, useLegalCase, type LegalCasesQuery } from '@/shared/legalCases/api';
import { parseCaseMetadata, type LegalCase } from '@/shared/legalCases/types';
import type { Actuacion, EstadoQuerella, Querella, QuerellaDetalle, QuerellaMetadata, TipoActuacion } from './types';

const CASE_TYPE = 'querella';

function nombrePorRol(caso: LegalCase, rol: string): string {
  return caso.parties?.find((p) => p.partyRole?.toLowerCase() === rol)?.fullName ?? 'No identificado';
}

function tipoActuacion(stateCode: string | null): TipoActuacion {
  switch (stateCode) {
    case 'radicada':
      return 'radicacion';
    case 'audiencia_programada':
      return 'audiencia';
    case 'fallo_emitido':
      return 'fallo';
    case 'en_firmeza':
      return 'firmeza';
    default:
      return 'auto';
  }
}

function legalCaseToQuerella(caso: LegalCase): QuerellaDetalle {
  const meta = parseCaseMetadata<QuerellaMetadata>(caso.caseMetadata);
  const primeraFecha = caso.stateHistory?.[0]?.changedAt ?? caso.createdAt ?? new Date().toISOString();

  return {
    id: caso.id,
    radicado: caso.filingNumber ?? 'Sin radicar',
    querellante: nombrePorRol(caso, 'querellante'),
    querellado: nombrePorRol(caso, 'querellado'),
    asunto: meta.asunto ?? caso.background?.reliefSought ?? 'Sin asunto registrado',
    estado: caso.currentStateCode as EstadoQuerella,
    fechaRadicacion: primeraFecha,
    diasTermino: meta.diasTermino ?? 15,
    direccionInmueble: meta.direccionInmueble,
    actuaciones: (caso.stateHistory ?? []).map(
      (h, i): Actuacion => ({
        id: `${caso.id}-${i}`,
        fecha: h.changedAt,
        tipo: tipoActuacion(h.stateCode),
        titulo: h.stateName ?? h.reason ?? h.stateCode ?? 'Actuación',
        descripcion: h.stateName ? (h.reason ?? undefined) : undefined,
        estadoCodigo: h.stateCode ?? undefined,
      }),
    ),
    caseMetadataRaw: caso.caseMetadata,
  };
}

export const querellasKeys = {
  all: ['querellas'] as const,
};

function useQuerellasQuery(opts: Partial<LegalCasesQuery> = {}) {
  return useLegalCases({ caseType: CASE_TYPE, ...opts });
}

export function useQuerellas() {
  const query = useQuerellasQuery();
  return {
    ...query,
    data: query.data?.content.map(legalCaseToQuerella) as Querella[] | undefined,
  };
}

export function useQuerella(id: string) {
  const query = useLegalCase(id);
  return {
    ...query,
    data: query.data ? legalCaseToQuerella(query.data) : undefined,
  };
}
