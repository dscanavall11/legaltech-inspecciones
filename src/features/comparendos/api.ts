import { useLegalCases, useLegalCase, useCreateLegalCase } from '@/shared/legalCases/api';
import { parseCaseMetadata, buildCaseMetadata, type LegalCase, type CreateLegalCaseInput } from '@/shared/legalCases/types';
import { useInspeccionStore } from '@/store/inspeccionStore';
import type { EstadoComparendo } from '@/derecho';
import type {
  ActuacionComparendo,
  Comparendo,
  ComparendoDetalle,
  ComparendoMetadata,
  TipoActuacionComparendo,
} from './types';

const CASE_TYPE = 'comparendo';

function nombrePorRol(caso: LegalCase, rol: string): string {
  return caso.parties?.find((p) => p.partyRole?.toLowerCase() === rol)?.fullName ?? 'No identificado';
}

function idPorRol(caso: LegalCase, rol: string): string {
  return caso.parties?.find((p) => p.partyRole?.toLowerCase() === rol)?.identificationNumber ?? '';
}

function tipoActuacion(stateCode: string | null): TipoActuacionComparendo {
  switch (stateCode) {
    case 'recibido':
      return 'radicacion';
    case 'verificado':
      return 'verificacion';
    case 'en_espera_objecion':
    case 'objetado':
    case 'sin_objecion':
      return 'objecion';
    case 'audiencia_programada':
    case 'en_audiencia':
    case 'suspendida_pruebas':
    case 'suspendida_inasistencia':
      return 'audiencia';
    case 'fallo_emitido':
      return 'fallo';
    case 'en_recurso':
      return 'recurso';
    case 'en_firmeza':
      return 'firmeza';
    case 'archivado':
    case 'terminado_inactividad':
      return 'archivo';
    default:
      return 'otro';
  }
}

function legalCaseToComparendo(caso: LegalCase): ComparendoDetalle {
  const meta = parseCaseMetadata<ComparendoMetadata>(caso.caseMetadata);
  const primeraFecha = caso.stateHistory?.[0]?.changedAt ?? caso.createdAt ?? new Date().toISOString();

  return {
    id: caso.id,
    radicado: caso.filingNumber,
    numeroComparendo: meta.numeroComparendo ?? 'Sin número',
    infractor: nombrePorRol(caso, 'infractor'),
    cedula: meta.cedula ?? idPorRol(caso, 'infractor'),
    articuloNumeral: meta.articuloNumeral ?? 'Sin registro',
    lugar: meta.lugar ?? 'Sin registro',
    fechaComparendo: meta.fechaComparendo ?? primeraFecha,
    tipoMulta: meta.tipoMulta ?? 1,
    estado: caso.currentStateCode as EstadoComparendo,
    fechaRadicacion: primeraFecha,
    direccion: meta.direccion ?? '',
    telefono: meta.telefono ?? '',
    solicitante: meta.solicitante ?? nombrePorRol(caso, 'autoridad'),
    descripcionConducta: meta.descripcionConducta,
    hechos: meta.hechos ?? caso.background?.allegedFacts ?? '',
    causal: meta.causal ?? 'ninguna',
    actuaciones: (caso.stateHistory ?? []).map(
      (h, i): ActuacionComparendo => ({
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

export const comparendosKeys = {
  all: ['comparendos'] as const,
};

export function useComparendos() {
  const query = useLegalCases({ caseType: CASE_TYPE });
  return {
    ...query,
    data: query.data?.content.map(legalCaseToComparendo) as Comparendo[] | undefined,
  };
}

export function useComparendo(id: string) {
  const query = useLegalCase(id);
  return {
    ...query,
    data: query.data ? legalCaseToComparendo(query.data) : undefined,
  };
}

/** Datos capturados en la radicación (extraídos del PDF o diligenciados a mano). */
export interface NuevoComparendoInput {
  numeroComparendo: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono: string;
  lugar: string;
  fechaComparendo: string; // ISO date
  solicitante: string;
  articuloNumeral: string;
  descripcionConducta?: string;
  hechos: string;
  tipoMulta: ComparendoMetadata['tipoMulta'];
  causal: ComparendoMetadata['causal'];
}

/** Radica un nuevo comparendo — mismo recurso genérico /legal-cases, caseType="comparendo". */
export function useCreateComparendo() {
  const crear = useCreateLegalCase();
  return {
    isPending: crear.isPending,
    mutate: (
      datos: NuevoComparendoInput,
      options?: { onSuccess?: (caso: LegalCase) => void; onError?: () => void },
    ) => {
      const { municipio } = useInspeccionStore.getState().config;
      const metadata: ComparendoMetadata = {
        numeroComparendo: datos.numeroComparendo,
        articuloNumeral: datos.articuloNumeral,
        descripcionConducta: datos.descripcionConducta,
        lugar: datos.lugar,
        fechaComparendo: datos.fechaComparendo,
        tipoMulta: datos.tipoMulta,
        causal: datos.causal,
        cedula: datos.cedula,
        telefono: datos.telefono,
        direccion: datos.direccion,
        solicitante: datos.solicitante,
        hechos: datos.hechos,
      };
      const input: CreateLegalCaseInput = {
        caseType: CASE_TYPE,
        venueCity: municipio || 'Manizales',
        caseMetadata: buildCaseMetadata(metadata as unknown as Record<string, unknown>),
        background: {
          allegedFacts: datos.hechos || null,
          reliefSought: null,
          defensesAndObjections: null,
        },
        parties: [
          {
            partyRole: 'infractor',
            identificationType: 'CC',
            identificationNumber: datos.cedula,
            fullName: datos.solicitado,
          },
          ...(datos.solicitante
            ? [
                {
                  partyRole: 'autoridad',
                  identificationType: 'N/A',
                  identificationNumber: '',
                  fullName: datos.solicitante,
                },
              ]
            : []),
        ],
      };
      crear.mutate(input, {
        onSuccess: options?.onSuccess,
        onError: options?.onError,
      });
    },
  };
}
