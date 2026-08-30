import { fechaALetras, type DocumentoLegal } from '@/derecho';
import {
  controlOportunidad,
  DIAS_PARA_REMITIR,
  DIAS_SUPERIOR_RESUELVE,
  rotuloRecurrente,
  type RecursoApelacion,
} from './recursoApelacion';

/**
 * Auto que resuelve sobre la CONCESIÓN del recurso de apelación (Ley 1801 de
 * 2016, art. 223 num. 4). Un solo generador para los dos sentidos posibles,
 * porque el documento es el mismo y solo cambia qué se resuelve: se concede, o
 * se niega por extemporáneo.
 *
 * Lo que este auto NUNCA hace es resolver el recurso. Eso es del superior
 * jerárquico (arts. 205.8 y 205.14). El despacho concede y remite.
 *
 * El efecto es siempre el DEVOLUTIVO, que la ley impone y que no suspende el
 * cumplimiento de la medida correctiva: si no se advierte, el ciudadano cree
 * que apelar le paró la multa.
 */
export interface DatosAutoApelacion {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorCargo: string;
  radicado: string;
  comportamiento: string;
  recurso: RecursoApelacion;
}

export function generarAutoApelacion(d: DatosAutoApelacion): DocumentoLegal {
  const { recurso } = d;
  const control = controlOportunidad(recurso);
  const fAudiencia = fechaALetras(recurso.fechaAudiencia);
  const fAuto = fechaALetras(recurso.fechaConcesion);
  const recurrente = rotuloRecurrente(recurso);
  const superior = recurso.superior.trim() || 'el superior jerárquico';

  return {
    entidad: (d.inspeccion || d.municipio || 'DESPACHO').toUpperCase(),
    tituloDocumento: 'AUTO',
    epigrafe: control.procedente
      ? 'POR MEDIO DEL CUAL SE CONCEDE EL RECURSO DE APELACIÓN EN EL EFECTO DEVOLUTIVO Y SE ORDENA LA REMISIÓN AL SUPERIOR JERÁRQUICO — ART. 223 NUM. 4 DE LA LEY 1801 DE 2016'
      : 'POR MEDIO DEL CUAL SE NIEGA POR EXTEMPORÁNEO EL RECURSO DE APELACIÓN — ART. 223 NUM. 4 DE LA LEY 1801 DE 2016',
    proceso: d.radicado,
    rotuloProceso: 'RADICADO No.',
    fechaResolucionLetras: fAuto,
    tablaDatos: [
      { etiqueta: 'RADICADO No.', valor: d.radicado },
      { etiqueta: 'RECURRENTE', valor: recurrente },
      { etiqueta: 'CALIDAD EN QUE ACTÚA', valor: etiquetaCalidad(recurso) },
      { etiqueta: 'COMPORTAMIENTO', valor: d.comportamiento },
      { etiqueta: 'DECISIÓN APELADA', valor: recurso.decisionApelada.trim() || '—' },
      { etiqueta: 'FECHA DE LA AUDIENCIA', valor: fAudiencia },
      ...(control.procedente ? [{ etiqueta: 'SE REMITE A', valor: superior }] : []),
    ],
    secciones: [
      {
        titulo: 'COMPETENCIA',
        parrafos: [
          `El suscrito ${d.inspectorCargo || 'Inspector de Convivencia y Paz'} del municipio de ${d.municipio} conoció en PRIMERA INSTANCIA de la actuación de la referencia, en aplicación del proceso verbal abreviado del artículo 223 de la Ley 1801 de 2016. Es competente únicamente para pronunciarse sobre la CONCESIÓN del recurso; su resolución de fondo corresponde a ${superior}, conforme a los numerales 8 y 14 del artículo 205 de la misma ley.`,
        ],
      },
      {
        titulo: 'ANTECEDENTES',
        parrafos: [
          `En audiencia pública celebrada el ${fAudiencia} este despacho profirió la decisión de la referencia. Notificada en estrados, ${recurrente} interpuso ${
            recurso.via === 'reposicion_y_subsidio'
              ? 'recurso de reposición y, en subsidio, el de apelación'
              : 'recurso de apelación'
          }.`,
          ...(recurso.via === 'reposicion_y_subsidio'
            ? [
                'El recurso de reposición fue resuelto de manera inmediata dentro de la misma audiencia, como lo ordena el numeral 4 del artículo 223 de la Ley 1801 de 2016, y la decisión se mantuvo. Procede en consecuencia pronunciarse sobre la apelación interpuesta en subsidio.',
              ]
            : []),
          ...(recurso.sustentacion.trim()
            ? [`Sustentación expuesta por el recurrente: ${recurso.sustentacion.trim()}`]
            : []),
        ],
      },
      {
        titulo: 'CONSIDERACIONES SOBRE LA OPORTUNIDAD',
        parrafos: [
          control.motivo,
          ...(control.procedente
            ? [
                `Verificada la oportunidad, y siendo la apelación un recurso que este despacho debe conceder mas no resolver, se dispondrá su concesión en el EFECTO DEVOLUTIVO y la remisión de la actuación a ${superior} dentro de los dos (2) días siguientes, ante quien el recurrente deberá sustentarla dentro de los dos (2) días siguientes al recibo del recurso.`,
              ]
            : []),
        ],
      },
    ],
    resuelve: control.procedente
      ? [
          `PRIMERO: CONCEDER el recurso de apelación interpuesto por ${recurrente} contra la decisión proferida en audiencia del ${fAudiencia} dentro del radicado No. ${d.radicado}, en el EFECTO DEVOLUTIVO, conforme al numeral 4 del artículo 223 de la Ley 1801 de 2016.`,
          `SEGUNDO: ADVERTIR que el efecto devolutivo NO suspende el cumplimiento de la decisión apelada, la cual conserva su fuerza ejecutoria mientras el superior resuelve.`,
          `TERCERO: REMITIR la actuación a ${superior} dentro de los ${DIAS_PARA_REMITIR === 2 ? 'dos (2)' : String(DIAS_PARA_REMITIR)} días siguientes a la fecha de este auto, por conducto de la secretaría del despacho.`,
          `CUARTO: ADVERTIR al recurrente que deberá sustentar el recurso ante ${superior} dentro de los dos (2) días siguientes al recibo de la actuación, y que aquel lo resolverá dentro de los ${DIAS_SUPERIOR_RESUELVE === 8 ? 'ocho (8)' : String(DIAS_SUPERIOR_RESUELVE)} días siguientes al recibo.`,
          'QUINTO: NOTIFICAR EN ESTRADOS la presente decisión.',
        ]
      : [
          `PRIMERO: NEGAR por EXTEMPORÁNEO el recurso de apelación formulado por ${recurrente} contra la decisión proferida en audiencia del ${fAudiencia} dentro del radicado No. ${d.radicado}, por las razones expuestas.`,
          'SEGUNDO: ADVERTIR que la decisión de primera instancia conserva su fuerza ejecutoria y deberá cumplirse en los términos señalados en ella.',
          'TERCERO: NOTIFICAR EN ESTRADOS la presente decisión.',
        ],
    cierre: `Dado en ${d.municipio}, ${fAuto}.`,
    firma: [
      {
        nombre: recurso.recurrenteNombre.trim(),
        rol: 'Recurrente — NOTIFICADO EN ESTRADOS',
        tipo: 'notificado',
      },
      { nombre: d.inspectorNombre, rol: d.inspectorCargo || 'Inspector de Convivencia y Paz' },
    ],
  };
}

function etiquetaCalidad(recurso: RecursoApelacion): string {
  const etiquetas: Record<RecursoApelacion['calidad'], string> = {
    infractor: 'Presunto infractor',
    querellante: 'Querellante',
    querellado: 'Querellado',
    apoderado: 'Apoderado',
  };
  return etiquetas[recurso.calidad];
}
