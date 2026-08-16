import { fechaALetras, type DocumentoLegal } from '@/derecho';
import type { LegalCase } from './api';
import type { DatosFallo } from './datosFallo';
import { leerPartes, rotuloParte } from '@/features/querellas/partes';
import {
  DECISION_VACIA,
  SENTIDOS,
  VARIANTES,
  type DecisionQuerella,
} from '@/features/querellas/decisionQuerella';

/**
 * Los nueve apartes mínimos del artículo 2.2.8.18.7.1 del Decreto 768 de 2025
 * — el contenido obligatorio de la decisión del proceso verbal abreviado —,
 * declarados en el orden en que el decreto los enumera. La IA los redacta y el
 * inspector los edita antes de firmar.
 */
export interface BorradorFallo {
  /** 1. Competencia */
  competencia: string;
  /** 2. Hechos en orden cronológico (sin argumentaciones ni apreciaciones subjetivas) */
  antecedents: string;
  /** 3. Trámite desarrollado */
  tramite: string;
  /** 4. Problema jurídico — el motivo de policía como pregunta asertiva */
  juridicProblem: string;
  /** 5. Análisis crítico o valoración probatoria */
  evidences: string;
  /**
   * Aparte adicional del despacho, no listado en los nueve del art.
   * 2.2.8.18.7.1 pero exigido por los arts. 2.2.8.18.2.1 y 2.2.8.18.2.2: la
   * multa es la última opción y el proceso no es sancionatorio. Aparece en las
   * cuatro plantillas reales del despacho, siempre entre la valoración
   * probatoria y la respuesta al problema jurídico.
   */
  necesidadProporcionalidad: string;
  /** 6. Respuesta al problema jurídico — el sentido de la decisión */
  juridicResponse: string;
  /** 7. Fundamentos de derecho */
  juridicFundamentals: string;
  /** 8. Decisión del caso */
  parteResolutiva: string;
  /** 9. Recursos que proceden y oportunidad para interponerlos */
  recursos: string;
}

/** Títulos de los apartes, tal como los nombra el decreto y como salen impresos. */
export interface AparteFallo {
  campo: keyof BorradorFallo;
  titulo: string;
  /** false = lo exige el despacho por los principios, no la lista del art. 2.2.8.18.7.1. */
  delDecreto7_1: boolean;
}

export const APARTES_FALLO: AparteFallo[] = [
  { campo: 'competencia', titulo: 'COMPETENCIA', delDecreto7_1: true },
  { campo: 'antecedents', titulo: 'HECHOS', delDecreto7_1: true },
  { campo: 'tramite', titulo: 'TRÁMITE DESARROLLADO', delDecreto7_1: true },
  { campo: 'juridicProblem', titulo: 'PROBLEMA JURÍDICO', delDecreto7_1: true },
  { campo: 'evidences', titulo: 'ANÁLISIS CRÍTICO Y VALORACIÓN PROBATORIA', delDecreto7_1: true },
  {
    campo: 'necesidadProporcionalidad',
    titulo: 'ANÁLISIS DE NECESIDAD, RAZONABILIDAD Y PROPORCIONALIDAD',
    delDecreto7_1: false,
  },
  { campo: 'juridicResponse', titulo: 'RESPUESTA AL PROBLEMA JURÍDICO', delDecreto7_1: true },
  { campo: 'juridicFundamentals', titulo: 'FUNDAMENTOS DE DERECHO', delDecreto7_1: true },
  { campo: 'parteResolutiva', titulo: 'DECISIÓN DEL CASO', delDecreto7_1: true },
  { campo: 'recursos', titulo: 'RECURSOS', delDecreto7_1: true },
];

export interface DespachoFallo {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorCargo: string;
}


function nombrePorRol(caso: LegalCase, rol: string): string {
  return (
    caso.parties?.find((p) => p.partyRole?.toUpperCase() === rol)?.fullName ?? 'No identificado'
  );
}

/**
 * Arma la vista estructurada del fallo a partir del caso, el borrador de IA y
 * el despacho. Devuelve un `DocumentoLegal` — la forma única que renderizan
 * documentoLegalPdf.ts y documentoLegalDocx.ts — en vez de una forma propia
 * con su propio renderer.
 */
/**
 * Apartes del art. 2.2.8.18.7.1 que el borrador todavía no cubre. El decreto
 * los exige como mínimo, así que un fallo al que le falte alguno está
 * incompleto — se advierte antes de proferir, no después.
 */
/**
 * El título distingue la audiencia única de la continuación: son dos
 * documentos distintos en el archivo del despacho, aunque compartan esqueleto.
 */
function tituloFallo(decision: DecisionQuerella): string {
  return decision.variante === 'continuacion'
    ? 'FALLO — CONTINUACIÓN DE AUDIENCIA'
    : 'FALLO — AUDIENCIA ÚNICA';
}

/** Epígrafe: anuncia el sentido y la norma que rige la diligencia. */
function epigrafeFallo(decision: DecisionQuerella): string {
  const porSentido: Record<DecisionQuerella['sentido'], string> = {
    absuelve: 'POR MEDIO DEL CUAL SE RESUELVE UNA QUERELLA Y SE ABSUELVE',
    responsable_sin_multa:
      'POR MEDIO DEL CUAL SE RESUELVE UNA QUERELLA, SE DECLARA LA RESPONSABILIDAD Y SE ABSTIENE DE IMPONER MULTA',
    sanciona:
      'POR MEDIO DEL CUAL SE RESUELVE UNA QUERELLA Y SE IMPONE MEDIDA CORRECTIVA',
  };
  return `${porSentido[decision.sentido]}, EN APLICACIÓN DEL PROCESO VERBAL ABREVIADO — ART. 223 DE LA LEY 1801 DE 2016`;
}

/** Etiqueta legible de la variante y el sentido, para la tabla de datos. */
function rotuloDecision(decision: DecisionQuerella): { audiencia: string; sentido: string } {
  return {
    audiencia: VARIANTES.find((v) => v.valor === decision.variante)?.label ?? '',
    sentido: SENTIDOS.find((s) => s.valor === decision.sentido)?.label ?? '',
  };
}

export function apartesFaltantes(borrador: BorradorFallo): string[] {
  return APARTES_FALLO.filter(({ campo }) => borrador[campo].trim().length === 0).map(
    ({ titulo }) => titulo,
  );
}

export function construirDocumentoFallo(
  caso: LegalCase,
  borrador: BorradorFallo,
  despacho: DespachoFallo,
  datosFallo: DatosFallo,
  decision: DecisionQuerella = DECISION_VACIA,
): DocumentoLegal {
  // El número y la fecha los fija el inspector (ver datosFallo.ts). Mientras
  // no los diligencie, el encabezado cae al radicado del caso — nunca se
  // inventa un número de fallo.
  const numero = datosFallo.numeroFallo.trim() || caso.filingNumber || '';
  const fechaLetras = fechaALetras(datosFallo.fechaFallo);
  // Los dos sujetos procesales de la querella (Decreto 768, art. 2.2.8.18.3.3).
  // Priman los datos que el inspector diligenció en la pestaña Partes, porque
  // traen identificación y calidad; case_parties es el respaldo.
  const partes = leerPartes(caso.caseMetadata);
  const querellante =
    partes.querellante.nombre.trim().length > 0
      ? rotuloParte(partes.querellante)
      : nombrePorRol(caso, 'QUERELLANTE') !== 'No identificado'
        ? nombrePorRol(caso, 'QUERELLANTE')
        : nombrePorRol(caso, 'PLAINTIFF');
  const querellado =
    partes.querellado.nombre.trim().length > 0
      ? rotuloParte(partes.querellado)
      : nombrePorRol(caso, 'QUERELLADO') !== 'No identificado'
        ? nombrePorRol(caso, 'QUERELLADO')
        : nombrePorRol(caso, 'DEFENDANT');

  return {
    entidad: (despacho.inspeccion || despacho.municipio || 'DESPACHO').toUpperCase(),
    tituloDocumento: tituloFallo(decision),
    epigrafe: epigrafeFallo(decision),
    proceso: numero,
    fechaResolucionLetras: fechaLetras,
    rotuloProceso: 'FALLO No.',
    tablaDatos: [
      { etiqueta: 'FALLO No.', valor: numero },
      { etiqueta: 'RADICADO', valor: caso.filingNumber ?? '' },
      { etiqueta: 'QUERELLANTE', valor: querellante },
      ...(partes.calidadQuerellante.trim()
        ? [{ etiqueta: 'CALIDAD EN QUE ACTÚA', valor: partes.calidadQuerellante.trim() }]
        : []),
      { etiqueta: 'QUERELLADO', valor: querellado },
      ...(partes.inmuebleDireccion.trim()
        ? [{ etiqueta: 'INMUEBLE', valor: partes.inmuebleDireccion.trim() }]
        : []),
      ...(partes.matriculaInmobiliaria.trim()
        ? [{ etiqueta: 'MATRÍCULA INMOBILIARIA', valor: partes.matriculaInmobiliaria.trim() }]
        : []),
      { etiqueta: 'AUDIENCIA', valor: rotuloDecision(decision).audiencia },
      { etiqueta: 'MUNICIPIO', valor: caso.venueCity ?? despacho.municipio ?? '' },
      { etiqueta: 'JUZGADO / INSPECCIÓN', valor: caso.judicialOfficeId || despacho.inspeccion || '' },
    ],
    // Los nueve apartes del decreto, en su orden. Un aparte que el borrador
    // todavía no tiene no se imprime vacío: se omite y el control previo al
    // fallo lo reporta como faltante (ver apartesFaltantes).
    secciones: APARTES_FALLO.map(({ campo, titulo }) => ({
      titulo,
      parrafos: [borrador[campo]],
    })).filter((s) => s.parrafos[0] && s.parrafos[0].trim().length > 0),
    resuelve: [],
    cierre: `${despacho.municipio || caso.venueCity || ''}, ${fechaLetras}.`,
    firma: [{ nombre: despacho.inspectorNombre, rol: despacho.inspectorCargo }],
  };
}
