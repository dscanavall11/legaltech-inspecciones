import { fechaALetras } from '../letras';
import {
  liquidarMulta,
  TIPOS_CONMUTACION_PERMITIDOS,
  type CausalIncremento,
  type TipoMulta,
} from '../multas';
import {
  incluirSi,
  parrafosReiteracion223A,
  TEXTO_NUMERALES_9_10_223A,
  type DocumentoLegal,
} from './documentoLegal';

/**
 * Plantilla del ACTA DE CONMUTACIÓN (art. 180 par., Ley 1801 de 2016). Mirror
 * de okf-bundles/roles-profesionales/inspector-policia/plantillas/acta-conmutacion.yaml
 * (pendienteValidacion: true — construida por paralelismo con acta-pronto-pago.yaml
 * a falta del Word/PDF original del despacho). Solo aplica a multas tipo 1 y 2
 * (`TIPOS_CONMUTACION_PERMITIDOS`); la UI debe restringir la selección de tipo
 * antes de llamar a este generador — aquí solo se documenta la restricción.
 */
export interface DatosActaConmutacion {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  proceso: string;
  fechaResolucion: string; // ISO
  comparendo: string;
  fechaComparendo: string; // ISO
  articuloNumeral: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono?: string; // fallback "NO APORTA"
  tipoMulta: TipoMulta; // debe ser 1 o 2 — ver TIPOS_CONMUTACION_PERMITIDOS
  causal: CausalIncremento;
  /** Justificación/evidencia (RNMC, BDME) que motiva la causal marcada — nunca se aplica sola. */
  causalEvidencia?: string;
  actividadAsignada: string; // p. ej. "Jornada pedagógica de convivencia ciudadana"
  entidadPrograma: string; // p. ej. "Secretaría de Gobierno Municipal — plataforma Sispaz"
  fechaLimiteActividad: string; // ISO — plazo para acreditar la participación
}

/** Construye el acta de conmutación a partir de los datos del comparendo. */
export function generarActaConmutacion(d: DatosActaConmutacion): DocumentoLegal {
  if (!TIPOS_CONMUTACION_PERMITIDOS.includes(d.tipoMulta)) {
    throw new Error(`La multa tipo ${d.tipoMulta} no es conmutable (art. 180 par.: solo tipos 1 y 2).`);
  }
  const liq = liquidarMulta(d.tipoMulta, d.causal);
  const fComparendo = fechaALetras(d.fechaComparendo);
  const fResolucion = fechaALetras(d.fechaResolucion);
  const fLimiteActividad = fechaALetras(d.fechaLimiteActividad);
  const telefono = d.telefono || 'NO APORTA';

  const resuelve: string[] = [
    `PRIMERO: DECLARAR LA FIRMEZA DE LA MULTA GENERAL TIPO ${d.tipoMulta}, impuesta a ${d.solicitado}, C.C. ${d.cedula}, mediante la orden de comparendo Nro. ${d.comparendo} de fecha ${fComparendo}; en consecuencia, CONCEDER la conmutación de dicha multa por la participación en ${d.actividadAsignada}, ante ${d.entidadPrograma}.`,
    `SEGUNDO: ADVERTIR a ${d.solicitado} que deberá acreditar la participación ante este despacho a más tardar el ${fLimiteActividad}; el incumplimiento dará lugar al cobro TOTAL de la multa (sin conmutación), conforme a ${liq.valorTotalLetras}, previa constancia de incumplimiento de actividad pedagógica.`,
    ...incluirSi(
      d.causal !== 'ninguna',
      `Conforme a la motivación de reincidencia expuesta, el valor de la multa se incrementó en un ${liq.porcentajeIncremento}%, incremento aplicable al valor de cobro señalado en el ordinal SEGUNDO si ${d.solicitado} incumple la actividad asignada.`,
    ),
    `TERCERO: Verificado el cumplimiento de la actividad, INGRESAR el reporte a la base de datos de la Policía Nacional (RNMC), en observancia del numeral 4 del artículo 223A de la Ley 1801 de 2016.`,
    `CUARTO: De no acreditarse la participación dentro del término, REMITIR las diligencias a la Secretaría de Hacienda Municipal – Unidad de Recursos Tributarios (Cobro Coactivo), para el cobro total de la multa.`,
  ];

  return {
    entidad: d.inspeccion.toUpperCase(),
    tituloDocumento: 'ACTA DE CONMUTACIÓN',
    proceso: d.proceso,
    fechaResolucionLetras: fResolucion,
    epigrafe:
      'POR MEDIO DE LA CUAL SE CONMUTA LA MEDIDA CORRECTIVA DE MULTA GENERAL POR PARTICIPACIÓN EN PROGRAMA COMUNITARIO O ACTIVIDAD PEDAGÓGICA DE CONVIVENCIA, EN APLICACIÓN DEL PARÁGRAFO DEL ARTÍCULO 180 DE LA LEY 1801 DE 2016, MODIFICADO POR EL ARTÍCULO 42 DE LA LEY 2197 DE 2022, Y DEL NUMERAL 3 DEL ARTÍCULO 223A DE LA LEY 1801 DE 2016, ADICIONADO POR EL ARTÍCULO 47 DE LA LEY 2197 DE 2022',
    tablaDatos: [
      { etiqueta: 'QUEJA', valor: d.proceso },
      { etiqueta: 'NÚMERO DE COMPARENDO', valor: d.comparendo },
      { etiqueta: 'COMPORTAMIENTO CONTRARIO', valor: `${d.articuloNumeral} del C.N.S.C.C.` },
      { etiqueta: 'FECHA DEL COMPARENDO', valor: fComparendo },
      { etiqueta: 'NOMBRE INFRACTOR', valor: d.solicitado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: d.cedula },
      { etiqueta: 'DIRECCIÓN INFRACTOR', valor: `${d.direccion}, ${d.municipio}.` },
      { etiqueta: 'TELÉFONO', valor: telefono },
      { etiqueta: 'TIPO DE MULTA', valor: `Multa General Tipo ${d.tipoMulta}` },
    ],
    secciones: [
      {
        parrafos: [
          `El suscrito Inspector Permanente de Convivencia y Paz del Municipio de ${d.municipio}, en ejercicio de las competencias previstas en la Ley 1801 de 2016, modificada por la Ley 2197 de 2022, procede a conceder la conmutación de la multa general tipo ${d.tipoMulta} señalada en la orden de comparendo Nro. ${d.comparendo}, restringida por ley a los tipos 1 y 2, con fundamento en los siguientes:`,
        ],
      },
      {
        titulo: 'ANTECEDENTES',
        parrafos: [
          `Se allega a este despacho la orden de comparendo Nro. ${d.comparendo}, de fecha ${fComparendo}, en contra del ciudadano ${d.solicitado}, identificado con cédula de ciudadanía No. ${d.cedula}, por el comportamiento contrario a la convivencia previsto en el ${d.articuloNumeral} de la Ley 1801 de 2016, con multa general tipo ${d.tipoMulta}.`,
          `Comparece ${d.solicitado} ante el despacho, dentro de los cinco (5) días hábiles siguientes a la imposición del comparendo, solicitando la conmutación de la multa por participación en programa comunitario o actividad pedagógica de convivencia, en lugar del pago en dinero.`,
        ],
      },
      {
        titulo: 'CONSIDERACIONES DEL DESPACHO',
        parrafos: [
          `Se verifica que ${d.solicitado} se presentó dentro del término del parágrafo del artículo 180 de la Ley 1801 de 2016 (cinco (5) días hábiles siguientes a la expedición del comparendo) y que la multa impuesta es tipo ${d.tipoMulta}, conmutable conforme al mismo parágrafo. Dicha solicitud constituye ACEPTACIÓN FICTA DE RESPONSABILIDAD (art. 223A núm. 3), lo que habilita al despacho a declarar la firmeza de la multa en el mismo acto y conceder la conmutación.`,
        ],
      },
      {
        titulo: 'CONSECUENCIAS EN LA REITERACIÓN EN EL COMPORTAMIENTO CONTRARIO A LA CONVIVENCIA',
        parrafos: [
          TEXTO_NUMERALES_9_10_223A,
          ...parrafosReiteracion223A({
            solicitado: d.solicitado,
            tipoMulta: d.tipoMulta,
            comparendo: d.comparendo,
            causal: d.causal,
            causalEvidencia: d.causalEvidencia,
          }),
        ],
      },
    ],
    resuelve,
    cierre: `${d.municipio}, ${fResolucion}.`,
    firma: [
      { nombre: d.solicitado, rol: `C.C. ${d.cedula}`, tipo: 'notificado' },
      { nombre: d.inspectorNombre, rol: d.inspectorRol },
    ],
  };
}
