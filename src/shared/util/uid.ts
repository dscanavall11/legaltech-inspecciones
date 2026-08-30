/**
 * UUID v4 que funciona tambien en contexto inseguro (http:// sobre un dominio
 * que no es localhost), donde `crypto.randomUUID` no esta disponible.
 * `crypto.getRandomValues` si existe en contexto inseguro, asi que se usa como
 * base y `randomUUID` solo como atajo cuando el contexto es seguro.
 */
export function uid(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();

  const bytes = c.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}
