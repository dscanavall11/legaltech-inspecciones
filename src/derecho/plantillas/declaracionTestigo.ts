import { fechaALetras } from '../letras';
import type { DocumentoLegal } from './documentoLegal';

/**
 * Plantilla de RECEPCIÓN DE TESTIMONIO dentro del proceso verbal abreviado
 * (art. 223 núm. 3 lit. c, Ley 1801 de 2016) — prueba testimonial decretada
 * a solicitud de una de las partes (ver auto-decreta-pruebas-suspende.yaml,
 * slot pruebasDecretadas) y practicada antes de la audiencia de fallo.
 * Mirror de okf-bundles/roles-profesionales/inspector-policia/plantillas/
 * declaracion-testigo.yaml. Párrafos fijos transcritos y anonimizados de
 * docs/superpowers/plan-sources/despacho-audiencias/declaracion-testigo.txt
 * (instancia diligenciada); el interrogatorio se resume en pares
 * pregunta/respuesta en vez de transcribirse literalmente.
 */
export interface PreguntaRespuesta {
  pregunta: string;
  respuesta: string;
}

export interface DatosDeclaracionTestigo {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  fechaResolucion: string; // ISO — fecha de la diligencia de testimonio
  horaDiligencia?: string; // fallback "NO REGISTRA"
  proceso: string;
  comparendo: string;
  articuloNumeral: string;
  fechaComparendo: string; // ISO
  lugarComportamiento?: string; // fallback "NO REGISTRA"
  solicitado: string; // presunto infractor que solicitó la prueba testimonial
  cedulaSolicitado: string;
  solicitante: string;
  representanteApoderado?: string; // fallback "actúa por sí mismo"
  testigoNombre: string;
  testigoCedula: string;
  testigoDireccion?: string; // fallback "NO APORTA"
  testigoTelefono?: string; // fallback "NO APORTA"
  vinculoConSolicitado: string;
  preguntasYRespuestas: PreguntaRespuesta[];
  manifestacionTraslado: string;
}

/** Construye el acta de recepción de testimonio dentro del proceso verbal abreviado. */
export function generarDeclaracionTestigo(d: DatosDeclaracionTestigo): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const hora = d.horaDiligencia || 'NO REGISTRA';
  const lugar = d.lugarComportamiento || 'NO REGISTRA';
  const representante = d.representanteApoderado || 'actúa por sí mismo';
  const testigoDireccion = d.testigoDireccion || 'NO APORTA';
  const testigoTelefono = d.testigoTelefono || 'NO APORTA';

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'RECEPCIÓN DE TESTIMONIO',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe: 'LEY 1801 DE 2016 — PROCESO VERBAL ABREVIADO, ART. 223 NÚM. 3 LIT. C',
    tablaDatos: [
      { etiqueta: 'No QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'COMPORTAMIENTO CONTRARIO', valor: `${d.articuloNumeral} del C.N.S.C.C.` },
      { etiqueta: 'FECHA Y HORA', valor: fComparendo },
      { etiqueta: 'LUGAR DEL COMPORTAMIENTO', valor: lugar },
      { etiqueta: 'NOMBRE PRESUNTO INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedulaSolicitado },
      { etiqueta: 'PROCEDENCIA', valor: d.solicitante },
    ],
    secciones: [
      {
        titulo: 'IDENTIFICACIÓN DEL DECLARANTE',
        parrafos: [
          `Ante la ${d.inspeccion}, en ${d.municipio}, el ${fResolucion}, siendo las ${hora}, se hace presente ante este despacho ${d.testigoNombre}, identificado(a) con cédula de ciudadanía No. ${d.testigoCedula}, residenciado(a) en ${testigoDireccion}, teléfono ${testigoTelefono}, para rendir testimonio dentro del proceso verbal abreviado, prueba solicitada por ${d.solicitado} — asistido por ${representante} — y decretada por este despacho en relación con la Orden de Comparendo No. ${d.comparendo} de fecha ${fComparendo}. El testigo manifiesta, bajo juramento, el vínculo declarado con el solicitado: ${d.vinculoConSolicitado}.`,
        ],
      },
      {
        titulo: 'JURAMENTO',
        parrafos: [
          `Previo a la recepción del testimonio, este despacho procedió a tomar el juramento de ley a ${d.testigoNombre}, advirtiéndole sobre el deber de decir la verdad y las consecuencias legales en caso de faltar a ella, de conformidad con lo dispuesto en la ley. El declarante manifestó entender el alcance del juramento y se comprometió a rendir su testimonio de manera veraz, libre de apremio y sin reservas, quedando debidamente enterado de su obligación legal.`,
        ],
      },
      {
        titulo: 'INTERROGATORIO',
        parrafos: [
          'Se formula al testigo el siguiente interrogatorio, cuyas preguntas y respuestas — resumidas — se relacionan a continuación:',
          ...d.preguntasYRespuestas.map(
            ({ pregunta, respuesta }) => `PREGUNTANDO: "${pregunta}". RESPONDE: "${respuesta}".`,
          ),
        ],
      },
      {
        titulo: 'TRASLADO A LA PARTE',
        parrafos: [
          `Se corre traslado de esta prueba a ${d.solicitado} para que realice la manifestación que a bien tenga respecto del testimonio rendido, quien manifiesta: "${d.manifestacionTraslado}".`,
        ],
      },
      {
        titulo: 'CIERRE',
        parrafos: [
          'No siendo otro el objeto de la diligencia, se da por terminada y se firma por quienes en ella intervienen, dejando constancia de que la presente acta se anexa al expediente del proceso, con la validez probatoria del caso.',
        ],
      },
    ],
    resuelve: [],
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [
      { nombre: d.solicitado, rol: `C.C. Nro. ${d.cedulaSolicitado}`, tipo: 'solicitado' },
      { nombre: d.testigoNombre, rol: `C.C. Nro. ${d.testigoCedula}`, tipo: 'testigo' },
      { nombre: d.inspectorNombre, rol: d.inspectorRol },
    ],
  };
}
