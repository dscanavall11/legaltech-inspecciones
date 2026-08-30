import { describe, it, expect } from 'vitest';
import { generarActaProntoPago, type DatosActaProntoPago } from './actaProntoPago';
import { diasHabilesDesde } from '../diasHabiles';
import { fechaALetras } from '../letras';
import { TERMINOS_COMPARENDO } from '../multas';

const BASE: DatosActaProntoPago = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  proceso: '2026-0501',
  fechaResolucion: '2026-04-27',
  comparendo: '17-001-085044',
  fechaComparendo: '2026-04-24',
  articuloNumeral: 'Artículo 95 Numeral 1',
  solicitado: 'PEDRO ANTONIO EJEMPLO RÍOS',
  cedula: '1002500001',
  direccion: 'CARRERA 17 CALLE 19 28',
  telefono: '3170000001',
  tipoMulta: 4,
  causal: 'ninguna',
  documentoCobro: 'RC-2026-000501',
};

describe('generarActaProntoPago — plantilla del despacho (art. 180 par.)', () => {
  it('declara la firmeza y aplica el 50% en el mismo ordinal PRIMERO', () => {
    const acta = generarActaProntoPago(BASE);
    expect(acta.tituloDocumento).toBe('ACTA PRONTO PAGO');
    expect(acta.resuelve[0]).toMatch(/^PRIMERO: DECLARAR LA FIRMEZA/);
    expect(acta.resuelve[0]).toContain('APLICAR el descuento del cincuenta por ciento (50%)');
    // Tipo 4: valorBase 933.816, sin incremento -> descuento 466.908 -> a pagar 466.908
    expect(acta.resuelve[0]).toContain('CUATROCIENTOS SESENTA Y SEIS MIL NOVECIENTOS OCHO');
  });

  it('sin reincidencia: RESUELVE tiene 4 ordinales (sin bloque condicional)', () => {
    const acta = generarActaProntoPago(BASE);
    expect(acta.resuelve).toHaveLength(4);
    expect(acta.resuelve.some((r) => r.includes('reincidencia expuesta'))).toBe(false);
  });

  it('la reincidencia nunca se aplica sola: motiva la causal y, si hay evidencia, la incluye', () => {
    const acta = generarActaProntoPago({
      ...BASE,
      causal: 'reiteracion_dentro_del_anio',
      causalEvidencia: 'Consulta RNMC folio 12, comparendo 17-001-000111 en firme el 2026-02-01.',
    });
    expect(acta.resuelve).toHaveLength(5);
    expect(acta.resuelve.some((r) => r.includes('reincidencia expuesta'))).toBe(true);
    const seccionReiteracion = acta.secciones.find((s) => s.titulo?.includes('REITERACIÓN'));
    expect(seccionReiteracion?.parrafos.join(' ')).toContain('numeral 10');
    expect(seccionReiteracion?.parrafos.join(' ')).toContain('Consulta RNMC folio 12');
  });

  it('firma bilateral: solicitado notificado + inspector', () => {
    const acta = generarActaProntoPago(BASE);
    expect(acta.firma).toHaveLength(2);
    expect(acta.firma[0].tipo).toBe('notificado');
    expect(acta.firma[0].nombre).toBe(BASE.solicitado);
    expect(acta.firma[1].nombre).toBe(BASE.inspectorNombre);
  });

  it('el plazo advertido (SEGUNDO) es el vencimiento de los 5 días hábiles del art. 180 par.', () => {
    const acta = generarActaProntoPago(BASE);
    const limite = diasHabilesDesde(new Date(BASE.fechaComparendo), TERMINOS_COMPARENDO.prontoPagoDias);
    const isoLimite = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')}`;
    expect(acta.resuelve[1]).toContain(fechaALetras(isoLimite));
  });
});
