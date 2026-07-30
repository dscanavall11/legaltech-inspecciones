import { fechaALetras } from '../letras';
import type { DocumentoLegal } from './documentoLegal';

/**
 * Plantilla del AUTO que deja constancia de la inasistencia del presunto
 * infractor a la audiencia pública y suspende el proceso verbal abreviado
 * por tres (3) días para justa causa (art. 223 núm. 3, Ley 1801 de 2016).
 * Mirror de okf-bundles/roles-profesionales/inspector-policia/plantillas/
 * auto-inasistencia.yaml. Párrafos fijos transcritos y anonimizados de
 * docs/superpowers/plan-sources/despacho-audiencias/auto-inasistencia.txt
 * (instancia diligenciada). Este auto no lleva firma del solicitado, que no
 * compareció.
 */
export interface DatosAutoInasistencia {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  fechaResolucion: string; // ISO
  horaAudiencia: string; // p. ej. "10:00 a.m."
  proceso: string;
  comparendo: string;
  articuloNumeral: string;
  fechaComparendo: string; // ISO
  lugarComportamiento: string;
  solicitado: string;
  cedulaSolicitado: string;
  direccionSolicitado: string;
  telefonoSolicitado?: string; // fallback "NO APORTA"
  solicitante: string;
  hechos: string;
  descripcionConducta: string;
  bienJuridico: string;
  medidasCorrectivas: string;
  medioNotificacionAutorizado?: string; // fallback "NO APORTA"
  fechaNotificacionPrevia: string; // ISO — fecha del auto que citó a la audiencia
}

/** Construye el auto que deja constancia de la inasistencia y suspende el proceso. */
export function generarAutoInasistencia(d: DatosAutoInasistencia): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const fNotificacionPrevia = fechaALetras(d.fechaNotificacionPrevia);
  const telefono = d.telefonoSolicitado || 'NO APORTA';
  const medioNotificacion = d.medioNotificacionAutorizado || 'NO APORTA';

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'AUTO',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe:
      'POR MEDIO DEL CUAL SE SUSPENDE AUDIENCIA EN APLICACIÓN DEL PROCESO VERBAL ABREVIADO — ART. 223 NÚM. 3, LEY 1801 DE 2016',
    tablaDatos: [
      { etiqueta: 'No QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'COMPORTAMIENTO CONTRARIO', valor: `Art. ${d.articuloNumeral} del C.N.S.C.C.` },
      { etiqueta: 'FECHA Y HORA', valor: `${fComparendo}.` },
      { etiqueta: 'LUGAR DEL COMPORTAMIENTO', valor: d.lugarComportamiento },
      { etiqueta: 'NOMBRE PRESUNTO INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedulaSolicitado },
      { etiqueta: 'DIRECCIÓN PRESUNTO INFRACTOR', valor: `${d.direccionSolicitado}. Teléfono ${telefono}.` },
      { etiqueta: 'PROCEDENCIA', valor: d.solicitante },
    ],
    secciones: [
      {
        titulo: 'ANTECEDENTES',
        parrafos: [
          `Origen en la orden de comparendo ${d.comparendo}, de fecha ${fComparendo}, tramitada mediante queja ${d.proceso}, impuesta por ${d.solicitante} en contra de ${d.solicitado}, abordado(a) en ${d.lugarComportamiento} e incurriendo en el siguiente comportamiento contrario a la convivencia: "${d.hechos}". Fundamento normativo: ${d.articuloNumeral} — "${d.descripcionConducta}" — conducta que hace parte de los comportamientos que ${d.bienJuridico}. Medidas correctivas previstas: ${d.medidasCorrectivas}.`,
        ],
      },
      {
        titulo: 'COMPETENCIA',
        parrafos: [
          `De conformidad con lo establecido en el artículo 206, numeral 6, literal h) de la Ley 1801 de 2016, el ${d.inspectorRol} es competente para conocer de la medida correctiva de multa prevista en el artículo 180 del C.N.S.C.C., y para decidir en segunda instancia sobre las medidas correctivas de competencia de los comandantes de estación, subestación y del personal uniformado de la Policía Nacional.`,
        ],
      },
      {
        titulo: 'AUDIENCIA',
        parrafos: [
          `En ${d.municipio}, en la fecha ${fResolucion}, siendo las ${d.horaAudiencia}, el inspector se constituye en audiencia pública de conformidad con el artículo 223 de la Ley 1801 de 2016. Una vez constituido, se da espera por un término de quince (15) minutos al presunto infractor; vencido dicho término, se deja constancia de la inasistencia de ${d.solicitado}, quien fue notificado(a) de la fecha y hora de la diligencia mediante auto de fecha ${fNotificacionPrevia} a través de ${medioNotificacion}. Frente a la inasistencia, el despacho decide suspender el proceso por un término máximo de tres (3) días hábiles, dentro de los cuales el presunto infractor deberá aportar prueba siquiera sumaria de una justa causa; de resultar admisible, dará lugar a la programación de nueva fecha para continuar la audiencia conforme al artículo 223. De no justificarse la inasistencia, el despacho se pronunciará de fondo con las pruebas obrantes en el expediente.`,
        ],
      },
    ],
    resuelve: [
      `PRIMERO: SUSPENDER el presente proceso por un término máximo de tres (3) días hábiles, con el fin de que ${d.solicitado} aporte prueba siquiera sumaria de una justa causa de inasistencia, la cual, de resultar admisible, dará lugar a la programación de una nueva fecha para continuar la audiencia, de conformidad con las reglas previstas en el artículo 223 de la Ley 1801 de 2016.`,
      `SEGUNDO: ADVERTIR que, vencido el término anterior sin que ${d.solicitado} justifique de manera válida su inasistencia, el despacho continuará con el trámite del presente proceso y procederá a pronunciarse de fondo en aplicación del parágrafo 1 del artículo 223 de la Ley 1801 de 2016 — conforme al cual, de no comprobarse caso fortuito o fuerza mayor, se tendrán por ciertos los hechos que dieron lugar al comportamiento contrario a la convivencia y se resolverá de fondo con base en las pruebas allegadas y los informes de las autoridades, salvo que se considere indispensable decretar una prueba adicional (Sentencia C-349/2017).`,
      `TERCERO: NOTIFICAR la presente decisión en estados.`,
    ],
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [{ nombre: d.inspectorNombre, rol: d.inspectorRol }],
  };
}
