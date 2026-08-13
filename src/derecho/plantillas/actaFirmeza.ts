import { anioConCifra, fechaALetras } from '../letras';
import {
  liquidarMulta,
  VIGENCIA_MULTAS,
  type CausalIncremento,
  type LiquidacionMulta,
  type TipoMulta,
} from '../multas';
import type { DocumentoLegal } from './documentoLegal';

/**
 * Plantilla del acta de firmeza de la multa general (art. 223A, lit. e),
 * Ley 1801 de 2016). Reproduce los modelos del despacho:
 *  - "1. FIRMEZA M. SIN REINCIDENCIA GENERAL"
 *  - "3. FIRMEZA MULTA 4. REINCIDENCIA 75%"
 * Los párrafos para reiteración después del año y moroso BDME se derivan de
 * los literales i) y j) siguiendo la misma estructura. ⚠️ Validar con el
 * equipo jurídico antes de usarlos en producción.
 */
export interface DatosActaFirmeza {
  municipio: string;
  inspeccion: string; // p. ej. "Inspección Permanente de Convivencia y Paz Turno Uno"
  inspectorNombre: string;
  inspectorCargo: string; // p. ej. "Inspector Permanente de Convivencia y Paz – Turno Uno"
  proceso: string; // No. de queja / proceso, p. ej. 2026-6829
  fechaResolucion: string; // ISO
  comparendo: string;
  fechaComparendo: string; // ISO
  articuloNumeral: string; // p. ej. "Artículo 92 Numeral 16"
  lugar: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono: string;
  solicitante: string; // procedencia, p. ej. "CAI CHIPRE"
  hechos: string;
  tipoMulta: TipoMulta;
  causal: CausalIncremento;
  /** Justificación/evidencia (RNMC, BDME) que motiva la causal marcada — nunca se aplica sola. */
  causalEvidencia?: string;
}

export interface SeccionActa {
  titulo?: string;
  parrafos: string[];
}

export interface ActaFirmeza {
  entidad: string;
  tituloDocumento: string;
  proceso: string;
  fechaResolucionLetras: string;
  epigrafe: string;
  tablaDatos: { etiqueta: string; valor: string }[];
  secciones: SeccionActa[];
  dispone: string[];
  cierre: string; // "Manizales, <fecha en letras>."
  firma: { nombre: string; cargo: string };
  liquidacion: LiquidacionMulta;
}

function parrafoRnmc(d: DatosActaFirmeza): string[] {
  const evidencia = d.causalEvidencia?.trim();
  const sufijoEvidencia = evidencia ? ` Evidencia aportada al expediente: ${evidencia}.` : '';
  switch (d.causal) {
    case 'reiteracion_dentro_del_anio':
      return [
        `Revisado el Registro Nacional de Medidas Correctivas (RNMC), se constató que el ciudadano ${d.solicitado} registra una multa general anterior en firme por el mismo comportamiento contrario a la convivencia, cuya firmeza se produjo dentro del año siguiente a la presente orden de comparendo. En consecuencia, se configura el supuesto de reiteración previsto en el literal j) del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022, razón por la cual procede el incremento del valor de la multa general en un setenta y cinco por ciento (75%), sobre el valor de la multa general tipo ${d.tipoMulta} señalada en la orden de comparendo Nro. ${d.comparendo}.${sufijoEvidencia}`,
      ];
    case 'reiteracion_despues_del_anio':
      return [
        `Revisado el Registro Nacional de Medidas Correctivas (RNMC), se constató que el ciudadano ${d.solicitado} registra una multa general anterior en firme por el mismo comportamiento contrario a la convivencia, cuya firmeza se produjo con antelación superior a un año respecto de la presente orden de comparendo. En consecuencia, se configura el supuesto de reiteración previsto en el inciso final del literal j) del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022, razón por la cual procede el incremento del valor de la multa general en un cincuenta por ciento (50%), sobre el valor de la multa general tipo ${d.tipoMulta} señalada en la orden de comparendo Nro. ${d.comparendo}.${sufijoEvidencia}`,
      ];
    case 'moroso_bdme':
      return [
        `Revisado el expediente, se constató que el ciudadano ${d.solicitado} se encuentra reportado en el Boletín de Deudores Morosos del Estado (BDME) de la Contaduría General de la Nación por el incumplimiento en el pago de una multa general anterior por comportamiento contrario a la convivencia, sin que la misma haya sido pagada. En consecuencia, se configura el supuesto previsto en el literal i) del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022, razón por la cual procede el incremento del valor de la multa general en un cincuenta por ciento (50%), sobre el valor de la multa general tipo ${d.tipoMulta} señalada en la orden de comparendo Nro. ${d.comparendo}.${sufijoEvidencia}`,
      ];
    case 'ninguna':
    default:
      return [
        `Revisado el Registro Nacional de Medidas Correctivas, se constató que el ciudadano ${d.solicitado} no registra multas anteriores en firme por el mismo comportamiento que dio lugar a la presente orden de comparendo. En consecuencia, no se configura el supuesto legal de reiteración en el comportamiento y no resulta procedente aplicar incremento al valor de la multa impuesta.`,
        `Por su parte, no obra en el expediente información que permita establecer que el ciudadano se encuentre reportado en el Boletín de Deudores Morosos del Estado (BDME) por incumplimiento en el pago de una multa general derivada de un comportamiento contrario a la convivencia. En consecuencia, al no acreditarse el supuesto fáctico del literal i) del artículo 223A de la Ley 1801 de 2016, no resulta procedente aplicar el incremento del cincuenta por ciento (50%) por esta causa.`,
      ];
  }
}

/** Construye el acta de firmeza completa a partir de los datos del comparendo. */
export function generarActaFirmeza(d: DatosActaFirmeza): ActaFirmeza {
  const liq = liquidarMulta(d.tipoMulta, d.causal);
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);

  const dispone: string[] = [
    `PRIMERO: DAR APLICACIÓN al literal e) del artículo 223A de la Ley 1801 de 2016, adicionado por el artículo 47 de la Ley 2197 de 2022; en consecuencia, DEJAR CONSTANCIA DE LA FIRMEZA de la multa general señalada en la orden de comparendo Nro. ${d.comparendo}, de fecha ${fComparendo}, impuesta en contra del ciudadano ${d.solicitado}, identificado con cédula de ciudadanía Nro. ${d.cedula}, por las razones expuestas en la parte motiva de la presente acta.`,
    `SEGUNDO: INFORMAR a la Secretaría de Hacienda Municipal – Unidad de Recursos Tributarios que el valor de la multa general tipo ${d.tipoMulta}, impuesta mediante orden de comparendo del ciudadano ${d.solicitado}, de conformidad con lo dispuesto en el artículo 180 de la Ley 1801 de 2016, corresponde a ${liq.smdlvLetras} salarios mínimos diarios legales vigentes (SMDLV) para la vigencia ${anioConCifra(VIGENCIA_MULTAS)}, equivalentes a la suma de ${liq.valorBaseLetras}.`,
  ];

  if (d.causal !== 'ninguna') {
    dispone.push(
      d.causal === 'reiteracion_dentro_del_anio'
        ? `En razón de la reiteración del mismo comportamiento contrario a la convivencia dentro del año siguiente a la firmeza de la medida anterior, el valor de la multa se incrementa en un setenta y cinco por ciento (75%), de conformidad con el literal j) del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022.`
        : d.causal === 'reiteracion_despues_del_anio'
          ? `En razón de la reiteración del mismo comportamiento contrario a la convivencia después de un año de la firmeza de la medida anterior, el valor de la multa se incrementa en un cincuenta por ciento (50%), de conformidad con el literal j) del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022.`
          : `En razón del reporte del ciudadano en el Boletín de Deudores Morosos del Estado por el no pago de una multa general anterior, el valor de la multa se incrementa en un cincuenta por ciento (50%), de conformidad con el literal i) del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022.`,
      `En consecuencia, el VALOR TOTAL A RECAUDAR por concepto de la multa en firme, incluido el incremento por reincidencia, corresponde a la suma de ${liq.valorTotalLetras}.`,
    );
  }

  dispone.push(
    `TERCERO: ACTUALIZAR el estado de cumplimiento de la medida correctiva impuesta en el Registro Nacional de Medidas Correctivas (RNMC), de conformidad con lo dispuesto en el literal d) del artículo 223A de la Ley 1801 de 2016, adicionado por el artículo 47 de la Ley 2197 de 2022.`,
    `CUARTO: DISPONER el envío del presente expediente a la Secretaría de Hacienda Municipal – Unidad de Recursos Tributarios, a fin de que se inicien los trámites de su competencia relacionados con el recaudo y cobro coactivo de la multa en firme.`,
  );

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'ACTA DE FIRMEZA',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe:
      'POR MEDIO DE LA CUAL SE DEJA CONSTANCIA DE LA FIRMEZA DE LA MULTA GENERAL SEÑALADA EN UNA ORDEN DE COMPARENDO, DE CONFORMIDAD CON EL LITERAL E) DEL ARTÍCULO 223A DE LA LEY 1801 DE 2016, ADICIONADO POR EL ARTÍCULO 47 DE LA LEY 2197 DE 2022',
    tablaDatos: [
      { etiqueta: 'No. QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'COMPORTAMIENTO CONTRARIO', valor: `${d.articuloNumeral} del C.N.S.C.C.` },
      { etiqueta: 'FECHA Y HORA', valor: `${fComparendo}.` },
      { etiqueta: 'LUGAR DEL COMPORTAMIENTO', valor: d.lugar },
      { etiqueta: 'NOMBRE PRESUNTO INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedula },
      {
        etiqueta: 'DIRECCIÓN PRESUNTO INFRACTOR',
        valor: `${d.direccion}, ${d.municipio}. Teléfono ${d.telefono || 'NO APORTA'}.`,
      },
      { etiqueta: 'PROCEDENCIA', valor: d.solicitante },
    ],
    secciones: [
      {
        parrafos: [
          `El suscrito Inspector Permanente de Convivencia y Paz del Municipio de ${d.municipio}, en ejercicio de las competencias previstas en la Ley 1801 de 2016, modificada por la Ley 2197 de 2022 y demás normas concordantes, procede a certificar la firmeza de la multa general señalada en una orden de comparendo, con fundamento en los siguientes:`,
        ],
      },
      {
        titulo: 'ANTECEDENTES',
        parrafos: [
          `Se allega a este despacho la orden de comparendo Nro. ${d.comparendo}, de fecha ${fComparendo}, impuesta por personal uniformado de la Policía Nacional adscrito al ${d.solicitante} de ${d.municipio}, en contra del ciudadano ${d.solicitado}, identificado con cédula de ciudadanía No. ${d.cedula}, por la comisión del comportamiento contrario a la convivencia previsto en el ${d.articuloNumeral}, de la Ley 1801 de 2016, por los siguientes hechos: “${d.hechos}”. Como medida correctiva se señala en la orden de comparendo la multa general tipo ${d.tipoMulta}.`,
          `Verificado el expediente, se constató que la orden de comparendo citada no fue objeto de objeción dentro del término perentorio de tres (3) días hábiles siguientes a su expedición. En consecuencia, de conformidad con el literal b) del artículo 223A de la Ley 1801 de 2016, no podrá iniciarse proceso verbal abreviado, al haberse perdido la oportunidad procesal para hacerlo.`,
          `Así mismo, antecede constancia secretarial mediante la cual se certifica que, transcurridos cinco (5) días hábiles posteriores a la expedición y notificación de la orden de comparendo, el ciudadano ${d.solicitado} no compareció para ejercer las acciones previstas en la ley, esto es, presentar objeción a la orden de comparendo o acogerse a los beneficios del artículo 180 de la Ley 1801 de 2016, consistentes en el descuento por pronto pago o la conmutación de la multa por actividad pedagógica o programa comunitario de convivencia. En consecuencia, por disposición legal la medida correctiva de multa general adquiere firmeza, de conformidad con lo dispuesto en el literal e) del artículo 223A de la Ley 1801 de 2016, pudiéndose iniciar el cobro coactivo.`,
        ],
      },
      {
        titulo: 'EFECTOS JURÍDICOS DE LA NO OBJECIÓN DE LA ORDEN DE COMPARENDO',
        parrafos: [
          `De conformidad con la Ley 1801 de 2016, la orden de comparendo constituye un mandato de obligatorio cumplimiento para la persona notificada por un comportamiento contrario a la convivencia; en consecuencia, la no objeción de la orden de comparendo y la no comparecencia para ejercer los beneficios previstos en la ley dentro del término legal generan las consecuencias jurídicas previstas en el artículo 223A del Código Nacional de Seguridad y Convivencia Ciudadana CNSCC.`,
          `De conformidad con lo dispuesto en los literales b) y e) del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022, cuando la orden de comparendo que impone multa general no es objetada dentro de los tres (3) días hábiles siguientes a su expedición, se pierde la oportunidad legal para iniciar Proceso Verbal Abreviado. Así mismo, vencidos cinco (5) días hábiles sin que se hayan ejercido los beneficios previstos en el artículo 180 ibídem, la multa adquiere firmeza por ministerio de la ley, con la consecuente pérdida de los beneficios de reducción y conmutación, habilitando el inicio de su cobro coactivo.`,
          `En atención a lo anterior, verificada la no comparecencia y la inactividad del ciudadano dentro de los términos legales, este despacho, en cumplimiento del mandato legal establecido en la Ley 1801 de 2016, se abstiene de iniciar Proceso Verbal Abreviado y procede a dejar constancia de la firmeza de la multa general impuesta mediante la orden de comparendo de policía.`,
          `Por lo tanto, la firmeza de la multa general se produce por disposición de la ley, de conformidad con el literal e) del artículo 223A de la Ley 1801 de 2016; en consecuencia, el presente acto se expide con el fin de constatar y dejar constancia de dicho estado para efectos de su ejecución, sin que se requiera ejecutoria adicional para el inicio del cobro coactivo.`,
        ],
      },
      {
        titulo: 'CONSECUENCIAS EN LA REITERACIÓN EN EL COMPORTAMIENTO CONTRARIO A LA CONVIVENCIA',
        parrafos: [
          `De conformidad con lo dispuesto en los literales i) y j) del artículo 223A de la Ley 1801 de 2016, adicionados por la Ley 2197 de 2022, el incremento del valor de la multa general procede en los siguientes eventos:`,
          `i) Incremento del valor de la multa general. Cuando se incurra en un comportamiento contrario a la convivencia y se pueda evidenciar el incumplimiento por parte de la misma persona en el pago de alguna multa general anterior por comportamiento contrario a la convivencia y que haya sido reportada al boletín de deudores morosos de la Contaduría General de la Nación, sin que haya sido pagada, la nueva medida se incrementará en un 50% del valor de la segunda medida.`,
          `j) Reiteración del mismo comportamiento contrario a la convivencia. La reiteración de un comportamiento contrario a la convivencia cuya medida corresponda a multa, dentro del año siguiente a la firmeza de la primera medida, dará lugar a que su valor se aumente en un 75%, sin perjuicio de las disposiciones contenidas en el artículo 36 de esta Ley. Quien reitere después de un año en un comportamiento contrario a la convivencia, la multa general que se le imponga deberá ser incrementada en un cincuenta por ciento (50%).`,
          ...parrafoRnmc(d),
        ],
      },
      {
        titulo: 'PARA EL CASO EN CONCRETO',
        parrafos: [
          `Se allegó a este despacho la orden de comparendo Nro. ${d.comparendo}, de fecha ${fComparendo}, impuesta por personal uniformado del ${d.solicitante} en contra del ciudadano ${d.solicitado}, por infringir el comportamiento contrario a la convivencia previsto en el ${d.articuloNumeral}, de la Ley 1801 de 2016. Comportamiento para el cual se señala una multa general tipo ${d.tipoMulta}.`,
          `Se deja constancia de que, transcurridos cinco (5) días hábiles desde la expedición de la orden de comparendo en la cual se señaló multa general, el ciudadano ${d.solicitado} no presentó objeción dentro del término de tres (3) días hábiles siguientes a dicha expedición, ni ejerció, dentro del término de los cinco (5) días, las acciones previstas en los artículos 180 y 223A de la Ley 1801 de 2016.`,
          `Por lo anterior, en virtud de lo dispuesto en los literales b) y e) del artículo 223A de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022, el suscrito Inspector Permanente de Convivencia y Paz, en cumplimiento del mandato legal, se abstiene de iniciar Proceso Verbal Abreviado y procede a dejar constancia de la firmeza de la multa general impuesta mediante la orden de comparendo No. ${d.comparendo}, de fecha ${fComparendo}, por ministerio de la ley.`,
        ],
      },
    ],
    dispone,
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: { nombre: d.inspectorNombre, cargo: d.inspectorCargo },
    liquidacion: liq,
  };
}

/**
 * Adapta un `ActaFirmeza` (dispone singular, firma única) a la forma
 * compartida `DocumentoLegal` (resuelve, firma en lista) — usada únicamente
 * para componer el expediente previo (expedientePrevio.ts), que anexa
 * cualquiera de las tres actas del desenlace sin conocer sus tipos concretos.
 * No reemplaza `actaPdf.ts`, que sigue renderizando `ActaFirmeza` tal cual.
 */
export function actaFirmezaComoDocumento(acta: ActaFirmeza): DocumentoLegal {
  return {
    entidad: acta.entidad,
    tituloDocumento: acta.tituloDocumento,
    proceso: acta.proceso,
    fechaResolucionLetras: acta.fechaResolucionLetras,
    epigrafe: acta.epigrafe,
    tablaDatos: acta.tablaDatos,
    secciones: acta.secciones,
    resuelve: acta.dispone,
    cierre: acta.cierre,
    firma: [{ nombre: acta.firma.nombre, rol: acta.firma.cargo }],
  };
}
