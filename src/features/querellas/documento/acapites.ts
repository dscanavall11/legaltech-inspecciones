import dayjs from 'dayjs';
import type { QuerellaDetalle } from '../types';
import { sumarDiasHabiles } from '@/shared/terminos/diasHabiles';
import { MULTA_LABEL, valorMulta, formatearPesos } from '@/shared/multas/multas';

/**
 * Construcción del documento legal (fallo / constancia de ejecutoria) por acápites.
 *
 * En producción esto lo genera el backend con la plantilla de cada inspección
 * y los modelos de IA (Spring AI). Aquí se arma una versión de demostración con
 * los datos del expediente para previsualizar la estructura.
 *
 * ⚠️ Contenido jurídico de muestra — pendiente de validación legal.
 *
 * `Acapite`/`DocumentoGenerado` ahora viven en shared/documentos/acapites
 * (Task 18: DocumentoEditorPage genérico) — se re-exportan aquí para no
 * romper a quejas/SiguientePasoQueja.tsx y querellas/SiguientePaso.tsx, que
 * ya los importaban desde este módulo.
 */
export type { Acapite, DocumentoGenerado } from '@/shared/documentos/acapites';
import type { DocumentoGenerado } from '@/shared/documentos/acapites';

export type TipoDocumento = 'fallo' | 'acta' | 'citacion' | 'constancia';

const fmt = (f: string) => dayjs(f).format('D [de] MMMM [de] YYYY');

function fechaActuacion(q: QuerellaDetalle, tipo: string): string | undefined {
  return q.actuaciones.find((a) => a.tipo === tipo)?.fecha;
}

function documentoFallo(q: QuerellaDetalle): DocumentoGenerado {
  const fechaAudiencia = fechaActuacion(q, 'audiencia') ?? q.fechaRadicacion;

  return {
    titulo: 'Fallo — Proceso verbal abreviado',
    inspeccion: 'Inspección 1A Distrital de Policía',
    acapites: [
      {
        id: 'identificacion',
        titulo: 'I. Identificación',
        resumen: 'Datos del expediente y de las partes.',
        fuente: 'plantilla',
        parrafos: [
          `Radicado N.º ${q.radicado}. Querellante: ${q.querellante}. Querellado: ${q.querellado}.`,
          `Asunto: ${q.asunto}. Inmueble: ${q.direccionInmueble ?? 'No registra'}.`,
        ],
      },
      {
        id: 'hechos',
        titulo: 'II. Hechos',
        resumen: 'Relato de los hechos materia de la querella.',
        fuente: 'ia',
        parrafos: [
          `El ${fmt(q.fechaRadicacion)}, ${q.querellante} presentó querella contra ${q.querellado} por presunto comportamiento contrario a la convivencia relacionado con: ${q.asunto.toLowerCase()}.`,
        ],
      },
      {
        id: 'actuacion',
        titulo: 'III. Actuación procesal',
        resumen: 'Trámite surtido hasta la audiencia.',
        fuente: 'plantilla',
        parrafos: [
          `Radicada la querella el ${fmt(q.fechaRadicacion)}, el despacho avocó conocimiento, citó a las partes y celebró audiencia pública el ${fmt(fechaAudiencia)}.`,
        ],
      },
      {
        id: 'consideraciones',
        titulo: 'IV. Consideraciones del despacho',
        resumen: 'Valoración probatoria y análisis del caso.',
        fuente: 'ia',
        parrafos: [
          'Valoradas las pruebas obrantes en el expediente y escuchadas las partes, el despacho encuentra acreditado el comportamiento contrario a la convivencia atribuido al querellado.',
        ],
      },
      {
        id: 'fundamentos',
        titulo: 'V. Fundamentos de derecho',
        resumen: 'Normas aplicables (Ley 1801 de 2016).',
        fuente: 'plantilla',
        parrafos: [
          'De conformidad con la Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana) y demás normas concordantes, este despacho es competente para conocer y decidir el presente asunto.',
        ],
      },
      {
        id: 'resuelve',
        titulo: 'VI. Parte resolutiva',
        resumen: 'Decisión y medida correctiva impuesta.',
        fuente: 'ia',
        parrafos: [
          `PRIMERO: Declarar responsable a ${q.querellado} del comportamiento contrario a la convivencia descrito.`,
          `SEGUNDO: Imponer como medida correctiva ${MULTA_LABEL[2]} por valor de ${formatearPesos(valorMulta(2))}, conforme al artículo 180 de la Ley 1801 de 2016. (Tipo y valor sujetos a la tipificación del caso y al SMMLV vigente.)`,
          'TERCERO: Registrar la medida en el Registro Nacional de Medidas Correctivas (RNMC).',
        ],
      },
      {
        id: 'recursos',
        titulo: 'VII. Recursos',
        resumen: 'Recursos que proceden y sus términos.',
        fuente: 'plantilla',
        parrafos: [
          'Contra la presente decisión proceden los recursos de reposición y, en subsidio, apelación, los cuales podrán interponerse dentro de los términos de ley.',
        ],
      },
    ],
  };
}

function documentoActa(q: QuerellaDetalle): DocumentoGenerado {
  const fechaFallo = fechaActuacion(q, 'fallo') ?? q.fechaRadicacion;
  const fechaNotif = fechaActuacion(q, 'notificacion') ?? fechaFallo;
  // Término de ejecutoria: 3 días hábiles para interponer recursos.
  const vencimientoRecursos = sumarDiasHabiles(dayjs(fechaNotif), 3);

  return {
    titulo: 'Acta de firmeza / ejecutoria',
    inspeccion: 'Inspección 1A Distrital de Policía',
    acapites: [
      {
        id: 'identificacion',
        titulo: 'I. Identificación del expediente',
        resumen: 'Radicado y partes del proceso.',
        fuente: 'plantilla',
        parrafos: [
          `Radicado N.º ${q.radicado}. Querellante: ${q.querellante}. Querellado: ${q.querellado}. Asunto: ${q.asunto}.`,
        ],
      },
      {
        id: 'antecedente',
        titulo: 'II. Antecedente',
        resumen: 'Fallo que se declara en firme.',
        fuente: 'plantilla',
        parrafos: [
          `Mediante fallo del ${fmt(fechaFallo)}, este despacho profirió decisión de fondo dentro del presente proceso.`,
        ],
      },
      {
        id: 'notificacion',
        titulo: 'III. Notificación',
        resumen: 'Constancia de notificación a las partes.',
        fuente: 'plantilla',
        parrafos: [
          `La decisión fue notificada a las partes el ${fmt(fechaNotif)}, quedando habilitado el término para la interposición de recursos.`,
        ],
      },
      {
        id: 'computo',
        titulo: 'IV. Cómputo de la ejecutoria',
        resumen: 'Conteo de días hábiles para la firmeza.',
        fuente: 'ia',
        parrafos: [
          `El término de tres (3) días hábiles para interponer recursos venció el ${fmt(vencimientoRecursos.format('YYYY-MM-DD'))}, excluyendo sábados, domingos y festivos.`,
        ],
      },
      {
        id: 'no-recursos',
        titulo: 'V. Constancia de no interposición de recursos',
        resumen: 'No se presentaron recursos.',
        fuente: 'plantilla',
        parrafos: [
          'Vencido el término legal sin que las partes interpusieran recurso alguno contra la decisión, esta se encuentra en firme.',
        ],
      },
      {
        id: 'firmeza',
        titulo: 'VI. Declaratoria de firmeza',
        resumen: 'Declaración de ejecutoria de la decisión.',
        fuente: 'plantilla',
        parrafos: [
          `DECLÁRASE en firme y debidamente ejecutoriada la decisión proferida el ${fmt(fechaFallo)} dentro del radicado N.º ${q.radicado}.`,
        ],
      },
      {
        id: 'cumplimiento',
        titulo: 'VII. Orden de cumplimiento',
        resumen: 'Orden de cumplimiento de la medida.',
        fuente: 'ia',
        parrafos: [
          'ORDÉNASE el cumplimiento de la medida correctiva impuesta y, de ser procedente, su registro en el Registro Nacional de Medidas Correctivas (RNMC).',
        ],
      },
    ],
  };
}

function documentoCitacion(q: QuerellaDetalle): DocumentoGenerado {
  const fechaAudienciaIso = fechaActuacion(q, 'audiencia');
  const fechaAudiencia = fechaAudienciaIso
    ? dayjs(fechaAudienciaIso).format('D [de] MMMM [de] YYYY [a las] h:mm a')
    : '__ de __________ de 2026 a las __:__';

  return {
    titulo: 'Citación a audiencia pública',
    inspeccion: 'Inspección 1A Distrital de Policía',
    acapites: [
      {
        id: 'identificacion',
        titulo: 'I. Identificación',
        resumen: 'Radicado y partes del proceso.',
        fuente: 'plantilla',
        parrafos: [
          `Radicado N.º ${q.radicado}. Querellante: ${q.querellante}. Querellado: ${q.querellado}. Asunto: ${q.asunto}.`,
        ],
      },
      {
        id: 'citacion',
        titulo: 'II. Citación',
        resumen: 'Fecha, hora y lugar de la audiencia.',
        fuente: 'plantilla',
        parrafos: [
          `Este despacho CITA a las partes a audiencia pública que se llevará a cabo el ${fechaAudiencia}, en las instalaciones de la Inspección.`,
          q.direccionInmueble
            ? `Inmueble relacionado con los hechos: ${q.direccionInmueble}.`
            : 'La comparecencia deberá efectuarse en la sede del despacho.',
        ],
      },
      {
        id: 'fundamento',
        titulo: 'III. Fundamento legal',
        resumen: 'Antelación mínima de 24 horas (Ley 1801).',
        fuente: 'plantilla',
        parrafos: [
          'La presente citación se surte con una antelación no inferior a veinticuatro (24) horas, conforme al trámite del proceso verbal abreviado del Código Nacional de Seguridad y Convivencia Ciudadana (Ley 1801 de 2016).',
        ],
      },
      {
        id: 'advertencia',
        titulo: 'IV. Advertencia por inasistencia',
        resumen: 'Consecuencias de no comparecer.',
        fuente: 'ia',
        parrafos: [
          'Se advierte a las partes que, ante la inasistencia injustificada a la audiencia, el despacho podrá continuar la actuación, imponer la medida correctiva a que haya lugar y proferir el fallo correspondiente conforme a la ley.',
        ],
      },
      {
        id: 'comparecencia',
        titulo: 'V. Forma de comparecencia',
        resumen: 'Documentos y pruebas a aportar.',
        fuente: 'plantilla',
        parrafos: [
          'Las partes deberán comparecer con su documento de identidad y aportar las pruebas que pretendan hacer valer. Podrán asistir acompañadas de apoderado si así lo desean.',
        ],
      },
    ],
  };
}

// La constancia de ejecutoria es el mismo acto procesal que el acta de firmeza
// (declara ejecutoriada la decisión); solo cambia el título del documento.
function documentoConstancia(q: QuerellaDetalle): DocumentoGenerado {
  return { ...documentoActa(q), titulo: 'Constancia de ejecutoria' };
}

export function construirDocumento(
  tipo: TipoDocumento,
  q: QuerellaDetalle,
): DocumentoGenerado {
  switch (tipo) {
    case 'fallo':
      return documentoFallo(q);
    case 'acta':
      return documentoActa(q);
    case 'citacion':
      return documentoCitacion(q);
    case 'constancia':
      return documentoConstancia(q);
    // Esta pantalla es para piezas procesales determinísticas; ante un tipo
    // desconocido se asume constancia, nunca un fallo (que va por /analisis con IA).
    default:
      return documentoConstancia(q);
  }
}
