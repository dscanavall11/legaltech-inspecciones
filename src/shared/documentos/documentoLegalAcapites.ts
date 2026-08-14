import type { DocumentoLegal } from '@/derecho';
import type { Acapite } from './acapites';

/**
 * Puente entre la forma `DocumentoLegal` (autos/constancias/fallo del
 * comparendo, ver @/derecho/plantillas/documentoLegal.ts — tablaDatos,
 * secciones, resuelve, firma) y la vista genérica "por acápites" que usa
 * DocumentoEditorPage. Cada `seccion` es un acápite (id determinístico por
 * posición); el `resuelve` — cuando existe — se agrega como un acápite final
 * "Parte resolutiva". `tablaDatos`/`epigrafe`/`cierre`/`firma` quedan fuera:
 * son el encabezado y cierre fijos del documento, no prosa editable por
 * acápite (mismo criterio que el encabezado/firma de querellas/documento).
 */
const ID_RESUELVE = 'resuelve';

function idSeccion(indice: number): string {
  return `seccion-${indice}`;
}

function resumenDe(parrafos: string[]): string {
  const primero = parrafos[0] ?? '';
  return primero.length > 90 ? `${primero.slice(0, 87)}…` : primero;
}

/** Convierte un DocumentoLegal en la lista de acápites que edita/navega DocumentoEditorPage. */
export function documentoLegalAAcapites(doc: DocumentoLegal): Acapite[] {
  const deSecciones: Acapite[] = doc.secciones.map((seccion, i) => ({
    id: idSeccion(i),
    titulo: seccion.titulo ?? `Párrafo ${i + 1}`,
    resumen: resumenDe(seccion.parrafos),
    parrafos: seccion.parrafos,
    fuente: 'plantilla',
  }));

  if (doc.resuelve.length === 0) return deSecciones;

  return [
    ...deSecciones,
    {
      id: ID_RESUELVE,
      titulo: 'RESUELVE',
      resumen: resumenDe(doc.resuelve),
      parrafos: doc.resuelve,
      fuente: 'plantilla',
    },
  ];
}

/**
 * Inverso parcial: reconstruye un DocumentoLegal aplicando los acápites
 * (ya con las ediciones humanas resueltas, ver acapitesEdicion.ts) sobre las
 * secciones y el resuelve originales. Todo lo demás (tablaDatos, epigrafe,
 * cierre, firma) se conserva sin cambios — no son acápites editables.
 */
export function aplicarAcapitesADocumentoLegal(doc: DocumentoLegal, acapites: Acapite[]): DocumentoLegal {
  const porId = new Map(acapites.map((a) => [a.id, a]));
  const secciones = doc.secciones.map((seccion, i) => {
    const acapite = porId.get(idSeccion(i));
    return acapite ? { ...seccion, parrafos: acapite.parrafos } : seccion;
  });
  const resuelveAcapite = porId.get(ID_RESUELVE);
  const resuelve = resuelveAcapite ? resuelveAcapite.parrafos : doc.resuelve;
  return { ...doc, secciones, resuelve };
}

/**
 * Envuelve unos acápites sueltos en un `DocumentoLegal` mínimo. Es lo que
 * permite exportar a .docx cualquier pieza del editor —incluidas las de
 * querella y queja, que no nacen de un DocumentoLegal— sin escribir un
 * segundo generador de Word. El encabezado y la firma van vacíos a
 * propósito: en esas piezas los pone la plantilla del despacho, no el
 * sistema, y rellenarlos sería inventar datos.
 */
export function acapitesComoDocumentoLegal(opts: {
  titulo: string;
  entidad: string;
  radicado: string;
  acapites: Acapite[];
}): DocumentoLegal {
  return {
    entidad: opts.entidad,
    tituloDocumento: opts.titulo.toUpperCase(),
    proceso: opts.radicado,
    rotuloProceso: 'RADICADO N.º',
    fechaResolucionLetras: '',
    tablaDatos: [],
    secciones: opts.acapites.map((a) => ({ titulo: a.titulo, parrafos: a.parrafos })),
    resuelve: [],
    cierre: '',
    firma: [{ nombre: '', rol: 'Inspector(a) de Convivencia y Paz' }],
  };
}
