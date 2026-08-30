import { fechaALetras } from '../letras';
import type { DocumentoLegal } from './documentoLegal';

/**
 * Plantilla de la CONSTANCIA SECRETARIAL DE COMPARECENCIA Y SOLICITUD — deja
 * constancia de que el presunto infractor SÍ se presentó ante el despacho,
 * dentro de los cinco (5) días hábiles siguientes a la expedición del
 * comparendo, y solicitó el descuento por pronto pago o la conmutación de
 * la multa (art. 180 par., Ley 1801 de 2016). Es la tercera pieza del
 * expediente en las rutas pronto_pago y conmutacion (sustituye a la
 * constancia de inasistencia, que solo aplica en la ruta firmeza). La
 * firma el auxiliar administrativo del despacho — nunca el inspector por
 * defecto. Mirror de okf-bundles/roles-profesionales/inspector-policia/
 * plantillas/constancia-comparecencia-solicitud.yaml. Esta constancia solo
 * deja constancia del hecho; la decisión de fondo (declarar la firmeza y
 * aplicar el descuento o la conmutación) la toma el acta correspondiente,
 * que es un documento independiente del expediente.
 */
export type RutaComparecencia = 'pronto_pago' | 'conmutacion';

const SOLICITUD_POR_RUTA: Record<RutaComparecencia, string> = {
  pronto_pago: 'el descuento del 50% por pronto pago',
  conmutacion: 'la conmutación de la multa por participación en programa comunitario o actividad pedagógica de convivencia',
};

export interface DatosConstanciaComparecenciaSolicitud {
  municipio: string;
  inspeccion: string;
  firmanteNombre: string; // auxiliar administrativo del despacho — nunca el inspector por defecto
  firmanteRol: string;
  proceso: string;
  comparendo: string;
  fechaComparendo: string; // ISO — fecha de expedición de la orden de comparendo
  fechaComparecencia: string; // ISO — fecha en la que el solicitado se presentó, debe caer dentro de los 5 días hábiles siguientes a fechaComparendo
  solicitado: string;
  cedulaSolicitado: string;
  ruta: RutaComparecencia;
}

/** Construye la constancia secretarial de comparecencia y solicitud (pronto pago o conmutación). */
export function generarConstanciaComparecenciaSolicitud(d: DatosConstanciaComparecenciaSolicitud): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fComparecencia = fechaALetras(d.fechaComparecencia);

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'CONSTANCIA SECRETARIAL',
    proceso: d.proceso,
    fechaResolucionLetras: fComparecencia,
    epigrafe: 'COMPARECENCIA Y SOLICITUD',
    tablaDatos: [
      { etiqueta: 'QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'NOMBRE PRESUNTO INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedulaSolicitado },
    ],
    secciones: [
      {
        titulo: 'CONSTANCIA SECRETARIAL DE COMPARECENCIA Y SOLICITUD',
        parrafos: [
          `${d.municipio}, ${fComparecencia}. ${d.firmanteNombre}, ${d.firmanteRol} de la ${d.inspeccion}, deja constancia de que el(la) señor(a) ${d.solicitado}, identificado(a) con cédula de ciudadanía No. ${d.cedulaSolicitado}, se presentó ante este despacho el día ${fComparecencia}, dentro del término de cinco (5) días hábiles siguientes a la expedición de la orden de comparendo No. ${d.comparendo}, de fecha ${fComparendo}, y solicitó ${SOLICITUD_POR_RUTA[d.ruta]}, en los términos del parágrafo del artículo 180 de la Ley 1801 de 2016, modificado por el artículo 42 de la Ley 2197 de 2022.`,
        ],
      },
    ],
    resuelve: [],
    cierre: `${d.municipio}, ${fComparecencia}.`,
    firma: [{ nombre: d.firmanteNombre, rol: d.firmanteRol }],
  };
}
