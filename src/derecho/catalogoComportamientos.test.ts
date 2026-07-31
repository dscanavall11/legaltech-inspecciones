import { describe, it, expect } from 'vitest';
import { buscarComportamiento, normalizarArticuloNumeral, CATALOGO_COMPORTAMIENTOS } from './catalogoComportamientos';

describe('normalizarArticuloNumeral', () => {
  it('normaliza la forma canónica "Artículo N Numeral M" tal cual', () => {
    expect(normalizarArticuloNumeral('Artículo 92 Numeral 16')).toBe('Artículo 92 Numeral 16');
  });

  it('normaliza variantes de mayúsculas, abreviaturas y espaciado', () => {
    expect(normalizarArticuloNumeral('art. 92 num. 16')).toBe('Artículo 92 Numeral 16');
    expect(normalizarArticuloNumeral('ARTICULO 35, NUMERAL 1')).toBe('Artículo 35 Numeral 1');
    expect(normalizarArticuloNumeral('artículo   140   numeral   13')).toBe('Artículo 140 Numeral 13');
  });

  it('normaliza un artículo sin numeral', () => {
    expect(normalizarArticuloNumeral('Artículo 180')).toBe('Artículo 180');
    expect(normalizarArticuloNumeral('art. 180')).toBe('Artículo 180');
  });

  it('devuelve null para texto sin artículo reconocible', () => {
    expect(normalizarArticuloNumeral('')).toBeNull();
    expect(normalizarArticuloNumeral('sin registro')).toBeNull();
  });
});

describe('buscarComportamiento — catálogo CNSCC (Ley 1801 de 2016)', () => {
  it('encuentra los 6 comportamientos verificados verbatim contra el corpus del despacho', () => {
    const casos: [string, string][] = [
      ['Artículo 27 Numeral 3', 'Agredir físicamente a personas por cualquier medio.'],
      ['Artículo 35 Numeral 1', 'Irrespetar a las autoridades de Policía.'],
      [
        'Artículo 35 Numeral 2',
        'Incumplir, desacatar, desconocer e impedir la función o la orden de Policía.',
      ],
      [
        'Artículo 35 Numeral 5',
        'Ofrecer cualquier tipo de resistencia a la aplicación de una medida o la utilización de un medio de Policía.',
      ],
      [
        'Artículo 124 Numeral 7',
        'Tolerar, permitir o inducir por acción u omisión el que un animal ataque a una persona, a un animal o a bienes de terceros.',
      ],
    ];
    casos.forEach(([articulo, descripcion]) => {
      expect(buscarComportamiento(articulo)?.descripcionConducta).toBe(descripcion);
    });
  });

  it('art. 35 (num. 1, 2 y 5) comparte el bien jurídico "relación entre las personas y las autoridades"', () => {
    ['Artículo 35 Numeral 1', 'Artículo 35 Numeral 2', 'Artículo 35 Numeral 5'].forEach((articulo) => {
      expect(buscarComportamiento(articulo)?.bienJuridico).toMatch(/relación entre las personas y las autoridades/i);
    });
  });

  it('art. 124 num. 7 tiene como bien jurídico la convivencia por la tenencia de animales', () => {
    expect(buscarComportamiento('Artículo 124 Numeral 7')?.bienJuridico).toMatch(/tenencia de animales/i);
  });

  it('art. 140 (num. 11 y 13) tiene como bien jurídico el cuidado e integridad del espacio público', () => {
    expect(buscarComportamiento('Artículo 140 Numeral 13')?.bienJuridico).toMatch(/cuidado e integridad del espacio público/i);
    expect(buscarComportamiento('Artículo 140 Numeral 11')?.bienJuridico).toMatch(/cuidado e integridad del espacio público/i);
  });

  it('art. 27 (num. 3 y 6) tiene como bien jurídico la vida e integridad de las personas', () => {
    expect(buscarComportamiento('Artículo 27 Numeral 3')?.bienJuridico).toMatch(/vida e integridad/i);
    expect(buscarComportamiento('Artículo 27 Numeral 6')?.bienJuridico).toMatch(/vida e integridad/i);
  });

  it('cubre los 15 artículo/numeral exigidos por el despacho más el art. 180 (sin numeral)', () => {
    const requeridos = [
      'Artículo 27 Numeral 3',
      'Artículo 27 Numeral 6',
      'Artículo 35 Numeral 1',
      'Artículo 35 Numeral 2',
      'Artículo 35 Numeral 5',
      'Artículo 92 Numeral 4',
      'Artículo 92 Numeral 16',
      'Artículo 95 Numeral 1',
      'Artículo 100 Numeral 5',
      'Artículo 124 Numeral 7',
      'Artículo 140 Numeral 11',
      'Artículo 140 Numeral 13',
      'Artículo 180',
    ];
    requeridos.forEach((articulo) => {
      expect(buscarComportamiento(articulo), `falta ${articulo} en el catálogo`).toBeDefined();
    });
  });

  it('cada entrada trae descripción, bien jurídico y medidas correctivas no vacíos', () => {
    CATALOGO_COMPORTAMIENTOS.forEach((entrada) => {
      expect(entrada.descripcionConducta.trim().length).toBeGreaterThan(0);
      expect(entrada.bienJuridico.trim().length).toBeGreaterThan(0);
      expect(entrada.medidasCorrectivas.trim().length).toBeGreaterThan(0);
    });
  });

  it('acepta variantes de formato del mismo artículo (mayúsculas, abreviaturas)', () => {
    const canonico = buscarComportamiento('Artículo 35 Numeral 1');
    expect(buscarComportamiento('art. 35 num. 1')).toEqual(canonico);
    expect(buscarComportamiento('ARTICULO 35 NUMERAL 1')).toEqual(canonico);
  });

  it('devuelve undefined para un artículo desconocido/no catalogado', () => {
    expect(buscarComportamiento('Artículo 999 Numeral 1')).toBeUndefined();
    expect(buscarComportamiento('')).toBeUndefined();
    expect(buscarComportamiento('sin registro')).toBeUndefined();
  });
});
