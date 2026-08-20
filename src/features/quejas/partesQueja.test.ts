import { describe, expect, it } from 'vitest';
import {
  aCasePartiesQueja,
  camposQuejaPorVerificar,
  faltantesParaDecision,
  fusionarExtraidasQueja,
  leerPartesQueja,
  PARTES_QUEJA_VACIAS,
} from './partesQueja';

describe('fusionarExtraidasQueja', () => {
  it.each([
    'presunto infractor',
    'Infractor',
    'ciudadano comparendado',
    'objetante',
    'PRESUNTA INFRACTORA',
  ])('«%s» cae en la casilla del presunto infractor', (rol) => {
    const r = fusionarExtraidasQueja(PARTES_QUEJA_VACIAS, [{ role: rol, fullName: 'Quien objetó' }]);
    expect(r.infractor.nombre).toBe('Quien objetó');
  });

  // La queja es oficiosa: no hay contraparte. Quien impuso el comparendo se
  // registra aparte, y el analizador no debe colarla como sujeto procesal.
  it('la autoridad que impuso el comparendo no ocupa la casilla del infractor', () => {
    const r = fusionarExtraidasQueja(PARTES_QUEJA_VACIAS, [
      { role: 'autoridad de policía', fullName: 'Patrullero que impuso' },
    ]);
    expect(r.infractor.nombre).toBe('');
  });

  it('no pisa lo que el inspector ya escribió', () => {
    const conNombre = {
      ...PARTES_QUEJA_VACIAS,
      infractor: { ...PARTES_QUEJA_VACIAS.infractor, nombre: 'Lo que puso el inspector' },
    };
    const r = fusionarExtraidasQueja(conNombre, [{ role: 'infractor', fullName: 'Otro' }]);
    expect(r.infractor.nombre).toBe('Lo que puso el inspector');
  });

  it('vuelca los datos de contacto que trae el documento', () => {
    const r = fusionarExtraidasQueja(PARTES_QUEJA_VACIAS, [
      { role: 'infractor', fullName: 'X', address: 'Calle 5 # 6-7', phone: '3110000000' },
    ]);
    expect(r.infractor.direccion).toBe('Calle 5 # 6-7');
    expect(r.infractor.telefono).toBe('3110000000');
  });

  it('sin extracción devuelve la ficha intacta', () => {
    expect(fusionarExtraidasQueja(PARTES_QUEJA_VACIAS, undefined)).toEqual(PARTES_QUEJA_VACIAS);
  });
});

describe('faltantesParaDecision', () => {
  it('exige infractor identificado y comparendo, que son de lo que trata el expediente', () => {
    expect(faltantesParaDecision(PARTES_QUEJA_VACIAS)).toEqual([
      'Nombre del presunto infractor',
      'Identificación del presunto infractor',
      'Número del comparendo',
      'Artículo y numeral de la Ley 1801 de 2016',
    ]);
  });
});

describe('aCasePartiesQueja', () => {
  it('la autoridad va con su propio rol, no como contraparte', () => {
    const partes = {
      ...PARTES_QUEJA_VACIAS,
      infractor: { ...PARTES_QUEJA_VACIAS.infractor, nombre: 'Quien objetó', identificacion: '9' },
      autoridadImpone: 'Patrullero',
    };
    expect(aCasePartiesQueja(partes)).toEqual([
      {
        partyRole: 'infractor',
        identificationType: 'CC',
        identificationNumber: '9',
        fullName: 'Quien objetó',
      },
      {
        partyRole: 'autoridad',
        identificationType: 'N/A',
        identificationNumber: '',
        fullName: 'Patrullero',
      },
    ]);
  });

  // legalcase rechaza una parte sin nombre (columna NOT NULL) y media parte no
  // es una parte: la ficha a medio llenar no debe reventar el autoguardado.
  it('una ficha vacía no envía partes', () => {
    expect(aCasePartiesQueja(PARTES_QUEJA_VACIAS)).toEqual([]);
  });
});

describe('leerPartesQueja', () => {
  it('un expediente sin metadata devuelve la ficha vacía, no undefined', () => {
    expect(leerPartesQueja(null)).toEqual(PARTES_QUEJA_VACIAS);
  });

  it('conserva los campos que la metadata guardada no cubre', () => {
    const raw = JSON.stringify({ partes: { numeroComparendo: '11001-1' } });
    const r = leerPartesQueja(raw);
    expect(r.numeroComparendo).toBe('11001-1');
    expect(r.infractor).toEqual(PARTES_QUEJA_VACIAS.infractor);
  });
});

describe('camposQuejaPorVerificar', () => {
  it('nombra solo lo que la máquina propuso, para que el inspector lo coteje', () => {
    const campos = camposQuejaPorVerificar([
      { role: 'infractor', fullName: 'Quien objetó', address: 'Calle 5' },
    ]);
    expect(campos).toEqual(['nombre del presunto infractor', 'dirección del presunto infractor']);
  });
});
