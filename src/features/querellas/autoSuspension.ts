import { fechaALetras, type DocumentoLegal } from '@/derecho';
import { rotuloParte, type PartesQuerella } from './partes';

/**
 * Auto que decreta pruebas y suspende la audiencia del proceso verbal
 * abreviado (Ley 1801, art. 223 num. 3 lit. c).
 *
 * No es un fallo: no resuelve el fondo. Por eso su parte resolutiva SUSPENDE,
 * DECRETA pruebas y FIJA fecha de reanudación, y nunca declara
 * responsabilidad. Es la pieza que convierte una audiencia única en una
 * continuación — de ahí que el fallo posterior tenga que narrar este trámite.
 *
 * Adaptado a la querella: la citación y la notificación cubren a las DOS
 * partes (Decreto 768, art. 2.2.8.18.3.3), a diferencia del auto de comparendo
 * del despacho, que solo tiene presunto infractor.
 */
export interface DatosAutoSuspension {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorCargo: string;
  radicado: string;
  /** Fecha de la audiencia que se suspende, ISO. */
  fechaAudiencia: string;
  /** Fecha y hora en que se reanuda. La ley da máximo 5 días para practicar. */
  fechaReanudacion: string;
  horaReanudacion: string;
  partes: PartesQuerella;
  comportamiento: string;
  /** Pruebas decretadas, una por línea. */
  pruebasDecretadas: string[];
  /** Por qué se decretan: conducencia, pertinencia y utilidad. */
  motivacion: string;
}

export function generarAutoSuspension(d: DatosAutoSuspension): DocumentoLegal {
  const fAudiencia = fechaALetras(d.fechaAudiencia);
  const fReanudacion = fechaALetras(d.fechaReanudacion);
  const querellante = rotuloParte(d.partes.querellante);
  const querellado = rotuloParte(d.partes.querellado);

  return {
    entidad: (d.inspeccion || d.municipio || 'DESPACHO').toUpperCase(),
    tituloDocumento: 'AUTO',
    epigrafe:
      'POR MEDIO DEL CUAL SE DECRETAN PRUEBAS Y SE SUSPENDE LA AUDIENCIA EN APLICACIÓN DEL PROCESO VERBAL ABREVIADO — ART. 223 NUM. 3 LITERAL C DE LA LEY 1801 DE 2016',
    proceso: d.radicado,
    rotuloProceso: 'QUERELLA No.',
    fechaResolucionLetras: fAudiencia,
    tablaDatos: [
      { etiqueta: 'QUERELLA No.', valor: d.radicado },
      { etiqueta: 'QUERELLANTE', valor: querellante },
      ...(d.partes.calidadQuerellante.trim()
        ? [{ etiqueta: 'CALIDAD EN QUE ACTÚA', valor: d.partes.calidadQuerellante.trim() }]
        : []),
      { etiqueta: 'QUERELLADO', valor: querellado },
      ...(d.partes.inmuebleDireccion.trim()
        ? [{ etiqueta: 'INMUEBLE', valor: d.partes.inmuebleDireccion.trim() }]
        : []),
      { etiqueta: 'COMPORTAMIENTO', valor: d.comportamiento },
      { etiqueta: 'FECHA DE LA AUDIENCIA', valor: fAudiencia },
    ],
    secciones: [
      {
        titulo: 'COMPETENCIA',
        parrafos: [
          `El suscrito ${d.inspectorCargo || 'Inspector de Convivencia y Paz'} del municipio de ${d.municipio}, en uso de las facultades conferidas por la Ley 1801 de 2016 y el Decreto 768 de 2025, se constituyó en audiencia pública dentro de la querella de la referencia, en aplicación del proceso verbal abreviado previsto en el artículo 223 de la Ley 1801 de 2016.`,
        ],
      },
      {
        titulo: 'TRÁMITE',
        parrafos: [
          `En la fecha ${fAudiencia} se instaló la audiencia pública, previa citación de ${querellante} y de ${querellado}, conforme al numeral 2 del artículo 223 de la Ley 1801 de 2016. Se concedió a cada parte el término de veinte (20) minutos para exponer sus argumentos y pruebas (num. 3, literal a) y se les invitó a resolver sus diferencias (literal b).`,
        ],
      },
      {
        titulo: 'PRUEBAS SOLICITADAS Y SU PROCEDENCIA',
        parrafos: [
          d.motivacion.trim() ||
            'El despacho encuentra que las pruebas solicitadas reúnen los requisitos de conducencia, pertinencia y utilidad para el esclarecimiento de los hechos.',
          'De conformidad con el literal c) del numeral 3 del artículo 223 de la Ley 1801 de 2016, si el querellante o el querellado solicitan la práctica de pruebas adicionales, pertinentes y conducentes, y la autoridad las considera viables o las requiere, las decretará y se practicarán en un término máximo de cinco (5) días. La audiencia se reanudará al día siguiente al del vencimiento de la práctica de pruebas.',
        ],
      },
    ],
    resuelve: [
      `PRIMERO: SUSPENDER la audiencia pública instalada dentro de la querella No. ${d.radicado}, adelantada entre ${querellante} y ${querellado}, por las razones expuestas.`,
      `SEGUNDO: DECRETAR y PRACTICAR las siguientes pruebas:${d.pruebasDecretadas
        .filter((p) => p.trim().length > 0)
        .map((p) => `\n- ${p.trim()}`)
        .join('')}`,
      `TERCERO: FIJAR como fecha para la continuación de la audiencia el ${fReanudacion}${
        d.horaReanudacion.trim() ? ` a las ${d.horaReanudacion.trim()}` : ''
      }, diligencia en la que se practicarán las pruebas decretadas, se hará su apreciación conjunta y se decidirá de fondo la actuación.`,
      'CUARTO: NOTIFICAR EN ESTRADOS la presente decisión, conforme al literal d) del numeral 3 del artículo 223 de la Ley 1801 de 2016. Contra este auto procede el recurso de reposición, que se solicitará, concederá y sustentará dentro de la misma audiencia.',
      'QUINTO: Por secretaría, háganse las citaciones y comunicaciones a que haya lugar.',
    ],
    cierre: `Dado en ${d.municipio}, ${fAudiencia}.`,
    firma: [
      { nombre: d.partes.querellante.nombre || '', rol: 'Querellante — NOTIFICADO EN ESTRADOS', tipo: 'notificado' },
      { nombre: d.partes.querellado.nombre || '', rol: 'Querellado — NOTIFICADO EN ESTRADOS', tipo: 'notificado' },
      { nombre: d.inspectorNombre, rol: d.inspectorCargo || 'Inspector de Convivencia y Paz' },
    ],
  };
}
