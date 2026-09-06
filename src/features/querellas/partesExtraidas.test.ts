import { describe, expect, it } from 'vitest';
import { PARTES_VACIAS, type PartesQuerella } from './partes';
import {
  camposPorVerificar,
  fusionarExtraidas,
  partesSinUbicar,
  type ParteExtraida,
} from './partesExtraidas';

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

describe('el rol viene del documento, no de un vocabulario cerrado', () => {
  // legalRules.st le ordena al modelo copiar el rol TAL COMO lo escribe el
  // documento. Comparar por igualdad exacta dejaba la ficha vacia en cuanto el
  // acta escribia algo mas que la palabra suelta.
  it.each([
    ['Parte querellante', 'querellante'],
    ['QUERELLANTE', 'querellante'],
    ['Querellante (propietaria)', 'querellante'],
    ['querellada', 'querellado'],
    ['Parte querellada', 'querellado'],
    ['Presunto infractor', 'querellado'],
    ['señor querellado', 'querellado'],
  ])('%s cae en la casilla del %s', (rol, casilla) => {
    const r = fusionarExtraidas(PARTES_VACIAS, [{ role: rol, fullName: 'Quien figura' }]);
    expect(r[casilla as 'querellante' | 'querellado'].nombre).toBe('Quien figura');
  });

  it('quien comparece POR una parte no ocupa su casilla', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, [
      { role: 'Apoderado del querellante', fullName: 'El abogado' },
      { role: 'querellante', fullName: 'La parte' },
    ]);
    expect(r.querellante.nombre).toBe('La parte');
  });

  it('un apoderado solo no rellena la casilla de la parte', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, [
      { role: 'apoderada del querellado', fullName: 'La abogada' },
    ]);
    expect(r.querellado.nombre).toBe('');
  });

  it('nombra las partes cuyo rol no cae en ninguna casilla, en vez de perderlas', () => {
    expect(
      partesSinUbicar([
        { role: 'coadyuvante', fullName: 'Quien coadyuva' },
        { role: 'querellante', fullName: 'La parte' },
        { role: 'testigo', fullName: 'Un testigo' },
      ]),
    ).toEqual(['Quien coadyuva (coadyuvante)']);
  });
});

describe('datos de contacto y tipo de documento', () => {
  const CONTACTO: ParteExtraida[] = [
    {
      role: 'querellante',
      fullName: 'Quien promueve',
      identificationType: 'ce',
      identificationNumber: '9',
      address: 'Calle 1 # 2-3',
      phone: '3000000000',
      email: 'correo@ejemplo.co',
    },
  ];

  it('vuelca direccion, telefono, correo y sigla del documento', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, CONTACTO);
    expect(r.querellante.direccion).toBe('Calle 1 # 2-3');
    expect(r.querellante.telefono).toBe('3000000000');
    expect(r.querellante.correo).toBe('correo@ejemplo.co');
    expect(r.querellante.tipoIdentificacion).toBe('CE');
  });

  it('sin sigla en el documento se conserva la que ya tiene la ficha', () => {
    const r = fusionarExtraidas(PARTES_VACIAS, [{ role: 'querellante', fullName: 'X' }]);
    expect(r.querellante.tipoIdentificacion).toBe('CC');
  });

  it('la direccion se pide verificar como cualquier otro dato de la maquina', () => {
    expect(camposPorVerificar(CONTACTO)).toContain('dirección del querellante');
  });
});
