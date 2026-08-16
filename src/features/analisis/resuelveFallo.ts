import type { FirmaLinea } from '@/derecho';
import type { DatosParte, PartesQuerella } from '@/features/querellas/partes';
import type { SentidoFallo } from '@/features/querellas/decisionQuerella';

/**
 * La parte resolutiva del fallo de querella: las órdenes numeradas que van
 * después de la motivación.
 *
 * Existe porque faltaba. El art. 2.2.8.18.7.1 del Decreto 768 enumera el
 * contenido mínimo de la DECISIÓN —competencia, hechos, trámite, problema
 * jurídico, valoración, respuesta, fundamentos, decisión, recursos—, y el fallo
 * se estaba armando solo con esos nueve apartes. Pero el decreto lista lo que la
 * decisión debe *motivar*, no los actos que la ley exige alrededor de ella. Un
 * fallo sin RESUELVE es motivación sin órdenes: nadie queda notificado, nada
 * queda en firme y nada se puede ejecutar.
 *
 * Lo que faltaba, tomado de la Ley 1801 y del corpus real del despacho:
 *  - Notificación en estrados (art. 223 num. 3 lit. d). Sin ella no corre el
 *    término de los recursos ni hay ejecutoria.
 *  - Recursos y su oportunidad: en la misma audiencia (art. 223 num. 4).
 *  - Firmeza cuando no se interponen.
 *  - Ingreso al RNMC de la medida correctiva (art. 172 par. 2).
 *  - Mérito ejecutivo y cobro coactivo cuando hay multa (art. 182).
 *
 * ponytail: el texto vive aquí y no en OKF porque el generador todavía no
 * consume `GET /api/template-resolution`. La plantilla canónica es
 * `okf-bundles/.../plantillas/fallo-querella.yaml`; cuando se cablee la
 * resolución, esta constante se borra y se lee de allá. Ver docs/MAESTRO.md §7.
 */

export interface DatosResuelve {
  sentido: SentidoFallo;
  partes: PartesQuerella;
  /** Comportamiento o pretensión sobre la que se decide. */
  comportamiento: string;
  /** Medida correctiva impuesta, en letra. Vacío si absuelve. */
  medidaCorrectiva: string;
  radicado: string;
}

const ORDINALES = [
  'PRIMERO',
  'SEGUNDO',
  'TERCERO',
  'CUARTO',
  'QUINTO',
  'SEXTO',
  'SÉPTIMO',
  'OCTAVO',
  'NOVENO',
];

function rotulo(parte: DatosParte, porDefecto: string): string {
  const nombre = parte.nombre.trim();
  if (nombre.length === 0) return porDefecto;
  const id = parte.identificacion.trim();
  return id ? `${nombre}, identificado(a) con ${parte.tipoIdentificacion} No. ${id}` : nombre;
}

/** Lo que se dispone en el numeral primero, según el sentido. */
function ordenPrincipal(d: DatosResuelve, querellado: string): string[] {
  const medida = d.medidaCorrectiva.trim();
  const disposiciones: Record<SentidoFallo, string[]> = {
    absuelve: [
      `ABSTENERSE de imponer medida correctiva a ${querellado}, por no encontrarse acreditado el comportamiento contrario a la convivencia objeto de la querella No. ${d.radicado}, conforme a lo expuesto en la parte motiva.`,
    ],
    responsable_sin_multa: [
      `DECLARAR que ${querellado} incurrió en el comportamiento contrario a la convivencia objeto de la querella No. ${d.radicado}.`,
      `ABSTENERSE de imponer la medida correctiva de multa y, en su lugar, IMPONER ${
        medida || 'la medida pedagógica o el programa comunitario que corresponda'
      }, por resultar suficiente, necesaria y proporcional para restablecer la convivencia (Decreto 768 de 2025, arts. 2.2.8.18.2.1 y 2.2.8.18.2.2).`,
    ],
    sanciona: [
      `DECLARAR que ${querellado} incurrió en el comportamiento contrario a la convivencia objeto de la querella No. ${d.radicado}.`,
      `IMPONER a ${querellado} ${medida || 'la medida correctiva que corresponda'}, por las razones expuestas en la parte motiva.`,
    ],
  };
  return disposiciones[d.sentido];
}

/** Numera las órdenes: PRIMERO, SEGUNDO… y sigue con cifras si se pasa de nueve. */
function numerar(ordenes: string[]): string[] {
  return ordenes.map((orden, i) => `${ORDINALES[i] ?? `${i + 1}.`}: ${orden}`);
}

export function construirResuelve(d: DatosResuelve): string[] {
  const querellante = rotulo(d.partes.querellante, 'el querellante');
  const querellado = rotulo(d.partes.querellado, 'el querellado');
  const imponeMedida = d.sentido !== 'absuelve';

  return numerar([
    ...ordenPrincipal(d, querellado),
    // Sin esto la decisión no queda notificada y no empieza a correr nada.
    `NOTIFICAR EN ESTRADOS la presente decisión a ${querellante} y a ${querellado}, de conformidad con el literal d) del numeral 3 del artículo 223 de la Ley 1801 de 2016.`,
    'ADVERTIR que contra esta decisión proceden los recursos de reposición y, en subsidio, el de apelación ante el superior jerárquico, los cuales se solicitarán, concederán y sustentarán dentro de la misma audiencia (art. 223 num. 4 de la Ley 1801 de 2016). La reposición se resuelve de inmediato; la apelación se concede en el efecto devolutivo y se remite al superior dentro de los dos (2) días siguientes.',
    'DEJAR CONSTANCIA de que, de no interponerse recurso alguno en esta diligencia, la presente decisión queda en firme y presta mérito para su cumplimiento.',
    ...(imponeMedida
      ? [
          'INGRESAR la medida correctiva impuesta en el Registro Nacional de Medidas Correctivas (RNMC), en cumplimiento del parágrafo 2 del artículo 172 de la Ley 1801 de 2016.',
        ]
      : []),
    ...(d.sentido === 'sanciona'
      ? [
          'ADVERTIR que el presente acto administrativo presta mérito ejecutivo, por ser claro, expreso y exigible, y que de no cumplirse el pago en los plazos del artículo 182 de la Ley 1801 de 2016 se remitirán las diligencias a la dependencia de cobro coactivo competente.',
        ]
      : []),
    'Por secretaría, háganse las comunicaciones y anotaciones a que haya lugar.',
  ]);
}

/**
 * Las dos partes firman como notificadas en estrados, además del inspector.
 * En la querella son dos, no una: notificar solo a quien pierde deja al otro
 * sin constancia de haber conocido la decisión.
 */
export function firmasFallo(
  partes: PartesQuerella,
  inspectorNombre: string,
  inspectorCargo: string,
): FirmaLinea[] {
  const notificado = (parte: DatosParte, rol: string): FirmaLinea[] =>
    parte.nombre.trim().length > 0
      ? [
          {
            nombre: parte.nombre.trim(),
            rol: `${rol} — NOTIFICADO EN ESTRADOS`,
            tipo: 'notificado' as const,
          },
        ]
      : [];

  return [
    ...notificado(partes.querellante, 'Querellante'),
    ...notificado(partes.querellado, 'Querellado'),
    { nombre: inspectorNombre, rol: inspectorCargo },
  ];
}
