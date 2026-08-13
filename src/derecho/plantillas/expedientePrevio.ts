import { fechaALetras } from '../letras';
import { incluirSi, type DocumentoLegal, type SeccionDocumento } from './documentoLegal';
import type { TipoMulta } from '../multas';

/**
 * Plantilla del EXPEDIENTE PREVIO — legajo de archivo (carátula + constancia
 * secretarial de recepción + constancia de inasistencia si aplica + consulta
 * RNMC) que antecede al acta final. Mirror de okf-bundles/roles-profesionales/
 * inspector-policia/plantillas/expediente-previo.yaml.
 *
 * Sirve para los tres desenlaces (firmeza, pronto pago, conmutación): la
 * última pieza es el acta que efectivamente se suscribió, recibida ya
 * generada (`actaFinal`) en vez de reconstruirla aquí — Open/Closed: un
 * cuarto desenlace futuro no requiere tocar este archivo, solo pasarle su
 * propio `DocumentoLegal` (usar `actaFirmezaComoDocumento` para adaptar
 * `ActaFirmeza`, que no comparte esa forma).
 */
export type TipoActaFinal = 'acta_firmeza' | 'acta_pronto_pago' | 'acta_conmutacion';

const TITULO_ACTA_FINAL: Record<TipoActaFinal, string> = {
  acta_firmeza: 'ACTA DE FIRMEZA',
  acta_pronto_pago: 'ACTA PRONTO PAGO',
  acta_conmutacion: 'ACTA DE CONMUTACIÓN',
};

export interface DatosExpedientePrevio {
  municipio: string;
  inspeccion: string;
  unidad: string; // p. ej. "Seguridad Ciudadana"
  grupo: string; // p. ej. "Inspección Permanente Turno 1 de Policía"
  anio: string | number;
  expediente: string; // No. de expediente de archivo
  proceso: string;
  comparendo: string;
  articuloNumeral: string;
  solicitante: string; // quejoso / procedencia
  solicitado: string;
  cedulaSolicitado: string;
  direccionSolicitado?: string; // fallback "NO APORTA"
  telefonoSolicitado?: string; // fallback "NO APORTA"
  fechaComparendo: string; // ISO
  fechaResolucion: string; // ISO — cierre/expedición de este expediente
  hechos: string;
  tipoMulta: TipoMulta;
  firmanteNombre: string; // auxiliar administrativo que suscribe la constancia secretarial
  firmanteRol: string;
  rnmcFechaConsulta: string; // ISO
  rnmcEstado: string; // estado de la medida correctiva reportado por el RNMC
  serieCodigo?: string;
  serieNombre?: string;
  subserieCodigo?: string;
  subserieNombre?: string;
  folios?: string;
  carpeta?: string;
  caja?: string;
  /** Cuál de las tres actas se anexa — decide si va la constancia de inasistencia. */
  tipoActaFinal: TipoActaFinal;
}

const VACIO_LARGO = '________________';
const VACIO_CORTO = '_____';

/**
 * Construye el expediente previo, anexando el `actaFinal` ya generado (no lo
 * reconstruye: delega en la plantilla correspondiente, igual que el YAML).
 */
export function generarExpedientePrevio(d: DatosExpedientePrevio, actaFinal: DocumentoLegal): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const fRnmc = fechaALetras(d.rnmcFechaConsulta);
  const direccion = d.direccionSolicitado || 'NO APORTA';
  const telefono = d.telefonoSolicitado || 'NO APORTA';

  const piezaCaratula: SeccionDocumento = {
    titulo: 'CARÁTULA DE ARCHIVO',
    parrafos: [
      `Unidad: ${d.unidad}. Grupo: ${d.grupo}. Año: ${d.anio}. Expediente No. ${d.expediente}. Asunto: artículos 223 y 223A de la Ley 1801 de 2016, adicionada por la Ley 2197 de 2022 (${d.articuloNumeral}). Quejoso: ${d.solicitante}. Presunto infractor: ${d.solicitado}. Código/nombre de serie: ${d.serieCodigo || VACIO_LARGO} / ${d.serieNombre || VACIO_LARGO}. Código/nombre de subserie: ${d.subserieCodigo || VACIO_LARGO} / ${d.subserieNombre || VACIO_LARGO}. Folios: ${d.folios || VACIO_CORTO}. Carpeta: ${d.carpeta || VACIO_CORTO}. Caja: ${d.caja || VACIO_CORTO}. Fecha inicial: ${fComparendo}.`,
    ],
  };

  const piezaRecepcion: SeccionDocumento = {
    titulo: 'CONSTANCIA SECRETARIAL DE RECEPCIÓN DE COMPARENDO',
    parrafos: [
      `${d.firmanteNombre}, ${d.firmanteRol} de la ${d.inspeccion}, deja constancia de que al despacho se allega la orden de comparendo con expediente ${d.comparendo}, de fecha ${fComparendo}, radicado mediante queja Nro. ${d.proceso}, impuesta por el personal uniformado de ${d.solicitante}, quienes inician de manera oficiosa Proceso Verbal Inmediato del artículo 222 de la Ley 1801 de 2016 en contra de ${d.solicitado}, quien es hallado(a) incurriendo en el siguiente comportamiento contrario a la convivencia: "${d.hechos}". Se da espera a fin de que el presunto(a) infractor(a) ejerza alguna de las acciones legales del artículo 180 de la Ley 1801, adicionado por la Ley 2197 de 2022.`,
    ],
  };

  // Solo cuando el desenlace es firmeza: si el solicitado compareció (pronto
  // pago o conmutación), esa comparecencia ya queda documentada en los
  // ANTECEDENTES de la propia acta anexa — no hace falta esta constancia.
  const piezaInasistencia: SeccionDocumento[] = incluirSi(d.tipoActaFinal === 'acta_firmeza', {
    titulo: 'CONSTANCIA DE INASISTENCIA',
    parrafos: [
      `${d.firmanteNombre}, ${d.firmanteRol} de la ${d.inspeccion}, en aplicación del numeral 5 del artículo 223A de la Ley 1801, informa al inspector que transcurridos cinco (5) días posteriores a la expedición de la orden de comparendo, no se hizo presente ${d.solicitado}, identificado con cédula de ciudadanía No. ${d.cedulaSolicitado}, a fin de ejercer alguna de las acciones legales del artículo 180 de la Ley 1801 con ocasión del comparendo ${d.comparendo}.`,
    ],
  });

  const piezaRnmc: SeccionDocumento = {
    titulo: 'IMPRESIÓN DE CONSULTA RNMC',
    parrafos: [
      `Consulta del Registro Nacional de Medidas Correctivas para el comparendo ${d.comparendo}, realizada el ${fRnmc}: cédula ${d.cedulaSolicitado}, infractor ${d.solicitado}, estado ${d.rnmcEstado}. Esta consulta es el soporte documental con el que el inspector motiva si aplica o no incremento por reincidencia en el acta final.`,
    ],
  };

  const piezaActaFinalEncabezado: SeccionDocumento = {
    titulo: `ACTA FINAL ANEXA — ${TITULO_ACTA_FINAL[d.tipoActaFinal]}`,
    parrafos: [
      `Se anexa a continuación, en su integridad, el ${TITULO_ACTA_FINAL[d.tipoActaFinal]} suscrita respecto de la orden de comparendo Nro. ${d.comparendo}, radicada bajo la queja ${actaFinal.proceso} el ${actaFinal.fechaResolucionLetras}${actaFinal.epigrafe ? `: ${actaFinal.epigrafe}` : '.'}`,
    ],
  };

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'EXPEDIENTE',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    tablaDatos: [
      { etiqueta: 'EXPEDIENTE', valor: d.expediente },
      { etiqueta: 'QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'COMPORTAMIENTO CONTRARIO', valor: `${d.articuloNumeral} del C.N.S.C.C.` },
      { etiqueta: 'PROCEDENCIA', valor: d.solicitante },
      { etiqueta: 'NOMBRE INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedulaSolicitado },
      { etiqueta: 'DIRECCIÓN INFRACTOR', valor: `${direccion}, ${d.municipio}. Teléfono ${telefono}.` },
      { etiqueta: 'DESENLACE', valor: TITULO_ACTA_FINAL[d.tipoActaFinal] },
    ],
    secciones: [
      piezaCaratula,
      piezaRecepcion,
      ...piezaInasistencia,
      piezaRnmc,
      piezaActaFinalEncabezado,
      ...actaFinal.secciones,
    ],
    resuelve: actaFinal.resuelve,
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [...actaFinal.firma, { nombre: d.firmanteNombre, rol: d.firmanteRol }],
  };
}
