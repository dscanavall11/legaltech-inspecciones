import { anioConCifra, fechaALetras } from '../letras';
import { diasHabilesDesde } from '../diasHabiles';
import {
  liquidarProntoPago,
  TERMINOS_COMPARENDO,
  VIGENCIA_MULTAS,
  type CausalIncremento,
  type TipoMulta,
} from '../multas';
import {
  incluirSi,
  parrafosReiteracion223A,
  TEXTO_NUMERALES_9_10_223A,
  type DocumentoLegal,
} from './documentoLegal';

/**
 * Plantilla del ACTA PRONTO PAGO (art. 180 par., Ley 1801 de 2016). Mirror de
 * okf-bundles/roles-profesionales/inspector-policia/plantillas/acta-pronto-pago.yaml.
 * A diferencia del acta de firmeza, es bilateral (el solicitado comparece
 * dentro de los 5 días hábiles y firma notificado en el mismo acto) y declara
 * la firmeza aplicando de una vez el descuento del 50% (aceptación ficta de
 * responsabilidad, art. 223A núm. 3).
 */
export interface DatosActaProntoPago {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  proceso: string;
  fechaResolucion: string; // ISO — fecha de la comparecencia/expedición del acta
  comparendo: string;
  fechaComparendo: string; // ISO
  articuloNumeral: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono?: string; // fallback "NO APORTA"
  tipoMulta: TipoMulta;
  causal: CausalIncremento;
  /** Justificación/evidencia (RNMC, BDME) que motiva la causal marcada — nunca se aplica sola. */
  causalEvidencia?: string;
  documentoCobro: string; // No. del recibo de pago expedido al momento de la solicitud
}

/** Fecha ISO local (sin desfase de huso) para pasarla por `fechaALetras`. */
function isoLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/** Construye el acta de pronto pago a partir de los datos del comparendo. */
export function generarActaProntoPago(d: DatosActaProntoPago): DocumentoLegal {
  const liq = liquidarProntoPago(d.tipoMulta, d.causal);
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const telefono = d.telefono || 'NO APORTA';
  const fechaLimite = diasHabilesDesde(new Date(d.fechaComparendo), TERMINOS_COMPARENDO.prontoPagoDias);
  const fLimiteLetras = fechaALetras(isoLocal(fechaLimite));

  const resuelve: string[] = [
    `PRIMERO: DECLARAR LA FIRMEZA DE LA MULTA GENERAL TIPO ${d.tipoMulta}, impuesta a ${d.solicitado}, C.C. ${d.cedula}, mediante la orden de comparendo Nro. ${d.comparendo} de fecha ${fComparendo}; en consecuencia, APLICAR el descuento del cincuenta por ciento (50%) por pronto pago, de conformidad con el parágrafo del artículo 180 de la Ley 1801 de 2016, modificado por el artículo 42 de la Ley 2197 de 2022. Valor a pagar a favor del tesoro municipal: ${liq.valorAPagarLetras}.`,
    `SEGUNDO: ADVERTIR a ${d.solicitado} que el no pago dentro del término advertido (${fLimiteLetras}) dará lugar al cobro TOTAL de la MULTA GENERAL TIPO ${d.tipoMulta} a favor del tesoro municipal, por una suma equivalente a ${liq.smdlvLetras} salarios mínimos diarios legales vigentes (SMDLV) para la vigencia ${anioConCifra(VIGENCIA_MULTAS)}, correspondiente a ${liq.valorTotalLetras}.`,
    ...incluirSi(
      d.causal !== 'ninguna',
      `Conforme a la motivación de reincidencia expuesta, el valor de la multa se incrementó en un ${liq.porcentajeIncremento}% ANTES de aplicar el descuento por pronto pago, según lo dispuesto en el artículo 223A de la Ley 1801 de 2016.`,
    ),
    `TERCERO: Verificado el pago, INGRESAR el reporte a la base de datos de la Policía Nacional (RNMC), en observancia del numeral 4 del artículo 223A de la Ley 1801 de 2016.`,
    `CUARTO: De no darse cumplimiento al pago dentro del término legalmente establecido, REMITIR las diligencias a la Secretaría de Hacienda Municipal – Unidad de Recursos Tributarios (Cobro Coactivo), para el cobro total de la multa.`,
  ];

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'ACTA PRONTO PAGO',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe:
      'POR MEDIO DE LA CUAL SE APLICA DESCUENTO POR PRONTO PAGO A LA MEDIDA CORRECTIVA DE MULTA, EN APLICACIÓN DEL PARÁGRAFO DEL ARTÍCULO 180 DE LA LEY 1801 DE 2016, MODIFICADO POR EL ARTÍCULO 42 DE LA LEY 2197 DE 2022, Y DEL NUMERAL 3 DEL ARTÍCULO 223A DE LA LEY 1801 DE 2016, ADICIONADO POR EL ARTÍCULO 47 DE LA LEY 2197 DE 2022',
    tablaDatos: [
      { etiqueta: 'QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'COMPORTAMIENTO CONTRARIO', valor: `${d.articuloNumeral} del C.N.S.C.C.` },
      { etiqueta: 'FECHA DEL COMPARENDO', valor: fComparendo },
      { etiqueta: 'NOMBRE INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedula },
      { etiqueta: 'DIRECCIÓN INFRACTOR', valor: `${d.direccion}, ${d.municipio}.` },
      { etiqueta: 'TELÉFONO', valor: telefono },
    ],
    secciones: [
      {
        parrafos: [
          `El suscrito Inspector Permanente de Convivencia y Paz del Municipio de ${d.municipio}, en ejercicio de las competencias previstas en la Ley 1801 de 2016, modificada por la Ley 2197 de 2022, procede a aplicar el descuento del 50% por pronto pago a la multa general señalada en la orden de comparendo Nro. ${d.comparendo}, con fundamento en los siguientes:`,
        ],
      },
      {
        titulo: 'ANTECEDENTES',
        parrafos: [
          `Se allega a este despacho la orden de comparendo Nro. ${d.comparendo}, de fecha ${fComparendo}, en contra del ciudadano ${d.solicitado}, identificado con cédula de ciudadanía No. ${d.cedula}, por el comportamiento contrario a la convivencia previsto en el ${d.articuloNumeral} de la Ley 1801 de 2016, con multa general tipo ${d.tipoMulta}.`,
          `Comparece ${d.solicitado} ante el despacho, dentro de los cinco (5) días hábiles siguientes a la imposición del comparendo, solicitando el descuento del 50% por pronto pago; se expide y entrega el documento de cobro ${d.documentoCobro} para que efectúe el pago dentro del término.`,
        ],
      },
      {
        titulo: 'CONSIDERACIONES DEL DESPACHO',
        parrafos: [
          `Se verifica que ${d.solicitado} se presentó dentro del término del parágrafo del artículo 180 de la Ley 1801 de 2016 (cinco (5) días hábiles siguientes a la expedición del comparendo). Dicha comparecencia con solicitud de pago constituye ACEPTACIÓN FICTA DE RESPONSABILIDAD (art. 223A núm. 3), lo que habilita al despacho a declarar la firmeza de la multa en el mismo acto y aplicar el descuento.`,
        ],
      },
      {
        titulo: 'CONSECUENCIAS EN LA REITERACIÓN EN EL COMPORTAMIENTO CONTRARIO A LA CONVIVENCIA',
        parrafos: [
          TEXTO_NUMERALES_9_10_223A,
          ...parrafosReiteracion223A({
            solicitado: d.solicitado,
            tipoMulta: d.tipoMulta,
            comparendo: d.comparendo,
            causal: d.causal,
            causalEvidencia: d.causalEvidencia,
          }),
        ],
      },
    ],
    resuelve,
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [
      { nombre: d.solicitado, rol: `C.C. ${d.cedula}`, tipo: 'notificado' },
      { nombre: d.inspectorNombre, rol: d.inspectorRol },
    ],
  };
}
