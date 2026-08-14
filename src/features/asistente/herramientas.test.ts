import { describe, it, expect } from 'vitest';
import { HERRAMIENTAS, buscarHerramienta, motivoNoDisponible } from './herramientas';

const de = (clave: string) => buscarHerramienta(clave)!;

describe('catálogo de herramientas', () => {
  it('cada clave es única', () => {
    const claves = HERRAMIENTAS.map((h) => h.clave);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it('plantillas del despacho y agenda de audiencias salieron del catálogo', () => {
    expect(buscarHerramienta('plantillas')).toBeUndefined();
    expect(buscarHerramienta('audiencias')).toBeUndefined();
  });

  it('las que no dependen del expediente están disponibles siempre', () => {
    for (const clave of ['documento', 'norma']) {
      expect(motivoNoDisponible(de(clave), null)).toBeNull();
      expect(motivoNoDisponible(de(clave), 'querella')).toBeNull();
    }
  });

  it('las del expediente piden caso activo y dicen por qué', () => {
    for (const clave of ['pruebas', 'documentos', 'contador', 'grafo']) {
      expect(motivoNoDisponible(de(clave), null)).toBe('Requiere un caso activo');
      expect(motivoNoDisponible(de(clave), 'comparendo')).toBeNull();
    }
  });

  it('el liquidador de multas solo aplica a quejas y comparendos', () => {
    expect(motivoNoDisponible(de('multas'), 'queja')).toBeNull();
    expect(motivoNoDisponible(de('multas'), 'comparendo')).toBeNull();
    expect(motivoNoDisponible(de('multas'), 'querella')).toBe('Solo aplica a quejas y comparendos');
    expect(motivoNoDisponible(de('multas'), null)).toBe('Requiere un caso activo');
  });

  it('la etapa procesal solo aplica a los trámites con mapa de estados modelado', () => {
    expect(motivoNoDisponible(de('etapa'), 'querella')).toBeNull();
    expect(motivoNoDisponible(de('etapa'), 'comparendo')).toBeNull();
    expect(motivoNoDisponible(de('etapa'), 'queja')).toBe('Solo aplica a querellas y comparendos');
    expect(motivoNoDisponible(de('etapa'), null)).toBe('Requiere un caso activo');
  });
});
