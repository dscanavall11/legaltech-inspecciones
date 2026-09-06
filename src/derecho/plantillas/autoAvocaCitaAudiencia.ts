import { fechaALetras } from '../letras';
import { incluirSi, type DocumentoLegal } from './documentoLegal';

/**
 * Plantilla del AUTO que deja constancia de la impugnación oportuna del
 * ciudadano, avoca conocimiento y fija fecha de audiencia pública dentro del
 * proceso verbal abreviado (art. 223, Ley 1801 de 2016).
 * Mirror de okf-bundles/roles-profesionales/inspector-policia/plantillas/
 * auto-avoca-cita-audiencia.yaml. Párrafos fijos transcritos y anonimizados
 * de docs/superpowers/plan-sources/despacho-audiencias/auto-cita-audiencia.txt
 * (plantilla en blanco) y auto-avoca-audiencia.txt (instancia diligenciada).
 */
export interface DatosAutoAvoca {
  municipio: string;
  inspeccion: string; // p. ej. "Inspección Permanente de Convivencia y Paz Turno Uno"
  inspectorNombre: string;
  inspectorRol: string; // p. ej. "Inspector Permanente de Convivencia y Paz – Turno Uno"
  fechaResolucion: string; // ISO
  proceso: string; // No. de queja / proceso
  comparendo: string;
  fechaComparendo: string; // ISO
  articuloNumeral: string; // p. ej. "Artículo 35 Numeral 1"
  solicitado: string;
  cedulaSolicitado: string;
  medioImpugnacion: 'personal' | 'correo_electronico';
  fechaAudiencia: string; // ISO
  horaAudiencia: string; // p. ej. "09:00 a.m."
  lugarAudiencia: string;
  medioNotificacionAutorizado?: string; // correo y/o WhatsApp autorizado; fallback "NO APORTA"
}

const MEDIO_IMPUGNACION_TEXTO: Record<DatosAutoAvoca['medioImpugnacion'], string> = {
  personal: 'personalmente',
  correo_electronico: 'a través de correo electrónico',
};

/** Construye el auto que avoca conocimiento y cita a audiencia pública. */
export function generarAutoAvocaCitaAudiencia(d: DatosAutoAvoca): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const fAudiencia = fechaALetras(d.fechaAudiencia);
  const medio = MEDIO_IMPUGNACION_TEXTO[d.medioImpugnacion];
  const medioNotificacion = d.medioNotificacionAutorizado || 'NO APORTA';

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'AUTO',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe:
      'POR MEDIO DEL CUAL SE DEJA CONSTANCIA DE LA IMPUGNACIÓN OPORTUNA DEL CIUDADANO, SE AVOCA CONOCIMIENTO Y SE FIJA FECHA PARA AUDIENCIA PÚBLICA DENTRO DEL PROCESO VERBAL ABREVIADO',
    tablaDatos: [
      { etiqueta: 'No QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'NOMBRE PRESUNTO INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedulaSolicitado },
    ],
    secciones: [
      {
        parrafos: [
          `El suscrito ${d.inspectorRol}, encargado del Municipio de ${d.municipio}, en uso de las facultades consagradas en la Ley 1801 de 2016, el Decreto 0296 de 2015 y demás normas legales vigentes, y,`,
        ],
      },
      {
        titulo: 'CONSIDERANDO',
        parrafos: [
          `Se allegó al despacho la orden de comparendo No. ${d.comparendo}, de fecha ${fComparendo}, mediante la cual el personal uniformado de la Policía Nacional impuso al(la) ciudadano(a) ${d.solicitado}, identificado(a) con cédula de ciudadanía No. ${d.cedulaSolicitado}, orden de comparendo en la que se señaló como medida correctiva multa general, por el comportamiento contrario a la convivencia previsto en el ${d.articuloNumeral}, del Código Nacional de Seguridad y Convivencia Ciudadana.`,
          `Que el(la) señor(a) ${d.solicitado}, ${medio}, dentro de los tres (3) días hábiles siguientes a la expedición de la orden de comparendo, manifestó de manera expresa su inconformidad con la medida correctiva de multa general impuesta, impugnando dicha medida y solicitando la realización de audiencia pública para ejercer su derecho de defensa.`,
          `Que, en virtud de la impugnación presentada por el(la) ciudadano(a) dentro del término legal, se habilita el inicio del trámite del proceso verbal abreviado, siendo competente este despacho para conocer y decidir de fondo, de conformidad con lo dispuesto en la Ley 1801 de 2016.`,
          `Que, atendiendo los principios de celeridad, eficacia y debido proceso, resulta procedente avocar conocimiento del presente asunto, dejar constancia de la presentación del ciudadano y fijar fecha y hora para la realización de la audiencia pública. Por lo cual, la ${d.inspeccion}, en el marco de sus competencias:`,
        ],
      },
    ],
    resuelve: [
      `PRIMERO: DEJAR CONSTANCIA de que el(la) ciudadano(a) ${d.solicitado}, identificado(a) con cédula de ciudadanía No. ${d.cedulaSolicitado}, dentro del término legal de los tres (3) días hábiles siguientes a la expedición de la orden de comparendo No. ${d.comparendo}, impugnó — ${medio} — la multa general impuesta y solicitó la realización de audiencia pública.`,
      `SEGUNDO: AVOCAR CONOCIMIENTO del presente asunto y dar inicio al trámite del proceso verbal abreviado, de conformidad con lo dispuesto en el artículo 223 de la Ley 1801 de 2016, como consecuencia de la impugnación oportuna de la orden de comparendo.`,
      `TERCERO: FIJAR como fecha para la realización de la audiencia pública dentro del proceso verbal abreviado: Fecha ${fAudiencia}. Hora ${d.horaAudiencia}. Lugar ${d.lugarAudiencia}. En dicha diligencia el presunto infractor podrá ejercer su derecho de defensa, presentar argumentos y solicitar o aportar pruebas, personalmente o por intermedio de apoderado.`,
      `CUARTO: ADVERTIR que, en caso de no comparecer a la audiencia sin acreditar justa causa, se tendrán por ciertos los hechos que dieron lugar al comportamiento contrario a la convivencia y se resolverá de fondo con base en las pruebas e informes obrantes en el expediente, conforme al parágrafo 1 del artículo 223 de la Ley 1801 de 2016. De igual manera, se advierte que con la impugnación se pierde el beneficio del descuento por pronto pago.`,
      `QUINTO: COMUNICAR que contra el presente auto no procede recurso alguno, por tratarse de un acto de trámite, de conformidad con lo dispuesto en el artículo 223 numeral 4 de la Ley 1801 de 2016, al no constituir una decisión definitiva dentro del proceso.`,
      `SEXTO: NOTIFICAR el presente auto de manera personal, dejando constancia de que el ciudadano, con su firma, se notifica integralmente del contenido, así como de la fecha y hora de la audiencia pública, entendiéndose dicha firma como notificación personal y citación válida a audiencia.`,
      `SÉPTIMO: ${d.solicitado} autoriza de manera expresa que cualquier actuación, comunicación o decisión que se surta dentro del presente proceso le sea notificada a través de: ${medioNotificacion}.`,
    ],
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [
      ...incluirSi(d.medioImpugnacion === 'personal', {
        nombre: d.solicitado,
        rol: `C.C. Nro. ${d.cedulaSolicitado}`,
        tipo: 'notificado' as const,
      }),
      { nombre: d.inspectorNombre, rol: d.inspectorRol },
    ],
  };
}
