import dayjs from 'dayjs';
import { DESPACHO } from '@/derecho';
import type { DocumentoGenerado } from '../querellas/documento/acapites';
import type { Queja } from './types';

/**
 * Documentos determinísticos del trámite de queja (conciliación). El acta de
 * conciliación recoge el ACUERDO que el inspector transcribe (input humano) +
 * los efectos jurídicos de ley. La IA que formalice el texto del acuerdo entra
 * como paso siguiente (hoy es plantilla).
 *
 * ⚠️ Contenido jurídico de muestra — pendiente de validación legal.
 */
const INSPECCION = DESPACHO.nombre;

const fmt = (f?: string) => (f ? dayjs(f).format('D [de] MMMM [de] YYYY [a las] h:mm a') : '__ de __________ de 2026');

function identificacion(q: Queja) {
  return {
    id: 'identificacion',
    titulo: 'I. Identificación',
    resumen: 'Radicado y partes.',
    fuente: 'plantilla' as const,
    parrafos: [
      `Radicado N.º ${q.radicado}. Quejoso: ${q.quejoso}. Acusado: ${q.acusado}. Asunto: ${q.asunto}.`,
    ],
  };
}

export function construirCitacionConciliacion(q: Queja, fechaConciliacion?: string): DocumentoGenerado {
  return {
    titulo: 'Citación a audiencia de conciliación',
    inspeccion: INSPECCION,
    acapites: [
      identificacion(q),
      {
        id: 'citacion',
        titulo: 'II. Citación',
        resumen: 'Fecha y hora de la audiencia.',
        fuente: 'plantilla',
        parrafos: [
          `Este despacho CITA a las partes a audiencia de conciliación que se celebrará el ${fmt(fechaConciliacion)}, en las instalaciones de la ${INSPECCION}.`,
        ],
      },
      {
        id: 'fundamento',
        titulo: 'III. Fundamento y advertencia',
        resumen: 'Base legal e inasistencia.',
        fuente: 'plantilla',
        parrafos: [
          'La conciliación se surte como mecanismo de solución del conflicto de convivencia. Se advierte que la inasistencia injustificada podrá dar lugar a que el asunto continúe por proceso verbal abreviado (art. 223, Ley 1801 de 2016).',
        ],
      },
    ],
  };
}

export function construirActaConciliacion(q: Queja, acuerdo: string): DocumentoGenerado {
  return {
    titulo: 'Acta de conciliación',
    inspeccion: INSPECCION,
    acapites: [
      identificacion(q),
      {
        id: 'audiencia',
        titulo: 'II. Audiencia de conciliación',
        resumen: 'Comparecencia de las partes.',
        fuente: 'plantilla',
        parrafos: [
          'En la fecha señalada comparecieron las partes ante este despacho, quienes, con ánimo conciliatorio, expusieron sus posiciones frente al asunto materia de la queja.',
        ],
      },
      {
        id: 'acuerdo',
        titulo: 'III. Acuerdo conciliatorio',
        resumen: 'Compromisos pactados por las partes.',
        fuente: 'plantilla',
        parrafos: [
          acuerdo.trim() || 'Las partes acordaron: ____________________________________________.',
        ],
      },
      {
        id: 'efectos',
        titulo: 'IV. Efectos jurídicos',
        resumen: 'Mérito ejecutivo y cosa juzgada.',
        fuente: 'plantilla',
        parrafos: [
          'La presente acta, suscrita por las partes y por el inspector, presta mérito ejecutivo y hace tránsito a cosa juzgada, conforme a la Ley 640 de 2001. Verificado el cumplimiento de lo acordado, se ordenará el archivo del expediente.',
        ],
      },
    ],
  };
}

export function construirConstanciaNoAcuerdo(q: Queja): DocumentoGenerado {
  return {
    titulo: 'Constancia de no acuerdo',
    inspeccion: INSPECCION,
    acapites: [
      identificacion(q),
      {
        id: 'audiencia',
        titulo: 'II. Audiencia celebrada',
        resumen: 'Se agotó la etapa conciliatoria.',
        fuente: 'plantilla',
        parrafos: [
          'Celebrada la audiencia de conciliación, las partes no llegaron a un acuerdo que resolviera el conflicto materia de la queja.',
        ],
      },
      {
        id: 'constancia',
        titulo: 'III. Constancia y trámite subsiguiente',
        resumen: 'No hubo ánimo conciliatorio.',
        fuente: 'plantilla',
        parrafos: [
          'Se deja constancia de la falta de ánimo conciliatorio entre las partes. En consecuencia, el asunto podrá continuar por proceso verbal abreviado, tramitándose como querella (art. 223, Ley 1801 de 2016).',
        ],
      },
    ],
  };
}
