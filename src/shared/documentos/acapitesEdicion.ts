import type { Acapite } from './acapites';

/**
 * Ediciones humanas por acápite: id del acápite -> texto editado (los
 * párrafos originales, unidos por línea en blanco, tal como los ve/edita el
 * inspector en la TextArea). Es lo que se persiste en
 * caseMetadata.documentosEditados[documentoKey] (ver DocumentoEditorPage).
 */
export type AcapitesEditados = Record<string, string>;

/** Texto editable de un acápite: sus párrafos, unidos por línea en blanco. */
export function textoAcapite(acapite: Pick<Acapite, 'parrafos'>): string {
  return acapite.parrafos.join('\n\n');
}

/** Inverso de textoAcapite: separa el texto editado de vuelta en párrafos. */
export function parrafosDesdeTexto(texto: string): string[] {
  return texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Aplica las ediciones guardadas/en curso sobre los acápites originales:
 * cada acápite con una edición registrada reemplaza sus párrafos por los del
 * texto editado; los que no tienen edición quedan intactos. Pura y sin
 * dependencias de React para poder probarla directo (Task 18, deliverable 4).
 */
export function aplicarEdicionesAcapites(acapites: Acapite[], ediciones: AcapitesEditados): Acapite[] {
  return acapites.map((acapite) => {
    const editado = ediciones[acapite.id];
    return editado === undefined ? acapite : { ...acapite, parrafos: parrafosDesdeTexto(editado) };
  });
}

/** Ids de acápites cuya edición en curso difiere realmente del texto original (para el badge "N sin guardar"). */
export function acapitesModificados(acapites: Acapite[], ediciones: AcapitesEditados): string[] {
  return acapites.filter((a) => ediciones[a.id] !== undefined && ediciones[a.id] !== textoAcapite(a)).map((a) => a.id);
}
