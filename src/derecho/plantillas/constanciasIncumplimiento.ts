import { fechaALetras } from '../letras';
import type { TipoMulta } from '../multas';
import type { DocumentoLegal } from './documentoLegal';

/**
 * Plantillas de las CONSTANCIAS DE INCUMPLIMIENTO — pronto pago y actividad
 * pedagógica de convivencia. Ambas dejan constancia de que el ciudadano no
 * cumplió con el beneficio otorgado (descuento por pronto pago o conmutación
 * por actividad pedagógica), por lo cual la multa queda en firme por el
 * valor total y se remite a cobro coactivo. Sirven los eventos
 * `constancia_incumplimiento_pago` y `constancia_incumplimiento_actividad`
 * de brains/derecho-policia-convivencia/maquinas-estado.yaml.
 *
 * Mirror de okf-bundles/roles-profesionales/inspector-policia/plantillas/
 * constancia-incumplimiento-pronto-pago.yaml y
 * constancia-incumplimiento-actividad-pedagogica.yaml. Párrafos fijos
 * transcritos y anonimizados de docs/superpowers/plan-sources/
 * despacho-audiencias/constancia-incumplimiento-pronto-pago.txt y
 * constancia-incumplimiento-pedagogica.txt.
 */
export interface DatosConstanciaIncumplimientoProntoPago {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  fechaResolucion: string; // ISO — fecha de expedición de la constancia
  proceso: string;
  comparendo: string;
  fechaComparendo: string; // ISO
  tipoMulta: TipoMulta;
  solicitado: string;
  cedulaSolicitado: string;
  documentoCobro: string; // Nro. del documento de cobro expedido
}

/** Construye la constancia de incumplimiento del descuento por pronto pago. */
export function generarConstanciaIncumplimientoProntoPago(
  d: DatosConstanciaIncumplimientoProntoPago,
): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'CONSTANCIA DE INCUMPLIMIENTO DE PRONTO PAGO',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    tablaDatos: [
      { etiqueta: 'No. QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'FECHA Y HORA', valor: fComparendo },
      { etiqueta: 'TIPO DE MULTA', valor: `Multa General Tipo ${d.tipoMulta}` },
      { etiqueta: 'NOMBRE PRESUNTO INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedulaSolicitado },
      { etiqueta: 'DOCUMENTO DE COBRO No.', valor: d.documentoCobro },
    ],
    secciones: [
      {
        parrafos: [
          `La ${d.inspeccion} deja constancia de que el(la) ciudadano(a) ${d.solicitado}, identificado(a) con cédula de ciudadanía No. ${d.cedulaSolicitado}, se presentó ante este despacho y solicitó la aplicación del descuento por pronto pago respecto de la Multa General Tipo ${d.tipoMulta}, impuesta mediante la Orden de Comparendo No. ${d.comparendo} de fecha ${fComparendo}.`,
        ],
      },
      {
        parrafos: [
          `En virtud de dicha solicitud, se expidió el documento de cobro No. ${d.documentoCobro} y se concedió el término correspondiente para efectuar el pago con descuento y allegar la respectiva constancia; no obstante, a la fecha de expedición de la presente constancia no se ha recibido soporte alguno que acredite la realización del pago.`,
        ],
      },
      {
        parrafos: [
          `Conforme a lo previsto en el acta de pronto pago suscrita por el(la) ciudadano(a), mediante la cual se declaró la firmeza de la multa, se advirtió expresamente que el incumplimiento del pago dentro de los cinco (5) días siguientes a la imposición de la Orden de Comparendo daría lugar al cobro del valor total de la Multa General.`,
        ],
      },
      {
        parrafos: [
          `Por lo anterior, ante el incumplimiento del pago y la no objeción de la medida correctiva, se deja constancia de la firmeza de la multa por el valor total, por lo cual este despacho remite el acta de pronto pago a la Unidad de Recursos Tributarios de la Secretaría de Hacienda Municipal, para el inicio del proceso de cobro coactivo.`,
        ],
      },
    ],
    resuelve: [],
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [{ nombre: d.inspectorNombre, rol: d.inspectorRol }],
  };
}

export interface DatosConstanciaIncumplimientoActividadPedagogica {
  municipio: string;
  inspeccion: string;
  firmanteNombre: string; // auxiliar administrativo del despacho — nunca el inspector por defecto
  firmanteRol: string; // p. ej. "Auxiliar Administrativo"
  fechaResolucion: string; // ISO — fecha de expedición de la constancia
  proceso: string;
  comparendo: string; // conmutado por actividad pedagógica de convivencia
  solicitado: string;
  cedulaSolicitado: string;
}

/** Construye la constancia secretarial de inasistencia a la actividad pedagógica de convivencia. */
export function generarConstanciaIncumplimientoActividadPedagogica(
  d: DatosConstanciaIncumplimientoActividadPedagogica,
): DocumentoLegal {
  const fResolucion = fechaALetras(d.fechaResolucion);

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'CONSTANCIA SECRETARIAL',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe: 'INASISTENCIA A ACTIVIDAD PEDAGÓGICA DE CONVIVENCIA',
    tablaDatos: [
      { etiqueta: 'No. QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'NOMBRE PRESUNTO INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedulaSolicitado },
    ],
    secciones: [
      {
        parrafos: [
          `La ${d.inspeccion} certifica que el(la) ciudadano(a) ${d.solicitado}, identificado(a) con cédula de ciudadanía No. ${d.cedulaSolicitado}, a la fecha no ha presentado prueba de la participación en programa comunitario o actividad pedagógica de convivencia, programada como conmutación de la multa impuesta mediante la Orden de Comparendo No. ${d.comparendo}, conmutado por actividad pedagógica de convivencia.`,
        ],
      },
      {
        parrafos: [
          `Se otorgó un plazo razonable para la presentación del certificado, sin que a la fecha se haya recibido. Verificada la plataforma Sispaz, no existe constancia de asistencia.`,
        ],
      },
      {
        parrafos: [
          `Conforme a lo acordado en el acta de conmutación mediante la cual se declaró la firmeza de la multa y se concedió la conmutación, en dicha acta se advirtió que la no realización de la actividad pedagógica daría lugar al cobro total de la multa. Por lo anterior, estando en firme la multa, se procede a remitir el expediente a la Unidad de Recursos Tributarios de la Secretaría de Hacienda Municipal para el inicio del cobro coactivo.`,
        ],
      },
    ],
    resuelve: [],
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [{ nombre: d.firmanteNombre, rol: d.firmanteRol }],
  };
}
