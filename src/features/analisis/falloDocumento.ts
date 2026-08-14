import { fechaALetras, type DocumentoLegal } from '@/derecho';
import type { LegalCase } from './api';

/** Campos redactados por la IA (ComplaintResponse) - editables por el inspector antes de firmar. */
export interface BorradorFallo {
  antecedents: string;
  juridicProblem: string;
  juridicFundamentals: string;
  juridicResponse: string;
  evidences: string;
  parteResolutiva: string;
}

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
export function construirDocumentoFallo(
  caso: LegalCase,
  borrador: BorradorFallo,
  despacho: DespachoFallo,
): DocumentoLegal {
  const querellante = nombrePorRol(caso, 'QUERELLANTE') !== 'No identificado'
    ? nombrePorRol(caso, 'QUERELLANTE')
    : nombrePorRol(caso, 'PLAINTIFF');
  const querellado = nombrePorRol(caso, 'QUERELLADO') !== 'No identificado'
    ? nombrePorRol(caso, 'QUERELLADO')
    : nombrePorRol(caso, 'DEFENDANT');

  return {
    entidad: (despacho.inspeccion || despacho.municipio || 'DESPACHO').toUpperCase(),
    tituloDocumento: caso.caseType ? `FALLO — ${caso.caseType.toUpperCase()}` : 'FALLO',
    proceso: caso.filingNumber ?? '',
    fechaResolucionLetras: fechaALetras(new Date().toISOString().slice(0, 10)),
    rotuloProceso: 'RADICADO',
    tablaDatos: [
      { etiqueta: 'RADICADO', valor: caso.filingNumber ?? '' },
      { etiqueta: 'QUERELLANTE', valor: querellante },
      { etiqueta: 'QUERELLADO', valor: querellado },
      { etiqueta: 'MUNICIPIO', valor: caso.venueCity ?? despacho.municipio ?? '' },
      { etiqueta: 'JUZGADO / INSPECCIÓN', valor: caso.judicialOfficeId || despacho.inspeccion || '' },
    ],
    secciones: [
      { titulo: 'ANTECEDENTES', parrafos: [borrador.antecedents] },
      { titulo: 'PROBLEMA JURÍDICO', parrafos: [borrador.juridicProblem] },
      { titulo: 'PRUEBAS VALORADAS', parrafos: [borrador.evidences] },
      { titulo: 'FUNDAMENTOS JURÍDICOS', parrafos: [borrador.juridicFundamentals] },
      { titulo: 'CONSIDERACIONES DEL DESPACHO', parrafos: [borrador.juridicResponse] },
      { titulo: 'PARTE RESOLUTIVA', parrafos: [borrador.parteResolutiva] },
    ].filter((s) => s.parrafos[0] && s.parrafos[0].trim().length > 0),
    resuelve: [],
    cierre: `${despacho.municipio || caso.venueCity || ''}, ${fechaALetras(new Date().toISOString().slice(0, 10))}.`,
    firma: [{ nombre: despacho.inspectorNombre, rol: despacho.inspectorCargo }],
  };
}
