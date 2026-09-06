import { anioConCifra, fechaALetras } from '../letras';
import { liquidarMulta, VIGENCIA_MULTAS, type TipoMulta } from '../multas';
import { incluirSi, type DocumentoLegal, type SeccionDocumento } from './documentoLegal';

/**
 * Plantilla del FALLO del comparendo (audiencia de fallo, proceso verbal
 * abreviado, art. 223 núm. 3, Ley 1801 de 2016). Mirror de okf-bundles/
 * roles-profesionales/inspector-policia/plantillas/fallo-comparendo.yaml.
 * Sirve `emitir_fallo` (absuelve_unica, absuelve_continuacion,
 * sanciona_continuacion), `fallo_por_inasistencia` (inasistencia) y
 * `terminar_por_inactividad` (terminacion_inactividad).
 * Párrafos fijos transcritos y anonimizados de docs/superpowers/
 * plan-sources/despacho-audiencias/{fallo-absuelve-unica,
 * fallo-continuacion-sanciona,fallo-inasistencia,fallo-inactividad}.txt.
 * El esqueleto de secciones (antecedentes/competencia/problema jurídico/
 * descargos y pruebas/valoración/fundamentos de derecho/recursos) es común
 * a las cinco variantes, tal como lo define el YAML — solo cambian el
 * párrafo adicional de antecedentes, el resuelve y la firma.
 */
export type VarianteFallo =
  | 'absuelve_unica'
  | 'absuelve_continuacion'
  | 'sanciona_continuacion'
  | 'inasistencia'
  | 'terminacion_inactividad';

export interface DatosFalloComparendo {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  fechaResolucion: string; // ISO — fecha de la audiencia de fallo
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
  hechos: string; // resumen de los hechos citados del comparendo
  descripcionConducta: string; // literal del comportamiento, art./numeral
  bienJuridico: string;
  medidasCorrectivas: string;
  observaciones?: string; // fallback "NINGUNA"
  apeloSiNo: 'SI' | 'NO';
  representanteApoderado?: string; // fallback "actúa por sí mismo"
  tipoMulta: TipoMulta; // aplica a absuelve_* y sanciona_continuacion/inasistencia
  descargos?: string; // resumen de argumentos y pruebas anunciadas (no aplica a inasistencia/terminacion_inactividad)
  pruebasPracticadas: string[];
  variante: VarianteFallo;
  fechaAudienciaAnterior?: string; // ISO — audiencia previa (continuacion*, inasistencia)
  // ── solo absuelve_unica ──────────────────────────────────────────────────
  aplicaActividadPedagogica?: boolean;
  // ── solo sanciona_continuacion / inasistencia (usan el liquidador) ───────
  cuentaRecaudo?: string; // dato de oficina — nunca hardcodear
  titularCuenta?: string;
  nitTitular?: string;
  // ── solo terminacion_inactividad ──────────────────────────────────────────
  comparecioVoluntariamente?: boolean;
  terminoActividadPedagogica?: string; // p. ej. "dos (2) meses"
}

const EPIGRAFE_BASE =
  'AUDIENCIA PÚBLICA EN LA CUAL SE DECIDE SOBRE LA IMPOSICIÓN DE MEDIDA CORRECTIVA EN APLICACIÓN DEL PROCESO VERBAL ABREVIADO — ART. 223 NÚM. 3, LEY 1801 DE 2016';

function epigrafePorVariante(variante: VarianteFallo): string {
  switch (variante) {
    case 'absuelve_continuacion':
    case 'sanciona_continuacion':
      return `CONTINUACIÓN DE ${EPIGRAFE_BASE}`;
    case 'terminacion_inactividad':
      return 'POR MEDIO DE LA CUAL SE DECIDE SOBRE LA TERMINACIÓN DEL PROCESO POR INACTIVIDAD — ART. 2.2.8.18.9.4, DECRETO 768 DE 2025';
    case 'absuelve_unica':
    case 'inasistencia':
    default:
      return EPIGRAFE_BASE;
  }
}

/** Bloque variable de antecedentes: reseña de la audiencia previa según la variante. */
function antecedentesAdicional(d: DatosFalloComparendo): string {
  const fAudienciaAnterior = d.fechaAudienciaAnterior ? fechaALetras(d.fechaAudienciaAnterior) : '';
  const fResolucion = fechaALetras(d.fechaResolucion);
  switch (d.variante) {
    case 'absuelve_continuacion':
    case 'sanciona_continuacion':
      return `Se deja constancia de que, en audiencia celebrada el ${fAudienciaAnterior}, ${d.solicitado} rindió sus descargos y solicitó la práctica de pruebas, actuaciones consignadas en el auto que decretó pruebas y suspendió la audiencia, cuyo contenido forma parte integral del expediente y es objeto de valoración en esta decisión.`;
    case 'inasistencia':
      return `La audiencia inicialmente programada debió suspenderse por la inasistencia de ${d.solicitado} (constancia de inasistencia, auto de fecha ${fAudienciaAnterior}); de conformidad con la Sentencia C-349 de 2017, se suspendió el trámite por tres (3) días hábiles para que aportara prueba siquiera sumaria de justa causa. Vencido dicho término sin justificación válida, el despacho reanuda el trámite y se constituye en audiencia en la fecha ${fResolucion}.`;
    case 'terminacion_inactividad':
      return `Entre la fecha de los hechos (${fechaALetras(d.fechaComparendo)}) y la fecha de esta actuación (${fResolucion}) ha transcurrido un término superior a un (1) año sin que se hubiere adoptado decisión de fondo dentro del expediente derivado de la Orden de Comparendo No. ${d.comparendo}.`;
    case 'absuelve_unica':
    default:
      return 'Ninguno — audiencia única, sin suspensión previa.';
  }
}

function seccionAntecedentes(d: DatosFalloComparendo): SeccionDocumento {
  const fComparendo = fechaALetras(d.fechaComparendo);
  return {
    titulo: 'ANTECEDENTES',
    parrafos: [
      `Llegada de la Orden de Comparendo ${d.comparendo}, de fecha ${fComparendo}, radicada mediante queja ${d.proceso}, impuesta por ${d.solicitante} en contra de ${d.solicitado}, hallado(a) incurriendo en el comportamiento descrito bajo ${d.articuloNumeral}: "${d.hechos}". Fundamento normativo: ${d.articuloNumeral} — "${d.descripcionConducta}" — conducta que hace parte de los comportamientos que ${d.bienJuridico}. Medidas correctivas previstas: ${d.medidasCorrectivas}. Frente a la medida correctiva accesoria, el ciudadano apeló: ${d.apeloSiNo}. ${d.solicitado} impugnó la orden dentro del término legal de tres (3) días hábiles, solicitando la programación de audiencia para ser oído(a) en descargos; este despacho avocó conocimiento y programó la audiencia.`,
      antecedentesAdicional(d),
    ],
  };
}

function seccionCompetencia(): SeccionDocumento {
  return {
    titulo: 'COMPETENCIA',
    parrafos: [
      'El Inspector de Convivencia y Paz es la autoridad de policía competente para conocer, tramitar y decidir en primera instancia sobre este asunto, de conformidad con las atribuciones conferidas por el artículo 206 (numeral 2 y numeral 6, literal h) de la Ley 1801 de 2016, que otorga competencia expresa para conocer de los comportamientos contrarios a la convivencia y para la aplicación de la medida correctiva de multas. La actuación se adelanta bajo las reglas del proceso verbal abreviado (art. 223), dando cumplimiento a los parámetros del Decreto 768 de 2025.',
    ],
  };
}

function seccionProblemaJuridico(d: DatosFalloComparendo): SeccionDocumento {
  const parrafos = [
    `Corresponde al despacho determinar si ${d.solicitado}, identificado(a) con C.C. No. ${d.cedulaSolicitado}, incurrió en el comportamiento contrario a la convivencia previsto en ${d.articuloNumeral}, con ocasión de los hechos ocurridos el ${fechaALetras(d.fechaComparendo)}, y en consecuencia si resulta procedente confirmar la medida correctiva de Multa General Tipo ${d.tipoMulta}. De igual manera, corresponde determinar si al expedir el comparendo el personal uniformado aplicó de forma suficiente y motivada los criterios de dosificación del artículo 223A literal a) de la Ley 1801 de 2016 y desarrollados por el Decreto 768 de 2025 — en especial los principios de necesidad, razonabilidad y proporcionalidad (art. 8 numerales 13 y 14) — atendiendo modo, tiempo y lugar, la entidad del riesgo para la convivencia y las particularidades del comportamiento atribuido. Este examen no es una etapa formal ni implica que la multa deba imponerse de manera automática: solo procede cuando los mecanismos de protección, restauración, educación o prevención (Decreto 768/2025, arts. 2.2.8.18.2.1 y 2.2.8.18.2.2) resulten ineficaces para restablecer la convivencia (art. 2.2.8.18.7.2, contenido mínimo de la decisión que pone fin al proceso).`,
  ];
  if (d.variante === 'inasistencia') {
    parrafos.push(
      'Ante la inasistencia sin justa causa acreditada, se aplica la presunción de veracidad del parágrafo 1 del artículo 223 de la Ley 1801 de 2016 (Sentencia C-349/2017): se tienen por ciertos los hechos que dieron lugar al comportamiento contrario a la convivencia y el despacho resuelve de fondo con base en las pruebas allegadas y los informes de las autoridades, salvo que se considere indispensable decretar una prueba adicional.',
    );
  }
  return { titulo: 'PROBLEMA JURÍDICO', parrafos };
}

/** Omitida en terminacion_inactividad (no hay audiencia de descargos); texto sustituido en inasistencia. */
function seccionDescargosPruebas(d: DatosFalloComparendo): SeccionDocumento | null {
  if (d.variante === 'terminacion_inactividad') return null;
  if (d.variante === 'inasistencia') {
    return {
      titulo: 'ARGUMENTOS Y/O DESCARGOS — PRUEBAS',
      parrafos: [
        'No hay descargos por inasistencia del presunto infractor. Pruebas: únicamente la Orden de Comparendo y los informes de la autoridad que la impuso, valorados bajo la presunción de veracidad.',
      ],
    };
  }
  const representante = d.representanteApoderado || 'actúa por sí mismo';
  return {
    titulo: 'ARGUMENTOS Y/O DESCARGOS — PRUEBAS',
    parrafos: [
      `En aplicación del artículo 223 numeral 3 literal a), se concede la palabra a ${d.solicitado} — asistido por ${representante} — por un término máximo de veinte (20) minutos para exponer argumentos y pruebas. Resumen de lo manifestado: ${d.descargos || ''}.`,
      `Pruebas incorporadas y practicadas, objeto de valoración individual y conjunta:`,
      ...d.pruebasPracticadas.map((prueba) => `- ${prueba}`),
    ],
  };
}

function seccionValoracion(): SeccionDocumento {
  return {
    titulo: 'ANÁLISIS CRÍTICO O VALORACIÓN PROBATORIA',
    parrafos: [
      'La valoración probatoria se realiza conforme a las reglas de la sana crítica, esto es, atendiendo la experiencia y las leyes de la lógica. La orden de comparendo y el informe del uniformado constituyen medios de conocimiento relevantes, pero no tienen valor automático o incontrovertible; corresponde al despacho determinar qué hechos acreditan directamente, cuáles son inferencias del agente y si resisten la confrontación con los descargos y las demás pruebas practicadas.',
    ],
  };
}

function seccionFundamentosDeDerecho(): SeccionDocumento {
  return {
    titulo: 'FUNDAMENTOS DE DERECHO',
    parrafos: [
      'La Ley 1801 de 2016, en su objeto, señala que sus disposiciones son de carácter preventivo y buscan establecer las condiciones para la convivencia en el territorio nacional, propiciando el cumplimiento de los deberes y obligaciones de las personas naturales y jurídicas, así como determinando el ejercicio del poder, la función y la actividad de Policía, de conformidad con la Constitución Política y el ordenamiento jurídico vigente.',
      'El artículo 218 de la Ley 1801 de 2016 dispone que la Orden de Comparendo es la acción del personal uniformado de la Policía Nacional que consiste en entregar un documento oficial que contiene orden escrita o virtual para presentarse ante autoridad de policía.',
      'El artículo 150 de la Ley 1801 de 2016 establece que la orden de Policía es un mandato claro, preciso y conciso, de obligatorio cumplimiento, dirigido a prevenir o superar comportamientos o hechos contrarios a la convivencia, o a restablecerla.',
      'El artículo 223A literal a) de la Ley 1801 de 2016, junto con los numerales 13 y 14 del artículo 8, exige que tanto al expedir el comparendo como al decidir sobre la aplicación de una multa general se observen los principios de necesidad, razonabilidad y proporcionalidad frente al bien jurídico tutelado, excluyendo una respuesta mecánica basada únicamente en la constatación formal del comportamiento.',
      'El Decreto 768 de 2025, en sus artículos 2.2.8.18.2.1, 2.2.8.18.2.2 y 2.2.8.18.7.2, desarrolla los principios de progresividad, eficacia e idoneidad del proceso único de Policía, precisando que su naturaleza no es sancionatoria y que las medidas correctivas solo proceden cuando los mecanismos de protección, restauración, educación o prevención resulten ineficaces para restablecer la convivencia.',
    ],
  };
}

function seccionRecursos(d: DatosFalloComparendo): SeccionDocumento {
  return {
    titulo: 'RECURSOS',
    parrafos: [
      `Se deja constancia de que a ${d.solicitado} se le informa que contra la presente decisión proceden los recursos de reposición y, en subsidio, el de apelación, de conformidad con los artículos 222 y 223 de la Ley 1801 de 2016, los cuales deberán interponerse, solicitarse y sustentarse de manera verbal dentro de la misma audiencia.`,
    ],
  };
}

function resuelvePorVariante(d: DatosFalloComparendo): string[] {
  switch (d.variante) {
    case 'absuelve_unica':
      return [
        `PRIMERO: ABSTENERSE de imponer la medida correctiva de Multa General Tipo ${d.tipoMulta} a ${d.solicitado}, identificado(a) con cédula de ciudadanía No. ${d.cedulaSolicitado}, respecto de la Orden de Comparendo No. ${d.comparendo}, por los fundamentos antes expuestos.`,
        `SEGUNDO: ${d.solicitado} queda notificado(a) en estrados; contra esta decisión proceden los recursos de reposición y, en subsidio, el de apelación ante el superior jerárquico, los cuales se solicitarán, concederán y sustentarán dentro de la misma audiencia. ${d.solicitado} manifestó no hacer uso del recurso, por lo cual la presente decisión queda en firme.`,
        ...incluirSi(
          Boolean(d.aplicaActividadPedagogica),
          `TERCERO: APLICAR a ${d.solicitado} la medida correctiva de participación en programa comunitario o actividad pedagógica de convivencia, en reemplazo de la Multa General Tipo ${d.tipoMulta}, atendiendo las circunstancias particulares en que ocurrieron los hechos y como respuesta preventiva, educativa, razonable y proporcional.`,
        ),
        `CUARTO: INGRESAR la presente decisión en el Registro Nacional de Medidas Correctivas (RNMC), con el fin de actualizar el estado de la actuación y dejar constancia de que no se impuso la Multa General Tipo ${d.tipoMulta} de competencia de esta Inspección (art. 172 par. 2, Ley 1801 de 2016).`,
      ];

    case 'absuelve_continuacion':
      return [
        `PRIMERO: ABSTENERSE de imponer la medida correctiva de Multa General Tipo ${d.tipoMulta}, notificada mediante la Orden de Comparendo No. ${d.comparendo} de fecha ${fechaALetras(d.fechaComparendo)}.`,
        `SEGUNDO: ${d.solicitado} queda notificado(a) en estrados; contra esta decisión proceden los recursos de reposición y, en subsidio, el de apelación ante el superior jerárquico, los cuales se solicitarán, concederán y sustentarán dentro de la misma audiencia. Ante la no interposición del recurso, la presente Resolución queda en firme.`,
        `TERCERO: INGRÉSESE la presente decisión a la base de datos de la Policía Nacional (RNMC), a fin de actualizar dicha plataforma.`,
      ];

    case 'sanciona_continuacion':
    case 'inasistencia': {
      const liq = liquidarMulta(d.tipoMulta);
      const anio = anioConCifra(VIGENCIA_MULTAS);
      const pago = `${liq.smdlvLetras} salarios mínimos diarios legales vigentes (SMDLV) para el año ${anio}, es decir, la suma de ${liq.valorBaseLetras}, ordenando su pago en la cuenta ${d.cuentaRecaudo}, cuyo titular es ${d.titularCuenta}, identificado con NIT ${d.nitTitular}`;
      const base = [
        `PRIMERO: DECLARAR probado el carácter de infractor por parte de ${d.solicitado}, identificado(a) con C.C. No. ${d.cedulaSolicitado}, por el comportamiento contrario a la convivencia descrito en ${d.articuloNumeral}.`,
        `SEGUNDO: IMPONER la medida correctiva consistente en MULTA GENERAL TIPO ${d.tipoMulta} a favor del tesoro municipal, por una suma equivalente a ${pago}.`,
        `TERCERO: INGRÉSESE la presente medida correctiva a la base de datos de la Policía Nacional, en cumplimiento del artículo 172 parágrafo 2 de la Ley 1801 de 2016.`,
        `CUARTO: De no darse cumplimiento al pago de la multa en los plazos estipulados en el artículo 182 de la Ley 1801 de 2016, REMITIR las diligencias a la Unidad de Recursos Tributarios para lo de su competencia.`,
        `QUINTO: ${d.solicitado} queda notificado(a) en estrados.`,
      ];
      return d.variante === 'inasistencia'
        ? [
            ...base,
            `SEXTO: Contra esta decisión proceden los recursos de reposición y, en subsidio, el de apelación ante el superior jerárquico, los cuales se solicitarán, concederán y sustentarán dentro de la misma audiencia; ante la no comparecencia de ${d.solicitado}, la presente Resolución queda en firme.`,
            `SÉPTIMO: El presente acto administrativo presta mérito ejecutivo, al ser claro, expreso y exigible.`,
          ]
        : [
            ...base,
            `SEXTO: Contra esta decisión proceden los recursos de reposición y, en subsidio, el de apelación ante el superior jerárquico, los cuales se solicitarán, concederán y sustentarán dentro de la misma audiencia.`,
            `SÉPTIMO: El presente acto administrativo presta mérito ejecutivo, al ser claro, expreso y exigible.`,
          ];
    }

    case 'terminacion_inactividad':
    default: {
      if (d.comparecioVoluntariamente) {
        return [
          `PRIMERO: EJERCER EL CONTROL DE LEGALIDAD del procedimiento contenido en la Orden de Comparendo No. ${d.comparendo}, en atención al tiempo transcurrido desde los hechos y a la comparecencia voluntaria de ${d.solicitado}, de conformidad con el artículo 2.2.8.18.5.5 del Decreto 768 de 2025.`,
          `SEGUNDO: ABSTENERSE de imponer y ratificar la medida correctiva de Multa General Tipo ${d.tipoMulta} señalada inicialmente por el personal uniformado, y en su lugar SUSTITUIRLA por la medida correctiva de PARTICIPACIÓN EN PROGRAMA COMUNITARIO O ACTIVIDAD PEDAGÓGICA DE CONVIVENCIA a favor de ${d.solicitado}, identificado(a) con C.C. No. ${d.cedulaSolicitado}, por las razones expuestas (desproporción de imponer, años después, una multa por hechos ya distantes; principios de proporcionalidad, razonabilidad y necesidad — art. 223A lit. a); Decreto 768/2025 arts. 2.2.8.18.2.1 par. 1 y 2.2.8.18.5.5).`,
          `TERCERO: OTORGAR a ${d.solicitado} un término no superior a ${d.terminoActividadPedagogica}, contado a partir de hoy, para que acredite la asistencia y cumplimiento de la respectiva actividad pedagógica. Se advierte que, de incumplir por causas atribuibles exclusivamente a ${d.solicitado}, se restaurará de inmediato el cobro de la multa pecuniaria conmutada (art. 2.2.8.18.7.6, Decreto 768 de 2025).`,
          `CUARTO: la presente decisión queda notificada en estrados de manera presencial a ${d.solicitado}; contra la misma proceden los recursos de reposición y, en subsidio, el de apelación ante el superior jerárquico, los cuales deben interponerse y sustentarse en esta misma audiencia.`,
          `QUINTO: DISPONER la actualización inmediata del estado de la medida en el Registro Nacional de Medidas Correctivas (RNMC). Una vez acreditada la asistencia a la actividad pedagógica, procédase con el archivo definitivo del expediente.`,
        ];
      }
      return [
        `PRIMERO: DECLARAR LA TERMINACIÓN del proceso adelantado con ocasión de la Orden de Comparendo No. ${d.comparendo} contra ${d.solicitado}, por inactividad superior a un (1) año sin decisión de fondo, de conformidad con el artículo 2.2.8.18.9.4 del Decreto 768 de 2025.`,
        `SEGUNDO: ORDENAR EL ARCHIVO definitivo del expediente.`,
      ];
    }
  }
}

function firmaPorVariante(d: DatosFalloComparendo) {
  const inspector = { nombre: d.inspectorNombre, rol: d.inspectorRol };
  const notificado = { nombre: d.solicitado, rol: `C.C. Nro. ${d.cedulaSolicitado}`, tipo: 'notificado' as const };
  if (d.variante === 'inasistencia') return [inspector]; // no compareció — sin firma del solicitado
  if (d.variante === 'terminacion_inactividad') {
    return [...incluirSi(Boolean(d.comparecioVoluntariamente), notificado), inspector];
  }
  return [notificado, inspector];
}

/** Construye el fallo del comparendo según la variante del desenlace. */
export function generarFalloComparendo(d: DatosFalloComparendo): DocumentoLegal {
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const telefono = d.telefonoSolicitado || 'NO APORTA';

  const secciones: SeccionDocumento[] = [
    seccionAntecedentes(d),
    seccionCompetencia(),
    seccionProblemaJuridico(d),
    seccionDescargosPruebas(d),
    seccionValoracion(),
    seccionFundamentosDeDerecho(),
    seccionRecursos(d),
  ].filter((s): s is SeccionDocumento => s !== null);

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'AUDIENCIA DE FALLO',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe: epigrafePorVariante(d.variante),
    tablaDatos: [
      { etiqueta: 'No QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'COMPORTAMIENTO CONTRARIO', valor: `${d.articuloNumeral} del C.N.S.C.C.` },
      { etiqueta: 'FECHA Y HORA', valor: fComparendo },
      { etiqueta: 'LUGAR DEL COMPORTAMIENTO', valor: d.lugarComportamiento },
      { etiqueta: 'NOMBRE PRESUNTO INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedulaSolicitado },
      { etiqueta: 'DIRECCIÓN PRESUNTO INFRACTOR', valor: `${d.direccionSolicitado}. Teléfono ${telefono}.` },
      { etiqueta: 'PROCEDENCIA', valor: d.solicitante },
    ],
    secciones,
    resuelve: resuelvePorVariante(d),
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: firmaPorVariante(d),
  };
}
