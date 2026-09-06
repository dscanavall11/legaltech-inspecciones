import { describe, it, expect } from 'vitest';
import {
  actaFirmezaComoDocumento,
  generarActaFirmeza,
  ROTULO_PROCESO_POR_DEFECTO,
  ROTULO_RESOLUTIVA_POR_DEFECTO,
} from '@/derecho';
import { acapitesComoDocumentoLegal } from './documentoLegalAcapites';
import type { Acapite } from './acapites';

/**
 * Los cuatro renderers de documento se colapsaron en uno solo
 * (documentoLegalPdf/documentoLegalDocx sobre `DocumentoLegal`). Lo único que
 * los diferenciaba eran dos rótulos del encabezado y de la parte resolutiva,
 * y esos rótulos SÍ importan jurídicamente: un acta de firmeza dice DISPONE,
 * no RESUELVE. Este test congela esa diferencia.
 */

const DATOS_ACTA = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'INSPECTOR DE PRUEBA',
  inspectorCargo: 'Inspector Permanente de Convivencia y Paz',
  proceso: '2026-0000',
  fechaResolucion: '2026-01-01',
  comparendo: '17001000000000000000',
  fechaComparendo: '2025-12-01',
  articuloNumeral: 'Artículo 27 Numeral 1',
  lugar: 'Carrera 00 No. 00-00',
  solicitado: 'CIUDADANO DE PRUEBA',
  cedula: '1.000.000.000',
  direccion: 'Calle 00 No. 00-00',
  telefono: 'NO APORTA',
  solicitante: 'CAI DE PRUEBA',
  hechos: 'Hechos de prueba.',
  tipoMulta: 2 as const,
  causal: 'ninguna' as const,
};

describe('actaFirmezaComoDocumento', () => {
  it('conserva el encabezado DISPONE del formato del despacho', () => {
    const doc = actaFirmezaComoDocumento(generarActaFirmeza(DATOS_ACTA));
    expect(doc.rotuloResolutiva).toBe('DISPONE:');
    expect(doc.rotuloResolutiva).not.toBe(ROTULO_RESOLUTIVA_POR_DEFECTO);
  });

  it('traslada la parte dispositiva y la firma sin perder contenido', () => {
    const acta = generarActaFirmeza(DATOS_ACTA);
    const doc = actaFirmezaComoDocumento(acta);
    expect(doc.resuelve).toEqual(acta.dispone);
    expect(doc.resuelve.length).toBeGreaterThan(0);
    expect(doc.firma).toEqual([{ nombre: acta.firma.nombre, rol: acta.firma.cargo }]);
  });

  it('numera el proceso como QUEJA, igual que el resto de piezas del comparendo', () => {
    const doc = actaFirmezaComoDocumento(generarActaFirmeza(DATOS_ACTA));
    expect(doc.rotuloProceso ?? ROTULO_PROCESO_POR_DEFECTO).toBe('QUEJA');
  });
});

describe('acapitesComoDocumentoLegal', () => {
  const acapites: Acapite[] = [
    { id: 'a', titulo: 'I. Identificación', resumen: '', parrafos: ['Uno.'], fuente: 'plantilla' },
    { id: 'b', titulo: 'II. Hechos', resumen: '', parrafos: ['Dos.', 'Tres.'], fuente: 'ia' },
  ];

  it('convierte cada acápite en una sección, conservando el orden y los párrafos', () => {
    const doc = acapitesComoDocumentoLegal({
      titulo: 'Fallo',
      entidad: 'INSPECCIÓN DE PRUEBA',
      radicado: '2026-0001',
      acapites,
    });
    expect(doc.secciones).toEqual([
      { titulo: 'I. Identificación', parrafos: ['Uno.'] },
      { titulo: 'II. Hechos', parrafos: ['Dos.', 'Tres.'] },
    ]);
    expect(doc.rotuloProceso).toBe('RADICADO N.º');
  });

  it('no inventa firma ni fecha: los pone la plantilla del despacho', () => {
    const doc = acapitesComoDocumentoLegal({
      titulo: 'Fallo',
      entidad: 'INSPECCIÓN DE PRUEBA',
      radicado: '2026-0001',
      acapites,
    });
    expect(doc.firma[0].nombre).toBe('');
    expect(doc.fechaResolucionLetras).toBe('');
    expect(doc.cierre).toBe('');
  });
});
