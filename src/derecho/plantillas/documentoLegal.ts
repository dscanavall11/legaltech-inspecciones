import type { CausalIncremento } from '../multas';

/**
 * Tipo estructurado compartido por los generadores de autos y constancias del
 * despacho (avoca cita a audiencia, decreta pruebas y suspende, inasistencia,
 * constancias de incumplimiento). Generaliza el patrón de `ActaFirmeza`
 * (entidad/epigrafe/tablaDatos/secciones/cierre/firma) sin modificar
 * `actaFirmeza.ts`: aquí la parte dispositiva se llama `resuelve` (algunas
 * constancias no tienen ninguna) y `firma` es una lista, porque ciertos
 * autos llevan firma adicional del ciudadano notificado.
 */
export interface FirmaLinea {
  nombre: string;
  rol: string;
  /** 'solicitado'/'testigo': usados por declaracion-testigo.yaml (recepción de prueba testimonial). */
  tipo?: 'notificado' | 'solicitado' | 'testigo';
}

export interface SeccionDocumento {
  titulo?: string;
  parrafos: string[];
}

export interface DocumentoLegal {
  entidad: string;
  tituloDocumento: string;
  proceso: string;
  fechaResolucionLetras: string;
  epigrafe?: string;
  tablaDatos: { etiqueta: string; valor: string }[];
  secciones: SeccionDocumento[];
  resuelve: string[];
  cierre: string;
  firma: FirmaLinea[];
}

/**
 * Incluye `valor` en el arreglo únicamente si `condicion` se cumple.
 * Mecanismo genérico para los slots `condicion:` de las plantillas OKF
 * (p. ej. la firma del ciudadano notificado solo cuando
 * `medioImpugnacion == personal`) — un único punto de implementación en vez
 * de repetir if/else ad hoc en cada generador.
 */
export function incluirSi<T>(condicion: boolean, valor: T): T[] {
  return condicion ? [valor] : [];
}

/**
 * Párrafo fijo que transcribe los numerales 9 y 10 del artículo 223A (fuente:
 * okf-bundles/brains/derecho-policia-convivencia/normas/art-223a-dosificacion-firmeza.md).
 * Compartido por acta-pronto-pago y acta-conmutacion, que citan estos
 * numerales (a diferencia de acta-firmeza.ts, que cita los literales i)/j)
 * de la redacción previa a la Ley 2197 de 2022 y no se modifica aquí).
 */
export const TEXTO_NUMERALES_9_10_223A =
  'De conformidad con lo dispuesto en los numerales 9 y 10 del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022, el incremento del valor de la multa general procede en los siguientes eventos: 9. Cuando se pueda evidenciar el incumplimiento por parte de la misma persona en el pago de alguna multa general anterior, reportada al boletín de deudores morosos sin pagar, la nueva medida se incrementará en un 50% del valor de la segunda medida. 10. La reiteración de un comportamiento contrario a la convivencia cuya medida corresponda a multa, dentro del año siguiente a la firmeza de la primera medida, dará lugar a que su valor se aumente en un 75%, sin perjuicio del artículo 36. Quien reitere después de un año, la multa se incrementa en 50%.';

/**
 * Párrafo(s) de verificación RNMC/BDME que MOTIVAN la causal de reincidencia
 * marcada por el inspector (la causal nunca se aplica sola: siempre va
 * acompañada de esta motivación y, si el inspector aportó evidencia
 * adicional, de esa evidencia). Compartido por acta-pronto-pago.ts y
 * acta-conmutacion.ts — mismo texto de fondo, el consecuente (descuento vs.
 * cobro contingente) lo decide cada generador en su propio `resuelve`.
 */
export function parrafosReiteracion223A(opts: {
  solicitado: string;
  tipoMulta: number;
  comparendo: string;
  causal: CausalIncremento;
  causalEvidencia?: string;
}): string[] {
  const { solicitado, tipoMulta, comparendo, causal, causalEvidencia } = opts;
  const evidencia = causalEvidencia?.trim();
  const sufijoEvidencia = evidencia ? ` Evidencia aportada al expediente: ${evidencia}.` : '';
  switch (causal) {
    case 'reiteracion_dentro_del_anio':
      return [
        `Revisado el Registro Nacional de Medidas Correctivas (RNMC), se constató que el ciudadano ${solicitado} registra una multa general anterior en firme por el mismo comportamiento contrario a la convivencia, cuya firmeza se produjo dentro del año siguiente a la presente orden de comparendo. En consecuencia, se configura el supuesto de reiteración previsto en el numeral 10 del artículo 223A de la Ley 1801 de 2016, razón por la cual procede el incremento del valor de la multa general en un setenta y cinco por ciento (75%), sobre el valor de la multa general tipo ${tipoMulta} señalada en la orden de comparendo Nro. ${comparendo}.${sufijoEvidencia}`,
      ];
    case 'reiteracion_despues_del_anio':
      return [
        `Revisado el Registro Nacional de Medidas Correctivas (RNMC), se constató que el ciudadano ${solicitado} registra una multa general anterior en firme por el mismo comportamiento contrario a la convivencia, cuya firmeza se produjo con antelación superior a un año respecto de la presente orden de comparendo. En consecuencia, se configura el supuesto de reiteración previsto en el inciso final del numeral 10 del artículo 223A de la Ley 1801 de 2016, razón por la cual procede el incremento del valor de la multa general en un cincuenta por ciento (50%), sobre el valor de la multa general tipo ${tipoMulta} señalada en la orden de comparendo Nro. ${comparendo}.${sufijoEvidencia}`,
      ];
    case 'moroso_bdme':
      return [
        `Revisado el expediente, se constató que el ciudadano ${solicitado} se encuentra reportado en el Boletín de Deudores Morosos del Estado (BDME) de la Contaduría General de la Nación por el incumplimiento en el pago de una multa general anterior por comportamiento contrario a la convivencia, sin que la misma haya sido pagada. En consecuencia, se configura el supuesto previsto en el numeral 9 del artículo 223A de la Ley 1801 de 2016, razón por la cual procede el incremento del valor de la multa general en un cincuenta por ciento (50%), sobre el valor de la multa general tipo ${tipoMulta} señalada en la orden de comparendo Nro. ${comparendo}.${sufijoEvidencia}`,
      ];
    case 'ninguna':
    default:
      return [
        `Revisado el Registro Nacional de Medidas Correctivas, se constató que el ciudadano ${solicitado} no registra multas anteriores en firme por el mismo comportamiento que dio lugar a la presente orden de comparendo. En consecuencia, no se configura el supuesto legal de reiteración previsto en el numeral 10 del artículo 223A de la Ley 1801 de 2016 y no resulta procedente aplicar incremento al valor de la multa impuesta.`,
        `Por su parte, no obra en el expediente información que permita establecer que el ciudadano se encuentre reportado en el Boletín de Deudores Morosos del Estado (BDME) por incumplimiento en el pago de una multa general derivada de un comportamiento contrario a la convivencia. En consecuencia, al no acreditarse el supuesto fáctico del numeral 9 del artículo 223A de la Ley 1801 de 2016, no resulta procedente aplicar el incremento del cincuenta por ciento (50%) por esta causa.`,
      ];
  }
}
