import { describe, it, expect } from 'vitest';
import { faltantesParaFallo, leerPartes, PARTES_VACIAS, rotuloParte } from './partes';

/**
 * La querella tiene DOS sujetos procesales (Decreto 768, art. 2.2.8.18.3.3).
 * Lo que estos tests congelan es que ninguno se dé por identificado sin datos
 * y que la calidad del querellante —requisito del art. 2.2.8.18.4.1— no se
 * omita en silencio.
 */

const QUERELLANTE = {
  nombre: 'Parte Actora de Prueba',
  tipoIdentificacion: 'CC',
  identificacion: '1.000.000.000',
  direccion: 'Calle 00 No. 00-00',
  telefono: '3000000000',
  correo: 'actora@ejemplo.test',
  apoderado: '',
};

describe('leerPartes', () => {
  it('lee las dos partes guardadas en caseMetadata', () => {
    const raw = JSON.stringify({
      asunto: 'Perturbación',
      partes: { querellante: QUERELLANTE, calidadQuerellante: 'Poseedor' },
    });
    const partes = leerPartes(raw);
    expect(partes.querellante.nombre).toBe('Parte Actora de Prueba');
    expect(partes.calidadQuerellante).toBe('Poseedor');
  });

  it('un expediente sin partes no inventa ninguna', () => {
    expect(leerPartes(null)).toEqual(PARTES_VACIAS);
    expect(leerPartes('{no es json')).toEqual(PARTES_VACIAS);
  });

  it('completa los campos que falten sin perder los guardados', () => {
    const raw = JSON.stringify({ partes: { querellado: { nombre: 'Parte Pasiva' } } });
    const partes = leerPartes(raw);
    expect(partes.querellado.nombre).toBe('Parte Pasiva');
    expect(partes.querellado.tipoIdentificacion).toBe('CC');
    expect(partes.querellado.correo).toBe('');
  });
});

describe('faltantesParaFallo', () => {
  it('un expediente vacío reclama las dos partes y la calidad', () => {
    expect(faltantesParaFallo(PARTES_VACIAS)).toEqual([
      'Nombre del querellante',
      'Identificación del querellante',
      'Calidad en que actúa el querellante (art. 2.2.8.18.4.1)',
      'Nombre del querellado',
      'Identificación del querellado',
    ]);
  });

  it('con solo el querellante sigue faltando el querellado: la querella es de dos partes', () => {
    const faltantes = faltantesParaFallo({
      ...PARTES_VACIAS,
      querellante: QUERELLANTE,
      calidadQuerellante: 'Propietario',
    });
    expect(faltantes).toEqual(['Nombre del querellado', 'Identificación del querellado']);
  });

  it('el apoderado nunca se exige: no se requiere abogado (art. 2.2.8.18.4.3)', () => {
    const faltantes = faltantesParaFallo({
      ...PARTES_VACIAS,
      querellante: QUERELLANTE,
      querellado: { ...QUERELLANTE, nombre: 'Parte Pasiva', identificacion: '2.000.000.000' },
      calidadQuerellante: 'Propietario',
    });
    expect(faltantes).toEqual([]);
  });
});

describe('rotuloParte', () => {
  it('arma nombre con identificación para el encabezado del fallo', () => {
    expect(rotuloParte(QUERELLANTE)).toBe('Parte Actora de Prueba, CC 1.000.000.000');
  });

  it('sin nombre dice "No identificado" en vez de dejar el campo en blanco', () => {
    expect(rotuloParte(PARTES_VACIAS.querellado)).toBe('No identificado');
  });

  it('con nombre pero sin identificación no inventa un número', () => {
    expect(rotuloParte({ ...QUERELLANTE, identificacion: '' })).toBe('Parte Actora de Prueba');
  });
});
