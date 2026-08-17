import { describe, expect, it } from 'vitest';
import { PARTES_VACIAS, type PartesQuerella } from './partes';
import { camposPorVerificar, fusionarExtraidas, type ParteExtraida } from './partesExtraidas';

const EXTRAIDAS: ParteExtraida[] = [
  {
    role: 'querellante',
    fullName: 'Nombre leído del documento',
    identificationNumber: '0000001',
    capacity: 'poseedor',
  },
  { role: 'querellado', fullName: 'Otro nombre leído' },
];

describe('fusionarExtraidas', () => {
  it('reparte las partes por su rol', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, EXTRAIDAS);
    expect(r.querellante.nombre).toBe('Nombre leído del documento');
    expect(r.querellante.identificacion).toBe('0000001');
    expect(r.querellado.nombre).toBe('Otro nombre leído');
    expect(r.calidadQuerellante).toBe('poseedor');
  });

  it('reconoce las grafías que usan los documentos reales', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, [
      { role: 'Presunto Infractor', fullName: 'Quien figura como infractor' },
    ]);
    expect(r.querellado.nombre).toBe('Quien figura como infractor');
  });

  it('un rol desconocido no se cuela en ninguna casilla', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, [{ role: 'testigo', fullName: 'Un testigo' }]);
    expect(r.querellante.nombre).toBe('');
    expect(r.querellado.nombre).toBe('');
  });

  it('NO pisa lo que el inspector ya escribió', () => {
    const conDatos: PartesQuerella = {
      ...PARTES_VACIAS,
      querellante: { ...PARTES_VACIAS.querellante, nombre: 'Lo que puso el inspector' },
      calidadQuerellante: 'propietario',
    };
    const r = fusionarExtraidas(conDatos, EXTRAIDAS);
    expect(r.querellante.nombre).toBe('Lo que puso el inspector');
    expect(r.calidadQuerellante).toBe('propietario');
    expect(r.querellado.nombre).toBe('Otro nombre leído');
  });

  it('un campo en blanco del analizador no escribe vacíos', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, [{ role: 'querellante', fullName: '   ' }]);
    expect(r.querellante.nombre).toBe('');
  });

  it('sin extracción devuelve la ficha intacta', () => {
    expect(fusionarExtraidas(PARTES_VACIAS, undefined)).toEqual(PARTES_VACIAS);
    expect(fusionarExtraidas(PARTES_VACIAS, [])).toEqual(PARTES_VACIAS);
  });

  it('conserva los campos que la extracción no cubre', () => {
    const conMatricula = { ...PARTES_VACIAS, matriculaInmobiliaria: '123-456' };
    expect(fusionarExtraidas(conMatricula, EXTRAIDAS).matriculaInmobiliaria).toBe('123-456');
  });
});

describe('camposPorVerificar', () => {
  it('nombra solo lo que la máquina propuso, para que el inspector lo coteje', () => {
    const campos = camposPorVerificar(EXTRAIDAS);
    expect(campos).toContain('nombre del querellante');
    expect(campos).toContain('calidad en que actúa');
    // No propuso identificación del querellado: no se pide verificar lo que no dijo.
    expect(campos).not.toContain('identificación del querellado');
  });

  it('sin extracción no hay nada que verificar', () => {
    expect(camposPorVerificar(undefined)).toEqual([]);
  });
});
