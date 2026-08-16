import { parseCaseMetadata } from '@/shared/legalCases/types';

/**
 * El recurso de apelación contra la medida correctiva impuesta en el proceso
 * verbal abreviado (Ley 1801 de 2016, art. 223 num. 4).
 *
 * REGLA QUE MANDA SOBRE TODO LO DEMÁS: el inspector NO resuelve la apelación.
 * La resuelve el superior jerárquico — el alcalde, cuando no hay autoridad
 * especial de Policía (arts. 205.8 y 205.14). Lo que hace el despacho es
 * verificar la oportunidad, conceder en el efecto devolutivo y remitir. Por eso
 * este módulo no tiene ningún concepto de "decidir el recurso": no le
 * corresponde, y modelarlo invitaría a usarlo.
 */

/** Cómo llegó el recurso. La apelación suele venir en subsidio de la reposición. */
export type ViaRecurso = 'apelacion_directa' | 'reposicion_y_subsidio';

/** En qué calidad actúa quien apela. */
export type CalidadRecurrente = 'infractor' | 'querellante' | 'querellado' | 'apoderado';

export interface RecursoApelacion {
  via: ViaRecurso;
  recurrenteNombre: string;
  recurrenteIdentificacion: string;
  calidad: CalidadRecurrente;
  /** Audiencia en que se profirió la decisión apelada, ISO. */
  fechaAudiencia: string;
  /**
   * Si se interpuso y sustentó dentro de esa misma audiencia. El art. 223
   * num. 4 no da plazo posterior: fuera de la audiencia, no hay recurso.
   */
  enLaMismaAudiencia: boolean;
  /** Fecha del auto que concede o niega, ISO. Suele ser la de la audiencia. */
  fechaConcesion: string;
  /** Qué se decidió en primera instancia y ahora se apela. */
  decisionApelada: string;
  /** Lo que sustentó el recurrente en la audiencia. */
  sustentacion: string;
  /** A quién se remite: alcalde, o la autoridad especial si el municipio la tiene. */
  superior: string;
}

export const RECURSO_VACIO: RecursoApelacion = {
  via: 'reposicion_y_subsidio',
  recurrenteNombre: '',
  recurrenteIdentificacion: '',
  calidad: 'infractor',
  fechaAudiencia: '',
  enLaMismaAudiencia: true,
  fechaConcesion: '',
  decisionApelada: '',
  sustentacion: '',
  superior: '',
};

export const VIAS: { valor: ViaRecurso; label: string; ayuda: string }[] = [
  {
    valor: 'reposicion_y_subsidio',
    label: 'Reposición y, en subsidio, apelación',
    ayuda: 'La reposición se resolvió de inmediato en la audiencia; la apelación queda para el superior.',
  },
  {
    valor: 'apelacion_directa',
    label: 'Apelación directa',
    ayuda: 'El recurrente apeló sin pedir reposición.',
  },
];

export const CALIDADES: { valor: CalidadRecurrente; label: string }[] = [
  { valor: 'infractor', label: 'Presunto infractor' },
  { valor: 'querellante', label: 'Querellante' },
  { valor: 'querellado', label: 'Querellado' },
  { valor: 'apoderado', label: 'Apoderado' },
];

/** Días hábiles para remitir la actuación al superior (art. 223 num. 4). */
export const DIAS_PARA_REMITIR = 2;

/** Días que tiene el superior para resolver, contados desde el recibo. Informativo. */
export const DIAS_SUPERIOR_RESUELVE = 8;

export interface ControlOportunidad {
  procedente: boolean;
  motivo: string;
}

/**
 * El único control de fondo que le toca al despacho. El art. 223 num. 4 exige
 * que el recurso se solicite, conceda y sustente **dentro de la misma
 * audiencia**; no abre un plazo posterior. Interpuesto después, es
 * extemporáneo y se niega — negar por extemporáneo no es resolver el recurso.
 */
export function controlOportunidad(recurso: RecursoApelacion): ControlOportunidad {
  return recurso.enLaMismaAudiencia
    ? {
        procedente: true,
        motivo:
          'El recurso se interpuso y sustentó dentro de la misma audiencia, como exige el numeral 4 del artículo 223 de la Ley 1801 de 2016.',
      }
    : {
        procedente: false,
        motivo:
          'El recurso no se interpuso dentro de la audiencia en que se profirió la decisión. El numeral 4 del artículo 223 de la Ley 1801 de 2016 exige que se solicite, conceda y sustente en esa misma diligencia, sin habilitar término posterior, por lo que resulta extemporáneo.',
      };
}

/** Lo que falta para que el auto salga completo. Vacío = listo para generar. */
export function faltantesParaAuto(recurso: RecursoApelacion): string[] {
  return [
    [recurso.recurrenteNombre.trim(), 'nombre de quien apela'] as const,
    [recurso.fechaAudiencia.trim(), 'fecha de la audiencia'] as const,
    [recurso.fechaConcesion.trim(), 'fecha del auto'] as const,
    [recurso.decisionApelada.trim(), 'decisión que se apela'] as const,
    [recurso.superior.trim(), 'superior jerárquico al que se remite'] as const,
  ]
    .filter(([valor]) => valor.length === 0)
    .map(([, etiqueta]) => `Falta el ${etiqueta}.`);
}

/** Rótulo del recurrente para el encabezado del auto. */
export function rotuloRecurrente(recurso: RecursoApelacion): string {
  const nombre = recurso.recurrenteNombre.trim() || '—';
  const id = recurso.recurrenteIdentificacion.trim();
  return id ? `${nombre} (${id})` : nombre;
}

interface MetadataConRecurso {
  recursoApelacion?: Partial<RecursoApelacion>;
}

export function leerRecurso(caseMetadataRaw: string | null | undefined): RecursoApelacion {
  const guardado =
    parseCaseMetadata<MetadataConRecurso>(caseMetadataRaw ?? null).recursoApelacion ?? {};
  return { ...RECURSO_VACIO, ...guardado };
}
