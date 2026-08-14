import { parseCaseMetadata, type LegalCase } from '@/shared/legalCases/types';

/**
 * Registro único de tipos de proceso y el mapper que lo aplica. Antes cada
 * feature (querellas, quejas, cola, casos, fallos) traía su propia copia de
 * etiquetas, colores de estado, rótulos de partes y su propio mapper.
 *
 * El backend es agnóstico al caseType (ver shared/legalCases/types.ts): estos
 * valores son solo presentación. Módulo sin dependencias de React ni de red,
 * a propósito: así se puede probar el mapeo sin montar la app.
 */

export type TipoProceso = 'querella' | 'queja' | 'comparendo' | 'acta_firmeza' | 'apelacion' | 'fallo';

export interface DefinicionTipoProceso {
  label: string;
  /**
   * partyRole aceptados para cada una de las dos partes, en orden de
   * preferencia. Son listas porque los expedientes reales conviven con varias
   * grafías del mismo papel: una queja trae `quejado` o `acusado`, y los
   * registros más viejos usan PLAINTIFF/DEFENDANT del esquema en inglés.
   */
  roles: [string[], string[]];
  /** Encabezados de columna para esas dos partes. */
  rotulos: [string, string];
  /** Ruta del detalle. Ausente = el tipo aún no tiene pantalla propia (apelación). */
  ruta?: (id: string) => string;
  /**
   * Término por defecto (días hábiles) cuando el expediente no trae
   * `diasTermino` en su metadata. Ausente = no hay un default defendible
   * para ese tipo; la columna Término queda en "—".
   */
  diasTerminoPorDefecto?: number;
}

export const TIPOS_PROCESO: Record<TipoProceso, DefinicionTipoProceso> = {
  querella: {
    label: 'Querella',
    roles: [
      ['querellante', 'plaintiff'],
      ['querellado', 'defendant'],
    ],
    rotulos: ['Querellante', 'Querellado'],
    ruta: (id) => `/panel/querellas/${id}`,
    diasTerminoPorDefecto: 15,
  },
  queja: {
    label: 'Queja',
    roles: [
      ['quejoso', 'plaintiff'],
      ['quejado', 'acusado', 'defendant'],
    ],
    rotulos: ['Quejoso', 'Quejado'],
    ruta: (id) => `/panel/quejas/${id}`,
    diasTerminoPorDefecto: 15,
  },
  comparendo: {
    label: 'Comparendo',
    roles: [
      ['infractor', 'defendant'],
      ['autoridad', 'plaintiff'],
    ],
    rotulos: ['Infractor', 'Autoridad'],
    ruta: (id) => `/panel/comparendos/${id}`,
  },
  acta_firmeza: {
    label: 'Acta de firmeza',
    roles: [
      ['infractor', 'defendant'],
      ['autoridad', 'plaintiff'],
    ],
    rotulos: ['Infractor', 'Autoridad'],
    ruta: () => '/panel/actas-firmeza',
  },
  apelacion: {
    label: 'Apelación',
    roles: [
      ['recurrente', 'querellante', 'plaintiff'],
      ['recurrido', 'querellado', 'defendant'],
    ],
    rotulos: ['Recurrente', 'Recurrido'],
    // art. 223 num. 4, Ley 1801/2016 (mismo valor citado en RadicarDocumentoPage).
    diasTerminoPorDefecto: 3,
  },
  fallo: {
    label: 'Fallo (2.ª inst.)',
    roles: [
      ['recurrente', 'querellante', 'plaintiff'],
      ['recurrido', 'querellado', 'defendant'],
    ],
    rotulos: ['Recurrente', 'Recurrido'],
  },
};

export const TIPOS_PROCESO_LISTA = Object.keys(TIPOS_PROCESO) as TipoProceso[];

export function definicionDe(tipo: string): DefinicionTipoProceso | undefined {
  return TIPOS_PROCESO[tipo as TipoProceso];
}

/**
 * Etiquetas de estado de todos los flujos (querella, queja, comparendo, acta).
 * Un estado que no esté aquí se muestra con su código crudo — preferible a
 * inventarle un nombre.
 */
export const ESTADO_LABEL: Record<string, string> = {
  radicada: 'Radicada',
  en_tramite: 'En trámite',
  audiencia_programada: 'Audiencia programada',
  conciliacion_programada: 'Conciliación programada',
  conciliada: 'Conciliada',
  sin_acuerdo: 'Sin acuerdo',
  fallo_emitido: 'Fallo emitido',
  apelado: 'Apelada — en alzada',
  confirmado: 'Confirmada en 2ª instancia',
  revocado: 'Revocada en 2ª instancia',
  en_firmeza: 'En firmeza',
  archivada: 'Archivada',
  // comparendo (maquinas-estado.yaml, máquina `comparendo`)
  recibido: 'Recibido',
  verificado: 'Verificado',
  en_espera_objecion: 'En espera de objeción',
  objetado: 'Objetado',
  pronto_pago_acordado: 'Pronto pago acordado',
  conmutacion_acordada: 'Conmutación acordada',
  sin_objecion: 'Sin objeción',
  en_audiencia: 'En audiencia',
  suspendida_pruebas: 'Suspendida por pruebas',
  suspendida_inasistencia: 'Suspendida por inasistencia',
  en_recurso: 'En recurso',
  incumplimiento_constatado: 'Incumplimiento constatado',
  terminado_inactividad: 'Terminado por inactividad',
  archivado: 'Archivado',
  // acta de firmeza
  pendiente: 'Pendiente',
  generada: 'Generada',
  revisada: 'Revisada',
  expedida: 'Expedida',
};

export const ESTADO_COLOR: Record<string, string> = {
  radicada: 'blue',
  en_tramite: 'gold',
  audiencia_programada: 'purple',
  conciliacion_programada: 'purple',
  conciliada: 'green',
  sin_acuerdo: 'volcano',
  fallo_emitido: 'cyan',
  apelado: 'orange',
  confirmado: 'green',
  revocado: 'red',
  en_firmeza: 'green',
  archivada: 'default',
  recibido: 'blue',
  verificado: 'blue',
  en_espera_objecion: 'gold',
  objetado: 'orange',
  pronto_pago_acordado: 'green',
  conmutacion_acordada: 'green',
  sin_objecion: 'cyan',
  en_audiencia: 'purple',
  suspendida_pruebas: 'gold',
  suspendida_inasistencia: 'gold',
  en_recurso: 'orange',
  incumplimiento_constatado: 'red',
  terminado_inactividad: 'default',
  archivado: 'default',
  pendiente: 'blue',
  generada: 'green',
  revisada: 'orange',
  expedida: 'purple',
};

export function etiquetaEstado(codigo: string): string {
  return ESTADO_LABEL[codigo] ?? codigo;
}

export function colorEstado(codigo: string): string {
  return ESTADO_COLOR[codigo] ?? 'default';
}

/**
 * Estados posteriores a la decisión: el expediente ya tiene fallo proferido
 * o quedó cerrado por conciliación/2ª instancia/acta expedida. También es
 * el set de "cerrado" para la columna Término (ver ColumnaTermino).
 */
export const ESTADOS_POST_FALLO = [
  'fallo_emitido',
  'en_firmeza',
  'apelado',
  'archivada',
  'conciliada',
  'confirmado',
  'revocado',
  'expedida',
];

/** Fila de la bandeja: lo mínimo que se muestra de cualquier expediente. */
export interface FilaProceso {
  id: string;
  tipo: string;
  radicado: string;
  parteA: string;
  parteB: string;
  asunto: string;
  estado: string;
  fechaRadicacion: string;
  /** Metadata o, si falta, el default del tipo (ver diasTerminoPresuntivo). */
  diasTermino?: number;
  /** true cuando diasTermino no vino en la metadata y se usó el default del tipo. */
  diasTerminoPresuntivo: boolean;
  /** Estado post-decisión Y con motivación guardada: hay un fallo real, no solo un estado. */
  tieneFallo: boolean;
}

/** Texto del tooltip de la columna Término — distingue el valor real del presuntivo. */
export function descripcionTermino(fila: Pick<FilaProceso, 'diasTerminoPresuntivo'>): string {
  return fila.diasTerminoPresuntivo
    ? 'Término presuntivo: el expediente no trae diasTermino en su metadata, se usa el valor por defecto del tipo de proceso.'
    : 'Término tomado de la metadata del expediente.';
}

const SIN_IDENTIFICAR = 'No identificado';

/** Primer party cuyo rol esté en la lista de candidatos, respetando ese orden. */
function nombrePorRol(caso: LegalCase, roles: string[]): string {
  const partes = caso.parties ?? [];
  return (
    roles.map((rol) => partes.find((p) => p.partyRole?.toLowerCase() === rol)).find(Boolean)
      ?.fullName ?? SIN_IDENTIFICAR
  );
}

interface MetadataComun {
  asunto?: string;
  diasTermino?: number;
}

/** Único mapper LegalCase → fila, parametrizado por TIPOS_PROCESO. */
export function legalCaseAFila(caso: LegalCase): FilaProceso {
  const meta = parseCaseMetadata<MetadataComun>(caso.caseMetadata);
  const definicion = definicionDe(caso.caseType);
  const [rolesA, rolesB] = definicion?.roles ?? [[], []];
  const diasTermino = meta.diasTermino ?? definicion?.diasTerminoPorDefecto;

  return {
    id: caso.id,
    tipo: caso.caseType,
    radicado: caso.filingNumber,
    parteA: nombrePorRol(caso, rolesA),
    parteB: nombrePorRol(caso, rolesB),
    asunto:
      meta.asunto ??
      caso.background?.reliefSought ??
      caso.background?.allegedFacts ??
      'Sin asunto registrado',
    estado: caso.currentStateCode,
    fechaRadicacion: caso.stateHistory?.[0]?.changedAt ?? caso.createdAt ?? '',
    diasTermino,
    diasTerminoPresuntivo: meta.diasTermino === undefined && diasTermino !== undefined,
    tieneFallo: ESTADOS_POST_FALLO.includes(caso.currentStateCode) && Boolean(caso.legalReasoning),
  };
}
