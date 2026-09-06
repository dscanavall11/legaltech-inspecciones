import { fechaALetras } from '../letras';
import type { TipoMulta } from '../multas';
import type { DocumentoLegal } from './documentoLegal';

/**
 * Plantilla del AUTO que decreta pruebas y suspende la audiencia pública
 * dentro del proceso verbal abreviado (art. 223 núm. 3, Ley 1801 de 2016).
 * Mirror de okf-bundles/roles-profesionales/inspector-policia/plantillas/
 * auto-decreta-pruebas-suspende.yaml. Párrafos fijos transcritos y
 * anonimizados de docs/superpowers/plan-sources/despacho-audiencias/
 * auto-suspende-audiencia.txt (instancia diligenciada); los hechos,
 * descargos y observaciones textuales del comparendo se resumen en un slot
 * en vez de transcribirse literalmente, según la convención del OKF.
 */
export interface DatosAutoDecretaPruebasSuspende {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  fechaResolucion: string; // ISO
  proceso: string;
  comparendo: string;
  articuloNumeral: string;
  fechaComparendo: string; // ISO
  lugarComportamiento: string;
  solicitado: string;
  cedulaSolicitado: string;
  direccionSolicitado: string;
  telefonoSolicitado?: string; // fallback "NO APORTA"
  solicitante: string; // CAI / unidad de policía
  tipoMulta: TipoMulta;
  hechos: string; // resumen de los hechos citados del comparendo
  descripcionConducta: string; // literal del comportamiento, art./numeral
  bienJuridico: string; // categoría del C.N.S.C.C.
  medidasCorrectivas: string;
  observaciones?: string; // fallback "NINGUNA"
  apeloSiNo: 'SI' | 'NO';
  representanteApoderado?: string; // fallback "actúa por sí mismo"
  descargos: string; // resumen de argumentos y pruebas anunciadas
  pruebasDecretadas: string[];
  fechaReanudacion: string; // ISO
}

/** Construye el auto que decreta pruebas y suspende la audiencia pública. */
export function generarAutoDecretaPruebasSuspende(d: DatosAutoDecretaPruebasSuspende): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const fReanudacion = fechaALetras(d.fechaReanudacion);
  const telefono = d.telefonoSolicitado || 'NO APORTA';
  const observaciones = d.observaciones || 'NINGUNA';
  const representante = d.representanteApoderado || 'actúa por sí mismo';

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'AUTO',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe:
      'POR MEDIO DEL CUAL SE DECRETAN PRUEBAS Y SE SUSPENDE AUDIENCIA EN APLICACIÓN DEL PROCESO VERBAL ABREVIADO — ART. 223 NÚM. 3, LEY 1801 DE 2016',
    tablaDatos: [
      { etiqueta: 'No QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'COMPORTAMIENTO CONTRARIO', valor: `${d.articuloNumeral} del C.N.S.C.C.` },
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
          `Llegada de la orden de comparendo ${d.comparendo}, de fecha ${fComparendo}, radicada mediante queja ${d.proceso}, impuesta por ${d.solicitante} en contra de ${d.solicitado}, hallado(a) incurriendo en el comportamiento descrito bajo ${d.articuloNumeral}: "${d.hechos}". Observaciones del uniformado: "${observaciones}". Fundamento normativo: ${d.articuloNumeral} — "${d.descripcionConducta}" — conducta que hace parte de los comportamientos que ${d.bienJuridico}. Medidas correctivas previstas: ${d.medidasCorrectivas}. Frente a la medida correctiva accesoria, el ciudadano apeló: ${d.apeloSiNo}. ${d.solicitado} impugnó la orden dentro del término legal de tres (3) días hábiles, solicitando la programación de audiencia para ser oído(a) en descargos.`,
        ],
      },
      {
        titulo: 'AUDIENCIA',
        parrafos: [
          `En ${d.municipio}, en la fecha ${fResolucion}, el inspector se constituye en audiencia pública en aplicación del proceso verbal abreviado (art. 223, Ley 1801 de 2016), a fin de escuchar en descargos, practicar pruebas y decidir sobre la imposición de la medida correctiva de multa general tipo ${d.tipoMulta} a ${d.solicitado}.`,
        ],
      },
      {
        titulo: 'ARGUMENTOS Y/O DESCARGOS',
        parrafos: [
          `En aplicación del artículo 223 numeral 3 literal a), se concede la palabra a ${d.solicitado} — asistido por ${representante} — por un término máximo de veinte (20) minutos para exponer argumentos y pruebas. Resumen de lo manifestado: ${d.descargos}.`,
        ],
      },
      {
        titulo: 'PRUEBAS',
        parrafos: [
          `De conformidad con el artículo 223 numeral 3 literal c), si el presunto infractor o el quejoso solicitan la práctica de pruebas adicionales, pertinentes y conducentes, y la autoridad las considera viables o las requiere de oficio, se decretarán y practicarán en un término máximo de cinco (5) días hábiles; la audiencia se reanudará al día siguiente al del vencimiento de dicho término. El despacho considera conducentes, pertinentes y necesarias las pruebas relacionadas a continuación y las decreta.`,
          ...d.pruebasDecretadas.map((prueba) => `- ${prueba}`),
        ],
      },
    ],
    resuelve: [
      `PRIMERO: SUSPENDER la audiencia pública instalada dentro del asunto radicado con el consecutivo ${d.proceso}, adelantado en contra de ${d.solicitado}, identificado(a) con cédula de ciudadanía No. ${d.cedulaSolicitado}, por las razones expuestas.`,
      `SEGUNDO: DECRETAR y PRACTICAR las siguientes pruebas: ${d.pruebasDecretadas.join('; ')}.`,
      `TERCERO: INFORMAR que, de conformidad con lo dispuesto en el literal c) numeral 3 del artículo 223 de la Ley 1801 de 2016, la audiencia pública se reanudará el ${fReanudacion}, de lo cual se entiende notificado con la firma del presente documento.`,
      `CUARTO: NOTIFICAR EN ESTRADOS la presente decisión, de conformidad con lo dispuesto en el literal d) del numeral 3 del artículo 223 de la Ley 1801 de 2016. Contra la presente decisión procede el RECURSO DE REPOSICIÓN, el cual se concederá, sustentará y resolverá dentro de la misma audiencia.`,
      `QUINTO: Por secretaría háganse las citaciones y comunicaciones correspondientes.`,
    ],
    cierre: `Dada en ${d.municipio}, ${fResolucion}.`,
    firma: [
      { nombre: d.solicitado, rol: `C.C. Nro. ${d.cedulaSolicitado}`, tipo: 'notificado' },
      { nombre: d.inspectorNombre, rol: d.inspectorRol },
    ],
  };
}
