import { fechaALetras } from '../letras';
import type { DocumentoLegal, SeccionDocumento } from './documentoLegal';
import {
  generarConstanciaComparecenciaSolicitud,
  type RutaComparecencia,
} from './constanciaComparecenciaSolicitud';

/**
 * Plantilla del EXPEDIENTE — el legajo de archivo. El inspector aclaró
 * textualmente que son SOLO TRES PIEZAS: carátula de archivo + constancia
 * secretarial de recepción del comparendo + una tercera pieza variable
 * según la ruta (constancia de inasistencia en firmeza, constancia de
 * comparecencia y solicitud en pronto pago/conmutación). NO incluye el
 * comparendo (se descarga aparte), NI la consulta RNMC (motiva el acta, no
 * el expediente), NI el acta final: "el acta va aparte y el expediente
 * inicial también" — son DOS descargas independientes, no un solo
 * documento. Mirror de okf-bundles/roles-profesionales/inspector-policia/
 * plantillas/expediente-previo.yaml.
 */
export type RutaExpediente = RutaComparecencia | 'firmeza';

const TITULO_TERCERA_PIEZA: Record<RutaExpediente, string> = {
  firmeza: 'CONSTANCIA DE INASISTENCIA',
  pronto_pago: 'CONSTANCIA SECRETARIAL DE COMPARECENCIA Y SOLICITUD',
  conmutacion: 'CONSTANCIA SECRETARIAL DE COMPARECENCIA Y SOLICITUD',
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
  fechaComparendo: string; // ISO — fecha de expedición del comparendo
  /** Fecha de cargue del comparendo al sistema. Por defecto igual a fechaComparendo ("normalmente" el mismo día), pero EDITABLE — no siempre coincide. */
  fechaRecepcion?: string; // ISO
  fechaResolucion: string; // ISO — cierre/expedición de este expediente
  hechos: string;
  firmanteNombre: string; // auxiliar administrativo que suscribe las constancias secretariales
  firmanteRol: string;
  serieCodigo?: string;
  serieNombre?: string;
  subserieCodigo?: string;
  subserieNombre?: string;
  folios?: string;
  carpeta?: string;
  caja?: string;
  /** Desenlace del comparendo — decide la tercera pieza. */
  ruta: RutaExpediente;
  /** Solo rutas pronto_pago / conmutacion: fecha en que el solicitado compareció y pidió el beneficio. */
  fechaComparecencia?: string; // ISO
}

const VACIO_LARGO = '________________';
const VACIO_CORTO = '_____';

/** Construye el expediente (carátula + constancia de recepción + tercera pieza según la ruta). */
export function generarExpedientePrevio(d: DatosExpedientePrevio): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const fRecepcion = fechaALetras(d.fechaRecepcion || d.fechaComparendo);
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
      `${d.municipio}, ${fRecepcion}. ${d.firmanteNombre}, ${d.firmanteRol} de la ${d.inspeccion}, deja constancia de que al despacho se allega la orden de comparendo con expediente ${d.comparendo}, de fecha ${fComparendo}, radicado mediante queja Nro. ${d.proceso}, impuesta por el personal uniformado de ${d.solicitante}, quienes inician de manera oficiosa Proceso Verbal Inmediato del artículo 222 de la Ley 1801 de 2016 en contra de ${d.solicitado}, quien es hallado(a) incurriendo en el siguiente comportamiento contrario a la convivencia: "${d.hechos}". Se da espera a fin de que el presunto(a) infractor(a) ejerza alguna de las acciones legales del artículo 180 de la Ley 1801, adicionado por la Ley 2197 de 2022.`,
    ],
  };

  // Ruta firmeza: nadie compareció → constancia de inasistencia. Rutas
  // pronto_pago/conmutacion: el solicitado compareció → constancia de
  // comparecencia y solicitud (generador dedicado, no se duplica aquí).
  const terceraPieza: SeccionDocumento =
    d.ruta === 'firmeza'
      ? {
          titulo: TITULO_TERCERA_PIEZA.firmeza,
          parrafos: [
            `${d.firmanteNombre}, ${d.firmanteRol} de la ${d.inspeccion}, en aplicación del numeral 5 del artículo 223A de la Ley 1801, informa al inspector que transcurridos cinco (5) días posteriores a la expedición de la orden de comparendo, no se hizo presente ${d.solicitado}, identificado con cédula de ciudadanía No. ${d.cedulaSolicitado}, a fin de ejercer alguna de las acciones legales del artículo 180 de la Ley 1801 con ocasión del comparendo ${d.comparendo}.`,
          ],
        }
      : generarConstanciaComparecenciaSolicitud({
          municipio: d.municipio,
          inspeccion: d.inspeccion,
          firmanteNombre: d.firmanteNombre,
          firmanteRol: d.firmanteRol,
          proceso: d.proceso,
          comparendo: d.comparendo,
          fechaComparendo: d.fechaComparendo,
          fechaComparecencia: d.fechaComparecencia || d.fechaResolucion,
          solicitado: d.solicitado,
          cedulaSolicitado: d.cedulaSolicitado,
          ruta: d.ruta,
        }).secciones[0];

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
    ],
    secciones: [piezaCaratula, piezaRecepcion, terceraPieza],
    resuelve: [],
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [{ nombre: d.firmanteNombre, rol: d.firmanteRol }],
  };
}
