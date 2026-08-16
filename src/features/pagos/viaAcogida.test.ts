import { describe, it, expect } from 'vitest';
import { VIA_CONMUTACION, VIA_PRONTO_PAGO, viaAdmiteTipo } from './viaAcogida';
import type { FormularioAcogida } from './formularioAcogida';
import type { TipoMulta } from '@/derecho';

/**
 * Pronto pago y conmutación son dos vías separadas del parágrafo del art. 180,
 * con requisitos distintos. Lo que este test congela es la restricción que la
 * ley impone y que la interfaz no puede dejar pasar: la conmutación solo
 * procede para multas tipo 1 y 2.
 */

function datos(over: Partial<FormularioAcogida> = {}): FormularioAcogida {
  return {
    municipio: 'Manizales',
    inspeccion: 'Inspección de prueba',
    inspectorNombre: 'INSPECTOR DE PRUEBA',
    inspectorRol: 'Inspector Permanente de Convivencia y Paz',
    proceso: '2026-0001',
    fechaResolucion: '2026-03-02',
    comparendo: '17001000000000000000',
    fechaComparendo: '2026-02-26',
    articuloNumeral: 'Artículo 27 Numeral 1',
    solicitado: 'CIUDADANO DE PRUEBA',
    cedula: '1.000.000.000',
    direccion: 'Calle 00 No. 00-00',
    telefono: 'NO APORTA',
    solicitante: 'CAI DE PRUEBA',
    hechos: 'Hechos de prueba.',
    tipoMulta: 1,
    causal: 'ninguna',
    causalEvidencia: '',
    documentoCobro: 'RC-2026-000001',
    actividadAsignada: 'Jornada pedagógica',
    entidadPrograma: 'Secretaría de Gobierno',
    fechaLimiteActividad: '2026-04-01',
    ...over,
  };
}

describe('restricción legal de la conmutación (art. 180 par.)', () => {
  it('solo admite multas tipo 1 y 2', () => {
    const admitidos = ([1, 2, 3, 4] as TipoMulta[]).filter((t) => viaAdmiteTipo(VIA_CONMUTACION, t));
    expect(admitidos).toEqual([1, 2]);
  });

  it('el pronto pago no tiene esa restricción: procede para cualquier tipo', () => {
    const admitidos = ([1, 2, 3, 4] as TipoMulta[]).filter((t) => viaAdmiteTipo(VIA_PRONTO_PAGO, t));
    expect(admitidos).toEqual([1, 2, 3, 4]);
  });

  it('el generador de conmutación rechaza un tipo no conmutable aunque se lo fuercen', () => {
    expect(() => VIA_CONMUTACION.generarActa(datos({ tipoMulta: 3 }))).toThrow(/no es conmutable/i);
  });
});

describe('las dos vías producen actas distintas del mismo comparendo', () => {
  it('el acta de pronto pago aplica el descuento; la de conmutación, no', () => {
    expect(VIA_PRONTO_PAGO.aplicaDescuento).toBe(true);
    expect(VIA_CONMUTACION.aplicaDescuento).toBe(false);
  });

  it('cada vía tiene su propio título de documento', () => {
    const prontoPago = VIA_PRONTO_PAGO.generarActa(datos());
    const conmutacion = VIA_CONMUTACION.generarActa(datos());
    expect(prontoPago.tituloDocumento).not.toBe(conmutacion.tituloDocumento);
  });

  it('la conmutación deja constancia de la actividad y su plazo en la parte resolutiva', () => {
    const acta = VIA_CONMUTACION.generarActa(datos({ actividadAsignada: 'Taller de convivencia' }));
    expect(acta.resuelve.join(' ')).toContain('Taller de convivencia');
  });

  it('el pronto pago deja constancia del recibo de cobro expedido', () => {
    const acta = VIA_PRONTO_PAGO.generarActa(datos({ documentoCobro: 'RC-2026-000123' }));
    const textoCompleto = [...acta.resuelve, ...acta.secciones.flatMap((s) => s.parrafos)].join(' ');
    expect(textoCompleto).toContain('RC-2026-000123');
  });
});
