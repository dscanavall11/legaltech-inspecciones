import { describe, expect, it } from 'vitest';
import { llenarPlantilla, slotsFaltantes } from './llenarPlantilla';
import type { StructuredTemplate } from './tipos';

const PLANTILLA: StructuredTemplate = {
  key: 'auto-prueba',
  documentType: 'AUTO',
  slots: ['municipio', 'radicado'],
  header: { entity: '{inspeccion | MAYÚSCULAS}', title: 'AUTO DE PRUEBA', epigraph: '' },
  sections: [{ id: 'competencia', title: 'COMPETENCIA', content: 'El inspector de {municipio} es competente en el radicado {radicado}.' }],
  commonOperativeClauses: ['NOTIFICAR EN ESTRADOS a {municipio}.'],
};

describe('llenarPlantilla', () => {
  it('sustituye los slots en secciones y en el resuelve', () => {
    const doc = llenarPlantilla(PLANTILLA, { municipio: 'Manizales', radicado: '2026-0001', inspeccion: 'Inspección Uno' });
    expect(doc.secciones[0].parrafos[0]).toBe('El inspector de Manizales es competente en el radicado 2026-0001.');
    expect(doc.resuelve[0]).toBe('NOTIFICAR EN ESTRADOS a Manizales.');
  });

  it('aplica el filtro MAYÚSCULAS del encabezado', () => {
    const doc = llenarPlantilla(PLANTILLA, { inspeccion: 'Inspección Uno' });
    expect(doc.entidad).toBe('INSPECCIÓN UNO');
  });

  it('tolera el espacio final antes del cierre en {campo | MAYÚSCULAS }', () => {
    const conEspacioFinal: StructuredTemplate = {
      ...PLANTILLA,
      header: { ...PLANTILLA.header, entity: '{inspeccion | MAYÚSCULAS }' },
    };
    const doc = llenarPlantilla(conEspacioFinal, { inspeccion: 'Inspección Uno' });
    expect(doc.entidad).toBe('INSPECCIÓN UNO');
  });

  it('un slot sin valor se deja visible, nunca se borra en silencio', () => {
    const doc = llenarPlantilla(PLANTILLA, { municipio: 'Manizales' });
    expect(doc.secciones[0].parrafos[0]).toContain('{radicado}');
  });

  it('slotsFaltantes nombra los que el documento todavía no puede llenar', () => {
    expect(slotsFaltantes(PLANTILLA, { municipio: 'Manizales' })).toEqual(['radicado']);
    expect(slotsFaltantes(PLANTILLA, { municipio: 'M', radicado: 'R' })).toEqual([]);
  });
});
