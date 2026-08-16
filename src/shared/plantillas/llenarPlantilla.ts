import type { DocumentoLegal } from '@/derecho';
import type { StructuredTemplate } from './tipos';

export type Slots = Record<string, string>;

/** `{clave}` y `{clave | MAYÚSCULAS}`. Un slot sin valor se deja tal cual: se ve el hueco. */
function sustituir(texto: string, slots: Slots): string {
  return texto.replace(/\{(\w+)(\s*\|\s*MAYÚSCULAS)?\}/g, (original, clave: string, mayusculas?: string) => {
    const valor = slots[clave];
    if (valor === undefined || valor.trim().length === 0) return original;
    return mayusculas ? valor.toUpperCase() : valor;
  });
}

export type CuerpoPlantilla = Pick<
  DocumentoLegal,
  'entidad' | 'tituloDocumento' | 'epigrafe' | 'secciones' | 'resuelve'
>;

// Entra en inglés (StructuredTemplate, contrato nuevo del API) y sale en español
// (DocumentoLegal, contrato que ya existe y que renderizan el PDF y el DOCX). La
// frontera de traducción es esta función, y solo esta.
export function llenarPlantilla(plantilla: StructuredTemplate, slots: Slots): CuerpoPlantilla {
  return {
    entidad: sustituir(plantilla.header.entity, slots),
    tituloDocumento: sustituir(plantilla.header.title, slots),
    epigrafe: sustituir(plantilla.header.epigraph, slots),
    secciones: plantilla.sections.map((s) => ({
      titulo: sustituir(s.title, slots),
      parrafos: [sustituir(s.content, slots)],
    })),
    resuelve: plantilla.commonOperativeClauses.map((o) => sustituir(o, slots)),
  };
}

/** Los slots que la plantilla declara y el caso todavía no puede llenar. */
export function slotsFaltantes(plantilla: StructuredTemplate, slots: Slots): string[] {
  return plantilla.slots.filter((s) => (slots[s] ?? '').trim().length === 0);
}
