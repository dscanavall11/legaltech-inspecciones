import { describe, it, expect } from 'vitest';
import { derivarRequisitosFallo, requisitosFalloCumplidos, type EntradaRequisitosFallo } from './falloRequisitos';

const BASE: EntradaRequisitosFallo = {
  modalFallo: 'emitir_fallo',
  sentido: null,
  varianteFallo: '',
  cuentaRecaudo: '',
  titularCuenta: '',
  nitTitular: '',
  tieneFechaAudienciaAnterior: false,
};

describe('derivarRequisitosFallo — emitir_fallo', () => {
  it('exige sentido y variante cuando aún no se han elegido', () => {
    const requisitos = derivarRequisitosFallo(BASE);
    expect(requisitos).toHaveLength(1);
    expect(requisitos[0]).toEqual({ key: 'sentido-variante', label: 'Sentido y variante de la decisión', cumplido: false });
    expect(requisitosFalloCumplidos(requisitos)).toBe(false);
  });

  it('absuelve_unica: solo requiere sentido/variante, ningún otro requisito', () => {
    const requisitos = derivarRequisitosFallo({ ...BASE, sentido: 'absuelve', varianteFallo: 'absuelve_unica' });
    expect(requisitos.map((r) => r.key)).toEqual(['sentido-variante']);
    expect(requisitosFalloCumplidos(requisitos)).toBe(true);
  });

  it('absuelve_continuacion: además exige la fecha de la audiencia previa', () => {
    const sinFecha = derivarRequisitosFallo({ ...BASE, sentido: 'absuelve', varianteFallo: 'absuelve_continuacion' });
    expect(sinFecha.map((r) => r.key)).toEqual(['sentido-variante', 'fecha-audiencia-anterior']);
    expect(requisitosFalloCumplidos(sinFecha)).toBe(false);

    const conFecha = derivarRequisitosFallo({
      ...BASE,
      sentido: 'absuelve',
      varianteFallo: 'absuelve_continuacion',
      tieneFechaAudienciaAnterior: true,
    });
    expect(requisitosFalloCumplidos(conFecha)).toBe(true);
  });

  it('sanciona_continuacion: exige fecha de audiencia previa y los tres datos de recaudo', () => {
    const vacio = derivarRequisitosFallo({ ...BASE, sentido: 'sanciona', varianteFallo: 'sanciona_continuacion' });
    expect(vacio.map((r) => r.key)).toEqual([
      'sentido-variante',
      'fecha-audiencia-anterior',
      'cuenta-recaudo',
      'titular-cuenta',
      'nit-titular',
    ]);
    expect(requisitosFalloCumplidos(vacio)).toBe(false);

    const completo = derivarRequisitosFallo({
      ...BASE,
      sentido: 'sanciona',
      varianteFallo: 'sanciona_continuacion',
      tieneFechaAudienciaAnterior: true,
      cuentaRecaudo: 'Ahorros 123',
      titularCuenta: 'Municipio de Manizales',
      nitTitular: '900123456-7',
    });
    expect(requisitosFalloCumplidos(completo)).toBe(true);
  });
});

describe('derivarRequisitosFallo — fallo_por_inasistencia', () => {
  it('no exige sentido/variante (se fijan automáticamente) pero sí fecha previa y datos de recaudo', () => {
    const requisitos = derivarRequisitosFallo({
      ...BASE,
      modalFallo: 'fallo_por_inasistencia',
      varianteFallo: 'inasistencia',
    });
    expect(requisitos.map((r) => r.key)).toEqual(['fecha-audiencia-anterior', 'cuenta-recaudo', 'titular-cuenta', 'nit-titular']);
    expect(requisitosFalloCumplidos(requisitos)).toBe(false);

    const completo = derivarRequisitosFallo({
      ...BASE,
      modalFallo: 'fallo_por_inasistencia',
      varianteFallo: 'inasistencia',
      tieneFechaAudienciaAnterior: true,
      cuentaRecaudo: 'Ahorros 123',
      titularCuenta: 'Municipio de Manizales',
      nitTitular: '900123456-7',
    });
    expect(requisitosFalloCumplidos(completo)).toBe(true);
  });
});
