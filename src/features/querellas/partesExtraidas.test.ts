import { describe, expect, it } from 'vitest';
import { PARTES_VACIAS, type PartesQuerella } from './partes';
import { camposPorVerificar, fusionarExtraidas, type PartesExtraidas } from './partesExtraidas';

const EXTRAIDAS: PartesExtraidas = {
  querellanteNombre: 'Nombre leído del documento',
  querellanteIdentificacion: '0000001',
  calidadQuerellante: 'poseedor',
  querelladoNombre: 'Otro nombre leído',
  inmuebleDireccion: 'Calle de prueba 1-2',
};

describe('fusionarExtraidas', () => {
  it('rellena la ficha vacía con lo que leyó de los documentos', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, EXTRAIDAS);
    expect(r.querellante.nombre).toBe('Nombre leído del documento');
    expect(r.querellante.identificacion).toBe('0000001');
    expect(r.calidadQuerellante).toBe('poseedor');
    expect(r.inmuebleDireccion).toBe('Calle de prueba 1-2');
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
    // Los huecos sí se rellenan.
    expect(r.querellado.nombre).toBe('Otro nombre leído');
  });

  it('un campo en blanco del analizador no borra nada ni escribe vacíos', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, { querellanteNombre: '   ' });
    expect(r.querellante.nombre).toBe('');
  });

  it('sin extracción devuelve la ficha intacta', () => {
    expect(fusionarExtraidas(PARTES_VACIAS, undefined)).toEqual(PARTES_VACIAS);
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
    expect(campos).toContain('dirección del inmueble');
    // No propuso identificación del querellado: no se pide verificar lo que no dijo.
    expect(campos).not.toContain('identificación del querellado');
  });

  it('sin extracción no hay nada que verificar', () => {
    expect(camposPorVerificar(undefined)).toEqual([]);
  });
});
