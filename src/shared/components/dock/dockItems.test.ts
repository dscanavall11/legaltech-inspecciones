import { describe, it, expect } from 'vitest';
import { DOCK_ITEMS } from './dockItems';

describe('DOCK_ITEMS', () => {
  it('Radicar sigue existiendo y sigue destacado (regresion del reporte "desaparecio Radicar")', () => {
    const radicar = DOCK_ITEMS.find((item) => item.key === 'radicador');
    expect(radicar).toBeDefined();
    expect(radicar?.destacado).toBe(true);
    expect(radicar?.ruta).toBe('/panel/radicador');
  });

  it('cada item tiene un color de tile valido', () => {
    const coloresValidos = ['azul', 'verde', 'amarillo', 'rojo'];
    for (const item of DOCK_ITEMS) {
      expect(coloresValidos).toContain(item.color);
    }
  });
});
