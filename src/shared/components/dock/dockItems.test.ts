import { describe, it, expect } from 'vitest';
import { DOCK_ITEMS, DOCK_RUTAS, DOCK_SECTIONS } from './dockItems';

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

// El menú se redujo a siete secciones + el CTA de Radicar (8 rutas en total)
// por decisión de producto (navaja de Ockham sobre la interfaz). Este test
// congela ese conjunto: agregar una novena ruta tiene que ser deliberado, no
// un descuido.
const ENTRADAS_DEL_MENU = [
  '/panel',
  '/panel/quejas',
  '/panel/querellas',
  '/panel/apelaciones',
  '/panel/procesos',
  '/panel/radicador',
  '/panel/chat',
  '/panel/ajustes',
];

describe('menu principal: siete secciones + Radicar', () => {
  it('el dock expone exactamente las entradas acordadas (Radicar es el CTA, no una categoria)', () => {
    expect([...DOCK_RUTAS].sort()).toEqual([...ENTRADAS_DEL_MENU].sort());
  });

  it('los tramites del comparendo NO son entradas del menu: viven dentro de Quejas', () => {
    const dentroDeQuejas = ['/panel/comparendos', '/panel/actas-firmeza', '/panel/pronto-pago'];
    for (const ruta of dentroDeQuejas) {
      expect(DOCK_RUTAS).not.toContain(ruta);
    }
  });

  // Audiencias, Normas y Medidas correctivas siguen montadas en el router
  // (app/router.tsx, bloque "Diferidos a la V2") pero fuera del menú.
  it('los modulos diferidos a la V2 no aparecen en el menu', () => {
    const diferidos = ['/panel/audiencias', '/panel/normas', '/panel/medidas-correctivas'];
    for (const ruta of diferidos) {
      expect(DOCK_RUTAS).not.toContain(ruta);
    }
  });

  it('el dock es la unica superficie de navegacion: no hay rutas repetidas', () => {
    expect(new Set(DOCK_RUTAS).size).toBe(DOCK_RUTAS.length);
  });
});
