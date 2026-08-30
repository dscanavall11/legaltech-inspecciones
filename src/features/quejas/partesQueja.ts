import { parseCaseMetadata, type CaseParty } from '@/shared/legalCases/types';
import type { Comparendo } from '@/features/actas/comparendos';
import { faltantesDeParte, PARTE_VACIA, type DatosParte } from '@/shared/partes/parte';
import {
  buscarPorCasilla,
  etiquetasPropuestas,
  fusionarParte,
  sinUbicar,
  type ParteExtraida,
  type Vocabulario,
} from '@/shared/partes/rolesExtraidos';

/**
 * Sujetos de la queja. Es UNA parte, no dos: la queja es el expediente del
 * comparendo impugnado y el trámite es oficioso —hay presunto infractor, no
 * querellante—, a diferencia de la querella, que requiere impulso de parte y
 * tiene dos sujetos procesales (Decreto 768 de 2025, art. 2.2.8.18.3.3).
 *
 * La autoridad que impuso el comparendo se guarda aparte y no como parte
 * contraria: no es un sujeto procesal enfrentado al ciudadano.
 */
export interface PartesQueja {
  infractor: DatosParte;
  /** Número del comparendo impugnado — el expediente existe por él. */
  numeroComparendo: string;
  /** Comportamiento contrario a la convivencia: artículo y numeral de la Ley 1801. */
  articuloNumeral: string;
  /** Uniformado o dependencia que impuso el comparendo. */
  autoridadImpone: string;
  /** Fecha de la objeción: de ella cuelga el término del art. 223A. */
  fechaObjecion: string;
}

export const PARTES_QUEJA_VACIAS: PartesQueja = {
  infractor: { ...PARTE_VACIA },
  numeroComparendo: '',
  articuloNumeral: '',
  autoridadImpone: '',
  fechaObjecion: '',
};

interface MetadataConPartes {
  partes?: Partial<PartesQueja>;
}

export function leerPartesQueja(caseMetadataRaw: string | null | undefined): PartesQueja {
  const guardadas = parseCaseMetadata<MetadataConPartes>(caseMetadataRaw ?? null).partes ?? {};
  return {
    ...PARTES_QUEJA_VACIAS,
    ...guardadas,
    infractor: { ...PARTE_VACIA, ...guardadas.infractor },
  };
}

/** Lo que impide que la decisión identifique al presunto infractor y el comparendo. */
export function faltantesParaDecision(partes: PartesQueja): string[] {
  return [
    ...faltantesDeParte('presunto infractor', partes.infractor),
    ...(partes.numeroComparendo.trim().length === 0 ? ['Número del comparendo'] : []),
    ...(partes.articuloNumeral.trim().length === 0
      ? ['Artículo y numeral de la Ley 1801 de 2016']
      : []),
  ];
}

/**
 * La ficha traducida a `case_parties`. La autoridad va con su propio rol y no
 * como contraparte: quien impone el comparendo no es un sujeto procesal
 * enfrentado al ciudadano, y modelarla así invitaría a tratarla como tal.
 */
export function aCasePartiesQueja(partes: PartesQueja): CaseParty[] {
  return [
    ...(partes.infractor.nombre.trim().length > 0
      ? [
          {
            partyRole: 'infractor',
            identificationType: partes.infractor.tipoIdentificacion,
            identificationNumber: partes.infractor.identificacion.trim(),
            fullName: partes.infractor.nombre.trim(),
          },
        ]
      : []),
    ...(partes.autoridadImpone.trim().length > 0
      ? [
          {
            partyRole: 'autoridad',
            identificationType: 'N/A',
            identificationNumber: '',
            fullName: partes.autoridadImpone.trim(),
          },
        ]
      : []),
  ];
}

/** El rol libre del analizador, traducido al vocabulario de la queja. */
const VOCABULARIO: Vocabulario<'infractor'> = {
  infractor: ['infractor', 'quejos', 'comparendad', 'ciudadan', 'objetant', 'investigad'],
};

export const partesQuejaSinUbicar = (extraidas: readonly ParteExtraida[] | undefined): string[] =>
  sinUbicar(extraidas, VOCABULARIO);

/** Vuelca lo extraído sin pisar lo que el inspector ya escribió. */
export function fusionarExtraidasQueja(
  actuales: PartesQueja,
  extraidas: readonly ParteExtraida[] | undefined,
): PartesQueja {
  if (!extraidas || extraidas.length === 0) return actuales;
  return {
    ...actuales,
    infractor: fusionarParte(
      actuales.infractor,
      buscarPorCasilla(extraidas, VOCABULARIO, 'infractor'),
    ),
  };
}

/**
 * Los datos del comparendo leídos del documento o de la base del despacho.
 *
 * Van aparte de las partes porque no son de nadie: identifican el acto
 * impugnado, que es de lo que trata la queja. Solo rellenan huecos, igual que
 * el resto de la ficha.
 */
export function fusionarComparendo(
  actuales: PartesQueja,
  leido: Partial<Comparendo> | undefined,
): PartesQueja {
  if (!leido) return actuales;
  const rellenar = (valor: string, propuesto?: string) =>
    valor.trim().length > 0 ? valor : (propuesto ?? '').trim();
  return {
    ...actuales,
    numeroComparendo: rellenar(actuales.numeroComparendo, leido.comparendo),
    articuloNumeral: rellenar(actuales.articuloNumeral, leido.articuloNumeral),
    autoridadImpone: rellenar(actuales.autoridadImpone, leido.solicitante),
  };
}

/** Qué campos vienen de la máquina y el inspector todavía no ha confirmado. */
export function camposQuejaPorVerificar(
  extraidas: readonly ParteExtraida[] | undefined,
): string[] {
  if (!extraidas || extraidas.length === 0) return [];
  const infractor = buscarPorCasilla(extraidas, VOCABULARIO, 'infractor');
  return etiquetasPropuestas([
    [infractor?.fullName, 'nombre del presunto infractor'],
    [infractor?.identificationNumber, 'identificación del presunto infractor'],
    [infractor?.address, 'dirección del presunto infractor'],
  ]);
}
