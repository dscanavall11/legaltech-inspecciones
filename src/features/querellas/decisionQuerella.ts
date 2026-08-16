import { parseCaseMetadata } from '@/shared/legalCases/types';

/**
 * Cómo se llegó a la decisión y qué se decide. Son dos ejes independientes que
 * el despacho maneja como plantillas distintas, y que aquí se modelan como
 * datos para que el fallo sea uno solo.
 *
 * El eje de la audiencia cambia SOLO el relato del trámite (aparte 3 del art.
 * 2.2.8.18.7.1): si hubo suspensión para practicar pruebas, el trámite narra
 * la audiencia inicial, el decreto de pruebas y la reanudación. El esqueleto
 * del fallo es idéntico en ambos casos.
 */
export type VarianteAudiencia = 'unica' | 'continuacion';

/**
 * El sentido de la decisión (aparte 6). Son TRES, no dos: además de absolver y
 * sancionar existe declarar la responsabilidad y aun así abstenerse de la
 * multa, aplicando el art. 2.2.8.18.2.1 del Decreto 768 (la medida correctiva
 * económica es la última opción) e imponiendo solo medida pedagógica.
 */
export type SentidoFallo = 'absuelve' | 'responsable_sin_multa' | 'sanciona';

export interface DecisionQuerella {
  variante: VarianteAudiencia;
  sentido: SentidoFallo;
  /** Fecha de la audiencia inicial, ISO — solo tiene sentido en continuación. */
  fechaAudienciaInicial: string;
  /** Fecha en que se reanudó, ISO — solo en continuación. */
  fechaReanudacion: string;
}

export const DECISION_VACIA: DecisionQuerella = {
  variante: 'unica',
  sentido: 'absuelve',
  fechaAudienciaInicial: '',
  fechaReanudacion: '',
};

export const VARIANTES: { valor: VarianteAudiencia; label: string; ayuda: string }[] = [
  {
    valor: 'unica',
    label: 'Audiencia única',
    ayuda: 'Se escuchó a las partes y se decidió en la misma diligencia.',
  },
  {
    valor: 'continuacion',
    label: 'Continuación de audiencia',
    ayuda: 'Se suspendió para practicar pruebas y la diligencia se reanudó.',
  },
];

export const SENTIDOS: { valor: SentidoFallo; label: string; ayuda: string }[] = [
  {
    valor: 'absuelve',
    label: 'Absuelve',
    ayuda: 'No se acreditó el comportamiento contrario a la convivencia.',
  },
  {
    valor: 'responsable_sin_multa',
    label: 'Responsable, sin multa',
    ayuda:
      'Se acreditó el comportamiento, pero la multa no resulta necesaria ni proporcional: solo medida pedagógica (art. 2.2.8.18.2.1).',
  },
  {
    valor: 'sanciona',
    label: 'Sanciona',
    ayuda: 'Se acreditó el comportamiento y procede la medida correctiva.',
  },
];

/**
 * Instrucción que se le da al redactor para el aparte 8 (decisión del caso).
 * Los tres sentidos resuelven distinto y no se pueden intercambiar: absolver
 * no es lo mismo que declarar responsable y abstenerse de multar.
 */
export const GUIA_SENTIDO: Record<SentidoFallo, string> = {
  absuelve:
    'La decisión ABSUELVE: no se acreditó el comportamiento. No se declara responsabilidad ni se impone medida alguna.',
  responsable_sin_multa:
    'La decisión DECLARA LA RESPONSABILIDAD pero SE ABSTIENE de imponer la multa, por necesidad, razonabilidad y proporcionalidad (Decreto 768, arts. 2.2.8.18.2.1 y 2.2.8.18.2.2: la medida económica es la última opción y el proceso no es sancionatorio). Debe imponerse, en su lugar, la medida pedagógica o el programa comunitario que corresponda, y motivarse por qué la multa no era necesaria.',
  sanciona:
    'La decisión SANCIONA: se acreditó el comportamiento y se impone la medida correctiva, motivando por qué resulta necesaria, razonable y proporcional frente a las alternativas menos gravosas.',
};

interface MetadataConDecision {
  decisionQuerella?: Partial<DecisionQuerella>;
}

export function leerDecision(caseMetadataRaw: string | null | undefined): DecisionQuerella {
  const guardada =
    parseCaseMetadata<MetadataConDecision>(caseMetadataRaw ?? null).decisionQuerella ?? {};
  return { ...DECISION_VACIA, ...guardada };
}

/**
 * Relato del trámite que corresponde a la variante. Es una guía para el
 * redactor, no el texto final: los hechos concretos los pone el expediente.
 */
export function guiaTramite(decision: DecisionQuerella): string {
  return decision.variante === 'continuacion'
    ? 'El trámite debe narrar: la citación de querellante y querellado, la audiencia inicial, los argumentos de cada parte (20 minutos cada uno, art. 223 num. 3 lit. a), la invitación a conciliar (lit. b), la solicitud y el decreto de pruebas, la suspensión de la diligencia y su reanudación al día siguiente del vencimiento del término probatorio (lit. c).'
    : 'El trámite debe narrar: la citación de querellante y querellado, la instalación de la audiencia, los argumentos de cada parte (20 minutos cada uno, art. 223 num. 3 lit. a), la invitación a conciliar (lit. b) y que, sin necesidad de practicar pruebas adicionales, se decidió de fondo en la misma diligencia (lit. d).';
}
