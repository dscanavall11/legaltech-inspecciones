import { describe, it, expect } from 'vitest';
import { DOCK_ITEMS } from './dockItems';

describe('DOCK_ITEMS', () => {
  it('Radicar sigue existiendo y sigue destacado (regresion del reporte "desaparecio Radicar")', () => {
    const radicar = DOCK_ITEMS.find((item) => item.key === 'radicador');
    expect(radicar).toBeDefined();
    expect(radicar?.destacado).toBe(true);
    expect(radicar?.ruta).toBe('/panel/radicador');
  });
});
