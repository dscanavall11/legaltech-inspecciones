import { describe, expect, it } from 'vitest';
import { PARTES_VACIAS, type PartesQuerella } from '@/features/querellas/partes';
import { construirResuelve, firmasFallo, type DatosResuelve } from './resuelveFallo';

const PARTES: PartesQuerella = {
  ...PARTES_VACIAS,
  querellante: { ...PARTES_VACIAS.querellante, nombre: 'Querellante de prueba', identificacion: '0000001' },
  querellado: { ...PARTES_VACIAS.querellado, nombre: 'Querellado de prueba', identificacion: '0000002' },
};

const BASE: DatosResuelve = {
  sentido: 'sanciona',
  partes: PARTES,
  comportamiento: 'Perturbación de la posesión',
  medidaCorrectiva: 'Multa General Tipo 2',
  radicado: '2026-00042',
};

const todo = (d: DatosResuelve) => construirResuelve(d).join(' ');

describe('construirResuelve', () => {
  it('notifica en estrados a las DOS partes, no solo a quien pierde', () => {
    const texto = todo(BASE);
    expect(texto).toContain('NOTIFICAR EN ESTRADOS');
    expect(texto).toContain('Querellante de prueba');
    expect(texto).toContain('Querellado de prueba');
    expect(texto).toContain('223');
  });

  it('siempre advierte los recursos y su oportunidad en la misma audiencia', () => {
    (['absuelve', 'responsable_sin_multa', 'sanciona'] as const).forEach((sentido) => {
      const texto = todo({ ...BASE, sentido });
      expect(texto, sentido).toContain('reposición');
      expect(texto, sentido).toContain('dentro de la misma audiencia');
      expect(texto, sentido).toContain('queda en firme');
    });
  });

  it('numera las órdenes en ordinales', () => {
    const ordenes = construirResuelve(BASE);
    expect(ordenes[0].startsWith('PRIMERO: ')).toBe(true);
    expect(ordenes[1].startsWith('SEGUNDO: ')).toBe(true);
  });

  it('absolver no ingresa nada al RNMC ni presta mérito ejecutivo', () => {
    const texto = todo({ ...BASE, sentido: 'absuelve', medidaCorrectiva: '' });
    expect(texto).toContain('ABSTENERSE de imponer medida correctiva');
    expect(texto).not.toContain('RNMC');
    expect(texto).not.toContain('mérito ejecutivo');
  });

  it('declarar responsable sin multa sí va al RNMC, pero no presta mérito ejecutivo', () => {
    const texto = todo({
      ...BASE,
      sentido: 'responsable_sin_multa',
      medidaCorrectiva: 'programa comunitario de convivencia',
    });
    expect(texto).toContain('RNMC');
    expect(texto).toContain('programa comunitario de convivencia');
    expect(texto).not.toContain('mérito ejecutivo');
  });

  it('sancionar presta mérito ejecutivo y advierte el cobro coactivo', () => {
    const texto = todo(BASE);
    expect(texto).toContain('mérito ejecutivo');
    expect(texto).toContain('182');
    expect(texto).toContain('Multa General Tipo 2');
  });

  it('sin medida escrita no inventa una: deja el genérico visible', () => {
    const texto = todo({ ...BASE, medidaCorrectiva: '' });
    expect(texto).toContain('la medida correctiva que corresponda');
  });
});

describe('firmasFallo', () => {
  it('firma el inspector y las dos partes como notificadas', () => {
    const firmas = firmasFallo(PARTES, 'Inspector de prueba', 'Inspector de Convivencia y Paz');
    expect(firmas).toHaveLength(3);
    expect(firmas.filter((f) => f.tipo === 'notificado')).toHaveLength(2);
    expect(firmas[2].nombre).toBe('Inspector de prueba');
  });

  it('omite la parte que no está identificada, sin dejar una firma en blanco', () => {
    const firmas = firmasFallo(
      { ...PARTES, querellante: { ...PARTES_VACIAS.querellante } },
      'Inspector de prueba',
      'Inspector de Convivencia y Paz',
    );
    expect(firmas).toHaveLength(2);
  });
});
