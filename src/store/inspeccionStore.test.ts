import { describe, it, expect } from 'vitest';
import { migrarConfigInspeccion } from './inspeccionStore';

describe('migrarConfigInspeccion', () => {
  it('rellena con defaults un campo ausente en la config persistida (p. ej. correoNotificaciones anterior a su creación)', () => {
    const persistido = {
      config: {
        municipio: 'Manizales',
        inspectorNombre: 'CARLOS EJEMPLO GÓMEZ',
        inspeccion: 'Inspección Uno',
        membreteDataUrl: null,
        configurado: true,
        // correoNotificaciones no existía en esta versión persistida
      },
    };

    const migrado = migrarConfigInspeccion(persistido);

    expect(migrado.config.correoNotificaciones).toBe('');
    expect(migrado.config.municipio).toBe('Manizales');
    expect(migrado.config.configurado).toBe(true);
  });

  it('devuelve los defaults completos cuando no hay nada persistido', () => {
    expect(migrarConfigInspeccion(undefined)).toEqual({
      config: {
        municipio: '',
        inspectorNombre: '',
        inspeccion: '',
        membreteDataUrl: null,
        correoNotificaciones: '',
        configurado: false,
      },
    });
  });

  it('preserva una config ya completa sin alterar sus valores', () => {
    const persistido = {
      config: {
        municipio: 'Pereira',
        inspectorNombre: 'ANA EJEMPLO',
        inspeccion: 'Inspección Dos',
        membreteDataUrl: 'data:image/png;base64,xyz',
        correoNotificaciones: 'inspeccion@ejemplo.gov.co',
        configurado: true,
      },
    };

    expect(migrarConfigInspeccion(persistido)).toEqual(persistido);
  });
});
