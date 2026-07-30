import { fechaALetras } from '@/derecho';
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

export interface SeccionFallo {
  titulo: string;
  contenido: string;
}

export interface DocumentoFallo {
  entidad: string;
  tituloDocumento: string;
  radicado: string;
  fechaLetras: string;
  tablaDatos: { etiqueta: string; valor: string }[];
  secciones: SeccionFallo[];
  cierre: string;
  firma: { nombre: string; cargo: string };
}

function nombrePorRol(caso: LegalCase, rol: string): string {
  return (
    caso.parties?.find((p) => p.partyRole?.toUpperCase() === rol)?.fullName ?? 'No identificado'
  );
}

/** Arma la vista estructurada del fallo a partir del caso, el borrador de IA y el despacho. */
export function construirDocumentoFallo(
  caso: LegalCase,
  borrador: BorradorFallo,
  despacho: DespachoFallo,
): DocumentoFallo {
  const querellante = nombrePorRol(caso, 'QUERELLANTE') !== 'No identificado'
    ? nombrePorRol(caso, 'QUERELLANTE')
    : nombrePorRol(caso, 'PLAINTIFF');
  const querellado = nombrePorRol(caso, 'QUERELLADO') !== 'No identificado'
    ? nombrePorRol(caso, 'QUERELLADO')
    : nombrePorRol(caso, 'DEFENDANT');

  return {
    entidad: (despacho.inspeccion || despacho.municipio || 'DESPACHO').toUpperCase(),
    tituloDocumento: caso.caseType ? `FALLO — ${caso.caseType.toUpperCase()}` : 'FALLO',
    radicado: caso.filingNumber ?? '',
    fechaLetras: fechaALetras(new Date().toISOString().slice(0, 10)),
    tablaDatos: [
      { etiqueta: 'RADICADO', valor: caso.filingNumber ?? '' },
      { etiqueta: 'QUERELLANTE', valor: querellante },
      { etiqueta: 'QUERELLADO', valor: querellado },
      { etiqueta: 'MUNICIPIO', valor: caso.venueCity ?? despacho.municipio ?? '' },
      { etiqueta: 'JUZGADO / INSPECCIÓN', valor: caso.judicialOfficeId || despacho.inspeccion || '' },
    ],
    secciones: [
      { titulo: 'ANTECEDENTES', contenido: borrador.antecedents },
      { titulo: 'PROBLEMA JURÍDICO', contenido: borrador.juridicProblem },
      { titulo: 'PRUEBAS VALORADAS', contenido: borrador.evidences },
      { titulo: 'FUNDAMENTOS JURÍDICOS', contenido: borrador.juridicFundamentals },
      { titulo: 'CONSIDERACIONES DEL DESPACHO', contenido: borrador.juridicResponse },
      { titulo: 'PARTE RESOLUTIVA', contenido: borrador.parteResolutiva },
    ].filter((s) => s.contenido && s.contenido.trim().length > 0),
    cierre: `${despacho.municipio || caso.venueCity || ''}, ${fechaALetras(new Date().toISOString().slice(0, 10))}.`,
    firma: { nombre: despacho.inspectorNombre, cargo: despacho.inspectorCargo },
  };
}
