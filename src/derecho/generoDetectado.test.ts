import { describe, it, expect } from 'vitest';
import { detectarGeneroCiudadano, generoDesdeColumnaOficial, resolverGeneroCiudadano } from './generoDetectado';

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

describe('generoDesdeColumnaOficial — columna "Genero" de la base activa, normalizada', () => {
  it.each(['Masculino', ' masculino ', 'MASCULINO', 'masculino'])('%s → masculino', (v) => {
    expect(generoDesdeColumnaOficial(v)).toBe('masculino');
  });

  it.each(['Femenino', 'Femenino ', ' femenino ', 'FEMENINO'])('%s → femenino', (v) => {
    expect(generoDesdeColumnaOficial(v)).toBe('femenino');
  });

  it('valor no reconocido, vacío o ausente → null (no se inventa ni se aproxima)', () => {
    expect(generoDesdeColumnaOficial('')).toBeNull();
    expect(generoDesdeColumnaOficial(undefined)).toBeNull();
    expect(generoDesdeColumnaOficial(null)).toBeNull();
    expect(generoDesdeColumnaOficial('M')).toBeNull();
    expect(generoDesdeColumnaOficial('Otro')).toBeNull();
    expect(generoDesdeColumnaOficial(0)).toBeNull();
  });
});

describe('resolverGeneroCiudadano — prioridad: columna "Genero" primero, texto libre solo de respaldo', () => {
  it('columna válida → se usa directamente, sin mirar los hechos', () => {
    expect(resolverGeneroCiudadano('Masculino', 'Se aborda a la ciudadana, identificada con cédula.')).toBe(
      'masculino',
    );
    expect(resolverGeneroCiudadano(' Femenino ', 'Se aborda al ciudadano, identificado con cédula.')).toBe(
      'femenino',
    );
  });

  it('columna vacía o no reconocida → cae a la detección textual de "hechos"', () => {
    expect(resolverGeneroCiudadano('', 'Se aborda a la ciudadana, identificada con cédula.')).toBe('femenino');
    expect(resolverGeneroCiudadano('Otro', 'Se aborda al ciudadano, identificado con cédula.')).toBe('masculino');
    expect(resolverGeneroCiudadano(undefined, 'Se aborda al ciudadano, identificado con cédula.')).toBe('masculino');
  });

  it('ni columna ni texto libre resuelven → null (exige revisión manual, nunca por el nombre ni IA)', () => {
    expect(resolverGeneroCiudadano('', 'Se realiza verificación de requisitos del establecimiento.')).toBeNull();
    expect(resolverGeneroCiudadano(null, 'MARIA JOSE HINCAPIE OSORIO')).toBeNull();
  });
});
