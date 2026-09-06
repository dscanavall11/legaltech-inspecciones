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

/** Ids de acápites editados por un humano (difieren del texto original generado) — marca permanente "Editado", sobrevive al guardado. */
export function acapitesModificados(acapites: Acapite[], ediciones: AcapitesEditados): string[] {
  return acapites.filter((a) => ediciones[a.id] !== undefined && ediciones[a.id] !== textoAcapite(a)).map((a) => a.id);
}

/**
 * Ids de acápites cuya edición en curso todavía no se persistió: compara
 * contra la última versión guardada en caseMetadata (o, si nunca se guardó
 * ese acápite, contra su texto original) — así abrir un editor sin escribir
 * nada no cuenta como "sin guardar" (el valor sembrado al abrir coincide con
 * el original), y se vacía justo después de un "Guardar cambios" exitoso —
 * a diferencia de `acapitesModificados`, que sigue marcando el acápite como
 * "Editado" indefinidamente porque difiere del texto generado.
 */
export function acapitesSinGuardar(acapites: Acapite[], ediciones: AcapitesEditados, edicionesGuardadas: AcapitesEditados): string[] {
  return acapites
    .filter((a) => {
      const actual = ediciones[a.id];
      if (actual === undefined) return false;
      const base = edicionesGuardadas[a.id] ?? textoAcapite(a);
      return actual !== base;
    })
    .map((a) => a.id);
}
