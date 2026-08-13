import { describe, it, expect } from 'vitest';
import { generarActaConmutacion, type DatosActaConmutacion } from './actaConmutacion';

const BASE: DatosActaConmutacion = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  proceso: '2026-0502',
  fechaResolucion: '2026-01-06',
  comparendo: '17-001-6-2026-63',
  fechaComparendo: '2026-01-01',
  articuloNumeral: 'Artículo 27 Numeral 6',
  solicitado: 'LAURA MARCELA EJEMPLO PATIÑO',
  cedula: '1053800003',
  direccion: 'CRA 32 CALLE 27',
  telefono: '3180000003',
  tipoMulta: 2,
  causal: 'ninguna',
  actividadAsignada: 'Jornada pedagógica de convivencia ciudadana',
  entidadPrograma: 'Secretaría de Gobierno Municipal — plataforma Sispaz',
  fechaLimiteActividad: '2026-03-06',
};

describe('generarActaConmutacion — plantilla del despacho (art. 180 par.)', () => {
  it('solo tipos 1 y 2: rechaza tipo 3 o 4', () => {
    expect(() => generarActaConmutacion({ ...BASE, tipoMulta: 3 })).toThrow(/no es conmutable/);
    expect(() => generarActaConmutacion({ ...BASE, tipoMulta: 4 })).toThrow(/no es conmutable/);
  });

  it('concede la conmutación en el ordinal PRIMERO con la actividad y entidad indicadas', () => {
    const acta = generarActaConmutacion(BASE);
    expect(acta.tituloDocumento).toBe('ACTA DE CONMUTACIÓN');
    expect(acta.resuelve[0]).toMatch(/^PRIMERO: DECLARAR LA FIRMEZA/);
    expect(acta.resuelve[0]).toContain('CONCEDER la conmutación');
    expect(acta.resuelve[0]).toContain(BASE.actividadAsignada);
    expect(acta.resuelve[0]).toContain(BASE.entidadPrograma);
  });

  it('sin reincidencia: RESUELVE tiene 4 ordinales', () => {
    const acta = generarActaConmutacion(BASE);
    expect(acta.resuelve).toHaveLength(4);
  });

  it('reincidencia motivada: el incremento se aplica al cobro contingente, no al descuento (no hay dinero de por medio)', () => {
    const acta = generarActaConmutacion({
      ...BASE,
      causal: 'moroso_bdme',
      causalEvidencia: 'Reporte BDME No. 998877, multa impaga del comparendo 17-001-000222.',
    });
    expect(acta.resuelve).toHaveLength(5);
    expect(acta.resuelve.some((r) => r.includes('incremento aplicable al valor de cobro'))).toBe(true);
    const seccionReiteracion = acta.secciones.find((s) => s.titulo?.includes('REITERACIÓN'));
    expect(seccionReiteracion?.parrafos.join(' ')).toContain('numeral 9');
    expect(seccionReiteracion?.parrafos.join(' ')).toContain('Reporte BDME No. 998877');
  });

  it('firma bilateral: solicitado notificado + inspector', () => {
    const acta = generarActaConmutacion(BASE);
    expect(acta.firma).toHaveLength(2);
    expect(acta.firma[0].tipo).toBe('notificado');
  });
});
