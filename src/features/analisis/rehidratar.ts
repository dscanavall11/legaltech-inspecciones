import type { CaseParty } from './api';

/**
 * Devuelve los nombres y cédulas reales al texto que redactó el modelo.
 *
 * El expediente le llega seudonimizado —`[PARTE_1]`, `[ID_1]`— para que no vea
 * datos concretos, pero el fallo sí tiene que identificar a las partes: el art.
 * 2.2.8.18.7.1 lo exige. Esta función es la vuelta de ese viaje.
 *
 * **El orden tiene que ser el mismo que usó el backend** (`CasePseudonymizer`):
 * partes con nombre, ordenadas por id. Si aquí se indexara distinto,
 * `[PARTE_1]` se rehidrataría con el nombre de otra persona — y eso sale
 * impreso en un documento firmado.
 */
function partesOrdenadas(partes: readonly CaseParty[] | undefined): CaseParty[] {
  const conNombre = (partes ?? []).filter((p) => (p.fullName ?? '').trim().length > 0);

  // Sin id no se puede reproducir el orden del backend, y adivinarlo pondría el
  // nombre de otra persona en un fallo firmado. Se prefiere no rehidratar: un
  // [PARTE_1] visible en la vista previa se corrige; un nombre equivocado, no.
  if (conNombre.some((p) => !String(p.id ?? '').trim())) return [];

  return [...conNombre].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

/** `[PARTE_1]` → nombre real, `[ID_1]` → identificación real. */
export function mapaDeSeudonimos(partes: readonly CaseParty[] | undefined): Map<string, string> {
  const mapa = new Map<string, string>();
  partesOrdenadas(partes).forEach((parte, i) => {
    const n = i + 1;
    const nombre = (parte.fullName ?? '').trim();
    const identificacion = (parte.identificationNumber ?? '').trim();
    if (nombre) mapa.set(`[PARTE_${n}]`, nombre);
    if (identificacion) mapa.set(`[ID_${n}]`, identificacion);
  });
  return mapa;
}

/**
 * Sustituye los marcadores de un texto. Un marcador sin correspondencia **se
 * deja tal cual**: que se vea `[PARTE_3]` en la vista previa avisa de que falta
 * registrar una parte, y es mucho mejor que borrarlo y que el fallo salga
 * hablando de nadie.
 */
export function rehidratar(texto: string, mapa: Map<string, string>): string {
  return [...mapa.entries()].reduce(
    (acc, [marcador, valor]) => acc.split(marcador).join(valor),
    texto,
  );
}

/** Marcadores que quedaron sin rehidratar: se avisa antes de proferir, no después. */
export function seudonimosSinResolver(texto: string): string[] {
  return [...new Set(texto.match(/\[(?:PARTE|ID)_\d+\]/g) ?? [])];
}
