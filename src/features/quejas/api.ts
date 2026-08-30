import { useLegalCases, useLegalCase } from '@/shared/legalCases/api';
import { parseCaseMetadata, type LegalCase } from '@/shared/legalCases/types';
import type {
  ActuacionQueja,
  CategoriaQueja,
  EstadoQueja,
  Queja,
  QuejaDetalle,
  QuejaMetadata,
  TipoActuacionQueja,
} from './types';

const CASE_TYPE = 'queja';

function nombrePorRol(caso: LegalCase, rol: string): string {
  return caso.parties?.find((p) => p.partyRole?.toLowerCase() === rol)?.fullName ?? 'No identificado';
}

function tipoActuacion(stateCode: string | null): TipoActuacionQueja {
  switch (stateCode) {
    case 'radicada':
      return 'radicacion';
    case 'conciliacion_programada':
      return 'citacion';
    case 'conciliada':
      return 'acuerdo';
    case 'sin_acuerdo':
      return 'sin_acuerdo';
    case 'archivada':
      return 'archivo';
    default:
      return 'avoca';
  }
}

function legalCaseToQueja(caso: LegalCase): QuejaDetalle {
  const meta = parseCaseMetadata<QuejaMetadata>(caso.caseMetadata);
  const primeraFecha = caso.stateHistory?.[0]?.changedAt ?? caso.createdAt ?? new Date().toISOString();

  return {
    id: caso.id,
    radicado: caso.filingNumber,
    quejoso: nombrePorRol(caso, 'quejoso'),
    acusado: nombrePorRol(caso, 'acusado'),
    asunto: meta.asunto ?? caso.background?.reliefSought ?? 'Sin asunto registrado',
    categoria: meta.categoria ?? 'otro',
    estado: caso.currentStateCode as EstadoQueja,
    fechaRadicacion: primeraFecha,
    diasTermino: meta.diasTermino ?? 15,
    descripcionHechos: caso.background?.allegedFacts ?? '',
    actuaciones: (caso.stateHistory ?? []).map(
      (h, i): ActuacionQueja => ({
        id: `${caso.id}-${i}`,
        fecha: h.changedAt,
        tipo: tipoActuacion(h.stateCode),
        titulo: h.stateName ?? h.reason ?? h.stateCode ?? 'Actuación',
        descripcion: h.stateName ? (h.reason ?? undefined) : undefined,
      }),
    ),
    caseMetadataRaw: caso.caseMetadata,
  };
}

export const quejasKeys = {
  all: ['quejas'] as const,
};

export function useQuejas() {
  const query = useLegalCases({ caseType: CASE_TYPE });
  return {
    ...query,
    data: query.data?.content.map(legalCaseToQueja) as Queja[] | undefined,
  };
}

export function useQueja(id: string) {
  const query = useLegalCase(id);
  return {
    ...query,
    data: query.data ? legalCaseToQueja(query.data) : undefined,
  };
}

export type { CategoriaQueja };
