import { describe, it, expect } from 'vitest';
import { DOCK_ITEMS, DOCK_RUTAS, DOCK_SECTIONS } from './dockItems';
import { LAUNCHPAD_RUTAS } from '../launchpad/launchpadItems';

describe('DOCK_ITEMS', () => {
  it('Radicar sigue existiendo y sigue destacado (regresion del reporte "desaparecio Radicar")', () => {
    const radicar = DOCK_ITEMS.find((item) => item.key === 'radicador');
    expect(radicar).toBeDefined();
    expect(radicar?.destacado).toBe(true);
    expect(radicar?.ruta).toBe('/panel/radicador');
  });

  it('cada seccion tiene un unico color, compartido por todos sus items (fiel a resguardo-saas)', () => {
    for (const section of DOCK_SECTIONS) {
      for (const item of section.items) {
        expect(item.color).toBe(section.color);
      }
    }
  });
});

// Rutas que exponia el sidebar viejo (AppLayout.tsx, NAV_RUTAS_COMPLETO, antes del rediseno).
// Congelado a proposito: si Dock/Launchpad dejan de cubrir alguna, este test falla.
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

describe('cobertura de rutas: Dock + Launchpad', () => {
  it('todas las rutas que exponia el sidebar viejo siguen accesibles', () => {
    const rutasCubiertas = new Set([...DOCK_RUTAS, ...LAUNCHPAD_RUTAS]);
    for (const ruta of RUTAS_QUE_DEBEN_SEGUIR_ACCESIBLES) {
      expect(rutasCubiertas.has(ruta)).toBe(true);
    }
  });

  it('no hay rutas duplicadas entre Dock y Launchpad', () => {
    const interseccion = DOCK_RUTAS.filter((r) => LAUNCHPAD_RUTAS.includes(r));
    expect(interseccion).toEqual([]);
  });
});
