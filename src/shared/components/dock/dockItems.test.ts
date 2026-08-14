import { describe, it, expect } from 'vitest';
import { DOCK_ITEMS, DOCK_RUTAS, DOCK_SECTIONS } from './dockItems';

describe('DOCK_ITEMS', () => {
  it('los tramites del comparendo tienen entrada propia (regresion: quedaron enterrados en el subnav de Quejas)', () => {
    const actas = DOCK_ITEMS.find((item) => item.key === 'actas');
    expect(actas?.ruta).toBe('/panel/actas-firmeza');
    // Es el flujo mas usado del despacho: determinista, por lote y sin IA.
    expect(actas?.destacado).toBe(true);
    expect(DOCK_ITEMS.find((item) => item.key === 'pronto-pago')?.ruta).toBe('/panel/pronto-pago');
  });

  it('cada seccion tiene un unico color, compartido por todos sus items (fiel a resguardo-saas)', () => {
    for (const section of DOCK_SECTIONS) {
      for (const item of section.items) {
        expect(item.color).toBe(section.color);
      }
    }
  });
});

// Este conjunto está congelado: agregar una entrada tiene que ser deliberado,
// no un descuido. /panel/asistente y /panel/chat conviven mientras se evalúa
// la demo del asistente con skills; cuando se decida, una de las dos sale.
const ENTRADAS_DEL_MENU = [
  '/panel',
  '/panel/quejas',
  '/panel/querellas',
  '/panel/apelaciones',
  '/panel/procesos',
  '/panel/actas-firmeza',
  '/panel/pronto-pago',
  '/panel/chat',
  '/panel/asistente',
  '/panel/ajustes',
];

describe('menu principal', () => {
  it('el dock expone exactamente las entradas acordadas', () => {
    expect([...DOCK_RUTAS].sort()).toEqual([...ENTRADAS_DEL_MENU].sort());
  });

  // Radicar sale del menú: la radicación pasa a la conversación con el
  // asistente. La ruta sigue montada y sigue enlazada desde las bandejas de
  // Querellas y Quejas (app/router.tsx, `accion` de BandejaProcesos).
  it('Radicar ya no es una entrada del menu', () => {
    expect(DOCK_RUTAS).not.toContain('/panel/radicador');
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
