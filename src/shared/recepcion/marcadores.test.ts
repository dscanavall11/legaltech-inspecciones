import { describe, expect, it } from 'vitest';
import { leerCaseFiled, leerCaseUpdate, limpiarMarcadores, soloLoQueTrae } from './marcadores';

const RESPUESTA = `Leí los documentos y encontré esto.
<case_update>{"tipoSolicitud":"querella","partes":[{"rol":"querellante","nombre":"Parte Uno"}]}</case_update>
Verifíquelo antes de continuar.`;

describe('leerCaseUpdate', () => {
  it('saca el JSON incrustado en la prosa del agente', () => {
    expect(leerCaseUpdate<{ tipoSolicitud: string }>(RESPUESTA)?.tipoSolicitud).toBe('querella');
  });

  // El marcador lo escribe un modelo: puede llegar truncado o mal formado, y
  // eso no debe tumbar la pantalla — la prosa sigue siendo útil.
  it('un JSON roto devuelve null en vez de reventar', () => {
    expect(leerCaseUpdate('texto <case_update>{roto</case_update>')).toBeNull();
  });

  it('sin marcador devuelve null', () => {
    expect(leerCaseUpdate('solo prosa')).toBeNull();
  });
});

describe('leerCaseFiled', () => {
  it('solo aparece cuando el agente radicó de verdad', () => {
    expect(leerCaseFiled(RESPUESTA)).toBeNull();
    expect(
      leerCaseFiled<{ id: string }>('ok <case_filed>{"id":"abc"}</case_filed>')?.id,
    ).toBe('abc');
  });
});

describe('limpiarMarcadores', () => {
  it('deja solo lo que el humano debe leer', () => {
    const visible = limpiarMarcadores(RESPUESTA);
    expect(visible).toContain('Leí los documentos');
    expect(visible).toContain('Verifíquelo');
    expect(visible).not.toContain('case_update');
    expect(visible).not.toContain('querellante');
  });

  // Mientras la respuesta se escribe, el marcador llega abierto y sin cerrar:
  // sin esto el inspector ve medio JSON apareciendo dentro del chat.
  it('oculta el marcador todavía sin cerrar', () => {
    expect(limpiarMarcadores('Hola <case_update>{"partes":[')).toBe('Hola');
  });
});

describe('soloLoQueTrae', () => {
  it('un campo vacío del agente no pisa lo que ya hay escrito', () => {
    expect(soloLoQueTrae({ a: 'valor', b: '', c: null, d: undefined })).toEqual({ a: 'valor' });
  });
});
