import type { EstadoComparendo, TipoMulta, CausalIncremento } from '@/derecho';

// Estos valores son el flujo real definido en el bundle OKF de convivencia y
// policía (maquinas-estado.yaml) para caseType="comparendo" — el backend
// nunca valida contra este enum, solo guarda el string que legalcase recibe.
export const ESTADO_COMPARENDO_LABEL: Record<EstadoComparendo, string> = {
  recibido: 'Recibido',
  verificado: 'Verificado',
  en_espera_objecion: 'En espera de objeción',
  objetado: 'Objetado',
  pronto_pago_acordado: 'Pronto pago acordado',
  conmutacion_acordada: 'Conmutación acordada',
  sin_objecion: 'Sin objeción',
  audiencia_programada: 'Audiencia programada',
  en_audiencia: 'En audiencia',
  suspendida_pruebas: 'Suspendida — pruebas',
  suspendida_inasistencia: 'Suspendida — inasistencia',
  fallo_emitido: 'Fallo emitido',
  en_recurso: 'En recurso',
  en_firmeza: 'En firmeza',
  incumplimiento_constatado: 'Incumplimiento constatado',
  terminado_inactividad: 'Terminado por inactividad',
  archivado: 'Archivado',
};

// Colores de Tag (AntD) por estado — compartido entre listado y detalle.
export const ESTADO_COMPARENDO_COLOR: Record<EstadoComparendo, string> = {
  recibido: 'blue',
  verificado: 'geekblue',
  en_espera_objecion: 'gold',
  objetado: 'orange',
  pronto_pago_acordado: 'cyan',
  conmutacion_acordada: 'cyan',
  sin_objecion: 'lime',
  audiencia_programada: 'purple',
  en_audiencia: 'purple',
  suspendida_pruebas: 'volcano',
  suspendida_inasistencia: 'volcano',
  fallo_emitido: 'geekblue',
  en_recurso: 'magenta',
  en_firmeza: 'green',
  incumplimiento_constatado: 'red',
  terminado_inactividad: 'default',
  archivado: 'default',
};

export interface Comparendo {
  id: string;
  radicado: string; // número de radicado del caso (legalcase filingNumber)
  numeroComparendo: string; // número físico de la orden de comparendo
  infractor: string;
  cedula: string;
  articuloNumeral: string;
  lugar: string;
  fechaComparendo: string; // ISO date
  tipoMulta: TipoMulta;
  estado: EstadoComparendo;
  fechaRadicacion: string; // ISO date
}

export type TipoActuacionComparendo =
  | 'radicacion'
  | 'verificacion'
  | 'objecion'
  | 'audiencia'
  | 'fallo'
  | 'recurso'
  | 'firmeza'
  | 'archivo'
  | 'otro';

export interface ActuacionComparendo {
  id: string;
  fecha: string; // ISO date
  tipo: TipoActuacionComparendo;
  titulo: string;
  descripcion?: string;
  estadoCodigo?: string;
}

/** Detalle completo del expediente: el comparendo + su historial de actuaciones. */
export interface ComparendoDetalle extends Comparendo {
  direccion: string;
  telefono: string;
  solicitante: string; // procedencia, p. ej. "CAI CHIPRE"
  descripcionConducta?: string;
  hechos: string;
  causal: CausalIncremento;
  actuaciones: ActuacionComparendo[];
  /** Blob crudo de metadata (para fusionar antes de escribir cambios, ver SiguientePasoComparendo). Ausente en datos mock. */
  caseMetadataRaw?: string | null;
}

/**
 * Forma de caseMetadata para caseType="comparendo" — opaco para el backend.
 * Los nombres de los campos de actuación (fechaAudiencia, horaAudiencia,
 * lugarAudiencia, pruebasDecretadas, fechaReanudacion, medioImpugnacion,
 * sentido, variante, fechaCompromiso) son los slots canónicos de las
 * plantillas OKF — no renombrar sin actualizar el bundle.
 */
export interface ComparendoMetadata {
  numeroComparendo: string;
  articuloNumeral: string;
  descripcionConducta?: string;
  lugar: string;
  fechaComparendo: string;
  tipoMulta: TipoMulta;
  causal: CausalIncremento;
  cedula?: string;
  telefono?: string;
  direccion?: string;
  solicitante?: string;
  hechos?: string;

  // ── Metadata de actuaciones (persistida por SiguientePasoComparendo) ──────
  /** avocar_y_citar_audiencia / reagendar_audiencia / admitir_justa_causa */
  fechaAudiencia?: string; // ISO date
  horaAudiencia?: string; // "HH:mm"
  lugarAudiencia?: string;
  /**
   * decretar_pruebas / constancia_inasistencia — snapshot de fechaAudiencia
   * en el momento en que esa audiencia queda suspendida. Su sola presencia
   * es el marcador de "hubo una suspensión previa" (distingue un
   * emitir_fallo/sanciona alcanzado sin pasar por audiencia previa).
   */
  fechaAudienciaAnterior?: string; // ISO date
  /** decretar_pruebas */
  pruebasDecretadas?: string[];
  fechaReanudacion?: string; // ISO date
  /** registrar_impugnacion */
  medioImpugnacion?: string;
  /** emitir_fallo / fallo_por_inasistencia */
  sentido?: 'absuelve' | 'sanciona';
  variante?: string;
  /** Discriminador real de fallo-comparendo.yaml (generador), distinto del rótulo libre `variante` de arriba. */
  varianteFallo?: string;
  /** suscribir_acta_pronto_pago / suscribir_acta_conmutacion */
  fechaCompromiso?: string; // ISO date
  /** resolver_recursos */
  resolucionRecurso?: 'confirma' | 'revoca_absuelve' | 'modifica';

  // ── Datos jurídicos reutilizados por los generadores de documentos
  // (decretar_pruebas / constancia_inasistencia / emitir_fallo /
  // fallo_por_inasistencia / terminar_por_inactividad) — se piden una vez y
  // se recuerdan entre actuaciones del mismo expediente. ─────────────────────
  bienJuridico?: string;
  medidasCorrectivas?: string;
  apeloSiNo?: 'SI' | 'NO';
  descargos?: string;
  pruebasPracticadas?: string[];
  /** solo variante absuelve_unica */
  aplicaActividadPedagogica?: boolean;
  /** solo variantes sanciona_continuacion / inasistencia — dato de oficina, nunca hardcodear */
  cuentaRecaudo?: string;
  titularCuenta?: string;
  nitTitular?: string;
  /** solo variante terminacion_inactividad */
  comparecioVoluntariamente?: boolean;
  terminoActividadPedagogica?: string;
  /** avocar_y_citar_audiencia */
  medioNotificacionAutorizado?: string;
  /** constancia_incumplimiento_pago */
  documentoCobro?: string;
  /** constancia_incumplimiento_actividad — auxiliar de oficina, nunca el inspector por defecto */
  firmanteNombre?: string;
  firmanteRol?: string;
}
