import { describe, it, expect } from 'vitest';
import { DOCK_ITEMS, DOCK_RUTAS, DOCK_SECTIONS } from './dockItems';

describe('DOCK_ITEMS', () => {
  it('las tres salidas del comparendo son entradas propias, no un submenu', () => {
    const rutaDe = (key: string) => DOCK_ITEMS.find((item) => item.key === key)?.ruta;
    expect(rutaDe('firmeza')).toBe('/panel/actas-firmeza');
    expect(rutaDe('conmutacion')).toBe('/panel/conmutacion');
    expect(rutaDe('pronto-pago')).toBe('/panel/pronto-pago');
    // Firmeza es el flujo mas usado: determinista, por lote y sin IA.
    expect(DOCK_ITEMS.find((item) => item.key === 'firmeza')?.destacado).toBe(true);
  });

  // El despacho numera el expediente del comparendo como "QUEJA {proceso}" (asi
  // sale impreso en las actas), y ahi es donde se tramita el proceso verbal
  // abreviado del comparendo impugnado dentro de los tres dias.
  it('Quejas es la entrada al expediente del comparendo impugnado', () => {
    const quejas = DOCK_ITEMS.find((item) => item.key === 'quejas');
    expect(quejas?.ruta).toBe('/panel/comparendos');
    expect(quejas?.ayuda).toMatch(/impugnad/i);
  });

  // Mis procesos es el archivo del despacho, no un tramite: su acceso vive en
  // la barra superior (TopBar.tsx), no en el riel.
  it('Mis procesos no esta en el riel', () => {
    expect(DOCK_RUTAS).not.toContain('/panel/procesos');
  });

  it('cada seccion tiene un unico color, compartido por todos sus items', () => {
    for (const section of DOCK_SECTIONS) {
      for (const item of section.items) {
        expect(item.color).toBe(section.color);
      }
    }
  });

  // El riel se lee sin pasar el mouse por encima: quien lo usa es un inspector,
  // no alguien que va a descubrir la interfaz a punta de tooltips.
  it('toda entrada de tramite explica para que sirve', () => {
    const sinAyuda = DOCK_ITEMS.filter((item) => item.key !== 'inicio' && !item.ayuda);
    expect(sinAyuda.map((i) => i.key)).toEqual([]);
  });
});

// Este conjunto está congelado: agregar una entrada tiene que ser deliberado,
// no un descuido. /panel/asistente y /panel/chat conviven mientras se evalúa
// la demo del asistente con skills; cuando se decida, una de las dos sale.
const ENTRADAS_DEL_MENU = [
  '/panel',
  '/panel/querellas',
  '/panel/comparendos',
  '/panel/actas-firmeza',
  '/panel/conmutacion',
  '/panel/pronto-pago',
  '/panel/apelaciones',
  '/panel/chat',
  '/panel/asistente',
  '/panel/ajustes',
];

describe('menu principal', () => {
  it('el riel expone exactamente las entradas acordadas', () => {
    expect([...DOCK_RUTAS].sort()).toEqual([...ENTRADAS_DEL_MENU].sort());
  });

  // El orden lo fijó el despacho y sigue el trámite: primero los procesos que
  // se instruyen, después las salidas del comparendo, al final la alzada.
  it('el orden del riel es el del tramite', () => {
    expect(DOCK_RUTAS).toEqual(ENTRADAS_DEL_MENU);
  });

  // Radicar sale del menú: la radicación pasa a la conversación con el
  // asistente. La ruta sigue montada y sigue enlazada desde las bandejas.
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

  it('no hay rutas repetidas', () => {
    expect(new Set(DOCK_RUTAS).size).toBe(DOCK_RUTAS.length);
  });
});
