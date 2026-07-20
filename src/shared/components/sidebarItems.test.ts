import { describe, it, expect } from 'vitest';
import { SIDEBAR_ITEMS, SIDEBAR_RUTAS } from './sidebarItems';
import { LAUNCHPAD_RUTAS } from './launchpad/launchpadItems';

describe('SIDEBAR_ITEMS', () => {
  it('Radicar sigue existiendo y sigue destacado (regresion del reporte "desaparecio Radicar")', () => {
    const radicar = SIDEBAR_ITEMS.find((item) => item.key === 'radicador');
    expect(radicar).toBeDefined();
    expect(radicar?.destacado).toBe(true);
    expect(radicar?.ruta).toBe('/panel/radicador');
  });
});

// Rutas que exponia el sidebar viejo (AppLayout.tsx, NAV_RUTAS_COMPLETO, antes del rediseno).
// Congelado a proposito: si Sidebar/Launchpad dejan de cubrir alguna, este test falla.
const RUTAS_QUE_DEBEN_SEGUIR_ACCESIBLES = [
  '/panel/querellas',
  '/panel/quejas',
  '/panel/audiencias',
  '/panel/radicador',
  '/panel/cola',
  '/panel/actas-firmeza',
  '/panel/medidas-correctivas',
  '/panel/normas',
];

describe('cobertura de rutas: GlassSidebar + Launchpad', () => {
  it('todas las rutas que exponia el sidebar viejo siguen accesibles', () => {
    const rutasCubiertas = new Set([...SIDEBAR_RUTAS, ...LAUNCHPAD_RUTAS]);
    for (const ruta of RUTAS_QUE_DEBEN_SEGUIR_ACCESIBLES) {
      expect(rutasCubiertas.has(ruta)).toBe(true);
    }
  });

  it('no hay rutas duplicadas entre GlassSidebar y Launchpad', () => {
    const interseccion = SIDEBAR_RUTAS.filter((r) => LAUNCHPAD_RUTAS.includes(r));
    expect(interseccion).toEqual([]);
  });
});
