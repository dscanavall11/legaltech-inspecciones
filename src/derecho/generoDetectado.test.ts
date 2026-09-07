import { describe, it, expect } from 'vitest';
import { detectarGeneroCiudadano } from './generoDetectado';

describe('detectarGeneroCiudadano — solo evidencia textual explícita, nunca el nombre, nunca IA', () => {
  it('detecta masculino con evidencia inequívoca ("el ciudadano", "identificado")', () => {
    expect(
      detectarGeneroCiudadano('Se aborda al ciudadano en mención, identificado con cédula de ciudadanía.'),
    ).toBe('masculino');
  });

  it('detecta femenino con evidencia inequívoca ("la ciudadana", "identificada")', () => {
    expect(
      detectarGeneroCiudadano('Se aborda a la ciudadana en mención, identificada con cédula de ciudadanía.'),
    ).toBe('femenino');
  });

  it('detecta masculino con "señor" sin confundirlo con "señora"', () => {
    expect(detectarGeneroCiudadano('Se le solicita al señor que se identifique.')).toBe('masculino');
  });

  it('detecta femenino con "señora" (no debe activar falsamente el patrón de "señor")', () => {
    expect(detectarGeneroCiudadano('Se le solicita a la señora que se identifique.')).toBe('femenino');
  });

  it('detecta masculino con "presunto infractor"', () => {
    expect(detectarGeneroCiudadano('El presunto infractor se niega a colaborar con el procedimiento.')).toBe(
      'masculino',
    );
  });

  it('detecta femenino con "presunta infractora"', () => {
    expect(detectarGeneroCiudadano('La presunta infractora se niega a colaborar con el procedimiento.')).toBe(
      'femenino',
    );
  });

  it('texto ambiguo o contradictorio (marcas de ambos géneros) → sin detección', () => {
    expect(
      detectarGeneroCiudadano('Se aborda al ciudadano, quien manifiesta que la ciudadana también estaba presente.'),
    ).toBeNull();
  });

  it('texto sin ninguna marca de género → sin detección', () => {
    expect(detectarGeneroCiudadano('Se realiza verificación de requisitos del establecimiento comercial.')).toBeNull();
  });

  it('nombre propio solo, sin marcas textuales de género → NO infiere por el nombre', () => {
    expect(detectarGeneroCiudadano('MARIA JOSE HINCAPIE OSORIO')).toBeNull();
    expect(detectarGeneroCiudadano('ANDRES FELIPE GOMEZ')).toBeNull();
  });

  it('texto vacío o indefinido → sin detección', () => {
    expect(detectarGeneroCiudadano('')).toBeNull();
    expect(detectarGeneroCiudadano(undefined)).toBeNull();
    expect(detectarGeneroCiudadano(null)).toBeNull();
  });
});
