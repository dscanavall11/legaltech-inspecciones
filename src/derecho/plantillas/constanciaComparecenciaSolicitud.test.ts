import { describe, it, expect } from 'vitest';
import { generarConstanciaComparecenciaSolicitud } from './constanciaComparecenciaSolicitud';

describe('generarConstanciaComparecenciaSolicitud', () => {
  const base = {
    municipio: 'Manizales',
    inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
    firmanteNombre: 'MARÍA EJEMPLO GÓMEZ',
    firmanteRol: 'Auxiliar Administrativo',
    proceso: '2026-0501',
    comparendo: '17-001-6-2026-0003',
    fechaComparendo: '2026-04-24',
    fechaComparecencia: '2026-04-27',
    solicitado: 'FERNANDO EJEMPLO BEDOLLA',
    cedulaSolicitado: '1002592012',
  };

  it('ruta pronto_pago: menciona el descuento del 50%', () => {
    const doc = generarConstanciaComparecenciaSolicitud({ ...base, ruta: 'pronto_pago' });
    expect(doc.secciones[0].parrafos[0]).toContain('descuento del 50% por pronto pago');
    expect(doc.tituloDocumento).toBe('CONSTANCIA SECRETARIAL');
    expect(doc.firma).toEqual([{ nombre: base.firmanteNombre, rol: base.firmanteRol }]);
  });

  it('ruta conmutacion: menciona la conmutación, no el descuento', () => {
    const doc = generarConstanciaComparecenciaSolicitud({ ...base, ruta: 'conmutacion' });
    expect(doc.secciones[0].parrafos[0]).toContain('conmutación de la multa');
    expect(doc.secciones[0].parrafos[0]).not.toContain('descuento del 50%');
  });
});
