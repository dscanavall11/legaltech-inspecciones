import { describe, it, expect } from 'vitest';
import { leerOrientaciones, ORIENTACIONES_VACIAS } from './types';

describe('leerOrientaciones', () => {
  it('lee el texto y la fecha guardados en caseMetadata', () => {
    const raw = JSON.stringify({
      asunto: 'Ruido nocturno',
      orientaciones: { texto: 'Revisar la notificación', actualizadoEn: '2026-08-15T10:00:00Z' },
    });
    expect(leerOrientaciones(raw)).toEqual({
      texto: 'Revisar la notificación',
      actualizadoEn: '2026-08-15T10:00:00Z',
    });
  });

  it('devuelve vacío cuando el expediente todavía no tiene orientaciones', () => {
    expect(leerOrientaciones(null)).toEqual(ORIENTACIONES_VACIAS);
    expect(leerOrientaciones(undefined)).toEqual(ORIENTACIONES_VACIAS);
    expect(leerOrientaciones(JSON.stringify({ asunto: 'Ruido' }))).toEqual(ORIENTACIONES_VACIAS);
  });

  it('un caseMetadata corrupto no rompe la pestaña', () => {
    expect(leerOrientaciones('{no es json')).toEqual(ORIENTACIONES_VACIAS);
  });
});
