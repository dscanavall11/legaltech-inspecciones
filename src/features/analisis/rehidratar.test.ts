import { describe, expect, it } from 'vitest';
import type { CaseParty } from './api';
import { mapaDeSeudonimos, rehidratar, seudonimosSinResolver } from './rehidratar';

const parte = (id: string, fullName: string, identificationNumber: string): CaseParty => ({
  id,
  partyRole: 'querellante',
  identificationType: 'CC',
  identificationNumber,
  fullName,
});

const PARTES = [parte('1', 'Primera Persona', '1000001'), parte('2', 'Segunda Persona', '1000002')];

describe('mapaDeSeudonimos', () => {
  it('numera las partes por id, igual que el backend', () => {
    const mapa = mapaDeSeudonimos(PARTES);
    expect(mapa.get('[PARTE_1]')).toBe('Primera Persona');
    expect(mapa.get('[ID_1]')).toBe('1000001');
    expect(mapa.get('[PARTE_2]')).toBe('Segunda Persona');
  });

  /** Si el índice bailara, [PARTE_1] rehidrataría a otra persona dentro de un fallo firmado. */
  it('el índice no depende del orden en que lleguen las partes', () => {
    const alReves = mapaDeSeudonimos([...PARTES].reverse());
    expect(alReves.get('[PARTE_1]')).toBe('Primera Persona');
  });

  it('omite las partes sin nombre en vez de gastarles un índice', () => {
    const mapa = mapaDeSeudonimos([parte('1', '   ', '1000001'), parte('2', 'La Única', '1000002')]);
    expect(mapa.get('[PARTE_1]')).toBe('La Única');
  });

  /**
   * Sin id no se puede reproducir el orden del backend. Antes que arriesgar un
   * nombre equivocado dentro de un fallo, se deja el marcador visible.
   */
  it('si alguna parte no trae id, no se rehidrata nada', () => {
    const sinId = [{ ...parte('1', 'Con Id', '1'), id: undefined }, parte('2', 'La Otra', '2')];
    expect(mapaDeSeudonimos(sinId).size).toBe(0);
    expect(rehidratar('Compareció [PARTE_1].', mapaDeSeudonimos(sinId))).toBe('Compareció [PARTE_1].');
  });

  it('una parte sin identificación no genera un marcador vacío', () => {
    const mapa = mapaDeSeudonimos([parte('1', 'Sin Cédula', '')]);
    expect(mapa.has('[ID_1]')).toBe(false);
  });
});

describe('rehidratar', () => {
  it('devuelve nombres y cédulas al texto del modelo', () => {
    const texto = 'Compareció [PARTE_1], identificado con [ID_1], contra [PARTE_2].';
    expect(rehidratar(texto, mapaDeSeudonimos(PARTES))).toBe(
      'Compareció Primera Persona, identificado con 1000001, contra Segunda Persona.',
    );
  });

  it('sustituye todas las apariciones, no solo la primera', () => {
    const texto = '[PARTE_1] dijo. Luego [PARTE_1] aportó prueba.';
    expect(rehidratar(texto, mapaDeSeudonimos(PARTES))).toBe(
      'Primera Persona dijo. Luego Primera Persona aportó prueba.',
    );
  });

  it('un marcador sin correspondencia se deja visible, nunca se borra', () => {
    const texto = 'Contra [PARTE_9] no hay registro.';
    expect(rehidratar(texto, mapaDeSeudonimos(PARTES))).toContain('[PARTE_9]');
  });

  it('sin partes registradas el texto queda intacto', () => {
    const texto = 'Compareció [PARTE_1].';
    expect(rehidratar(texto, mapaDeSeudonimos([]))).toBe(texto);
  });
});

describe('seudonimosSinResolver', () => {
  it('nombra los marcadores que quedaron, sin repetirlos', () => {
    expect(seudonimosSinResolver('[PARTE_3] y [PARTE_3] y [ID_4]')).toEqual(['[PARTE_3]', '[ID_4]']);
  });

  it('un texto ya rehidratado no reporta nada', () => {
    expect(seudonimosSinResolver('Compareció Primera Persona.')).toEqual([]);
  });
});
