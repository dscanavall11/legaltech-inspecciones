import { describe, expect, it } from 'vitest';
import { aPartesExtraidas } from './partes';
import { fusionarExtraidas } from '@/features/querellas/partesExtraidas';
import { PARTES_VACIAS } from '@/features/querellas/partes';
import { fusionarExtraidasQueja } from '@/features/quejas/partesQueja';
import { PARTES_QUEJA_VACIAS } from '@/features/quejas/partesQueja';

describe('aPartesExtraidas', () => {
  it('traduce el vocabulario del agente de recepción al del analizador', () => {
    expect(
      aPartesExtraidas([
        { rol: 'querellante', tipoId: 'CC', numeroId: '1', nombre: 'Parte Uno' },
      ]),
    ).toEqual([
      {
        role: 'querellante',
        fullName: 'Parte Uno',
        identificationType: 'CC',
        identificationNumber: '1',
      },
    ]);
  });

  it('descarta las partes sin nombre: media parte no identifica a nadie', () => {
    expect(aPartesExtraidas([{ rol: 'querellado', nombre: '  ' }])).toEqual([]);
  });

  it('tolera las claves nulas que el agente devuelve cuando el dato no consta', () => {
    const [parte] = aPartesExtraidas([{ rol: 'infractor', nombre: 'X', tipoId: null, numeroId: null }]);
    expect(parte.identificationNumber).toBe('');
  });
});

// El objetivo de la traducción: que las dos fuentes —el agente de recepción y
// el analizador del fallo— desemboquen en el MISMO emparejador de roles y la
// MISMA fusión, sin un segundo vocabulario que mantener.
describe('lo extraído por recepción entra por la fusión que ya existía', () => {
  it('reparte las partes de una querella', () => {
    const extraidas = aPartesExtraidas([
      { rol: 'Parte querellante', nombre: 'Quien promueve', numeroId: '9' },
      { rol: 'querellada', nombre: 'Contra quien se dirige' },
    ]);
    const r = fusionarExtraidas(PARTES_VACIAS, extraidas);
    expect(r.querellante.nombre).toBe('Quien promueve');
    expect(r.querellante.identificacion).toBe('9');
    expect(r.querellado.nombre).toBe('Contra quien se dirige');
  });

  it('reparte el presunto infractor de una queja', () => {
    const extraidas = aPartesExtraidas([{ rol: 'presunto infractor', nombre: 'Quien objetó' }]);
    expect(fusionarExtraidasQueja(PARTES_QUEJA_VACIAS, extraidas).infractor.nombre).toBe(
      'Quien objetó',
    );
  });
});
