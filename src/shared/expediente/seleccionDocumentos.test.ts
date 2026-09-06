import { describe, expect, it } from 'vitest';
import { abreElExpediente } from './seleccionDocumentos';

describe('abreElExpediente', () => {
  it('una selección de varios documentos abre un solo expediente', () => {
    const seleccion = ['querella.pdf', 'contestacion.pdf', 'acta.pdf'];
    const veces = seleccion.filter((a) => abreElExpediente(a, seleccion)).length;
    expect(veces).toBe(1);
  });

  it('el que abre es el primero de la selección', () => {
    const seleccion = ['a', 'b'];
    expect(abreElExpediente('a', seleccion)).toBe(true);
    expect(abreElExpediente('b', seleccion)).toBe(false);
  });

  it('un solo documento también abre expediente', () => {
    expect(abreElExpediente('unico.pdf', ['unico.pdf'])).toBe(true);
  });

  it('una selección vacía no abre nada', () => {
    expect(abreElExpediente('x', [])).toBe(false);
  });

  it('distingue por identidad, no por contenido: dos archivos homónimos no abren dos veces', () => {
    const a = new File(['1'], 'igual.pdf');
    const b = new File(['2'], 'igual.pdf');
    const seleccion = [a, b];
    expect(seleccion.filter((f) => abreElExpediente(f, seleccion)).length).toBe(1);
  });
});
