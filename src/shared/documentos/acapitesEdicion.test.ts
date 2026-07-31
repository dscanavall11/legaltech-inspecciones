import { describe, it, expect } from 'vitest';
import type { Acapite } from './acapites';
import {
  textoAcapite,
  parrafosDesdeTexto,
  aplicarEdicionesAcapites,
  acapitesModificados,
  acapitesSinGuardar,
} from './acapitesEdicion';

const ACAPITES: Acapite[] = [
  { id: 'hechos', titulo: 'II. Hechos', resumen: 'Relato de los hechos.', parrafos: ['Primer párrafo.', 'Segundo párrafo.'], fuente: 'ia' },
  { id: 'resuelve', titulo: 'Parte resolutiva', resumen: 'Decisión.', parrafos: ['PRIMERO: algo.'], fuente: 'plantilla' },
];

describe('textoAcapite / parrafosDesdeTexto', () => {
  it('unen y separan párrafos por línea en blanco de forma inversa', () => {
    const texto = textoAcapite(ACAPITES[0]);
    expect(texto).toBe('Primer párrafo.\n\nSegundo párrafo.');
    expect(parrafosDesdeTexto(texto)).toEqual(['Primer párrafo.', 'Segundo párrafo.']);
  });

  it('descarta líneas en blanco sobrantes al separar', () => {
    expect(parrafosDesdeTexto('Uno.\n\n\n\nDos.\n\n')).toEqual(['Uno.', 'Dos.']);
  });
});

describe('aplicarEdicionesAcapites', () => {
  it('deja intactos los acápites sin edición registrada', () => {
    const resultado = aplicarEdicionesAcapites(ACAPITES, {});
    expect(resultado).toEqual(ACAPITES);
  });

  it('reemplaza los párrafos del acápite editado, preservando título/resumen/fuente', () => {
    const resultado = aplicarEdicionesAcapites(ACAPITES, { hechos: 'Nuevo párrafo único.' });
    expect(resultado[0]).toEqual({ ...ACAPITES[0], parrafos: ['Nuevo párrafo único.'] });
    expect(resultado[1]).toEqual(ACAPITES[1]); // resuelve no tenía edición
  });

  it('aplica varias ediciones a la vez, cada una sobre su propio acápite', () => {
    const resultado = aplicarEdicionesAcapites(ACAPITES, {
      hechos: 'Hechos editados.',
      resuelve: 'PRIMERO: editado.\n\nSEGUNDO: nuevo ordinal.',
    });
    expect(resultado[0].parrafos).toEqual(['Hechos editados.']);
    expect(resultado[1].parrafos).toEqual(['PRIMERO: editado.', 'SEGUNDO: nuevo ordinal.']);
  });
});

describe('acapitesModificados', () => {
  it('no reporta nada cuando no hay ediciones', () => {
    expect(acapitesModificados(ACAPITES, {})).toEqual([]);
  });

  it('ignora una edición que coincide exactamente con el texto original (reabrir y cerrar sin tocar)', () => {
    const ediciones = { hechos: textoAcapite(ACAPITES[0]) };
    expect(acapitesModificados(ACAPITES, ediciones)).toEqual([]);
  });

  it('reporta solo los acápites cuyo texto editado difiere del original', () => {
    const ediciones = { hechos: 'Cambiado.', resuelve: textoAcapite(ACAPITES[1]) };
    expect(acapitesModificados(ACAPITES, ediciones)).toEqual(['hechos']);
  });
});

describe('acapitesSinGuardar', () => {
  it('no reporta nada cuando la edición en curso coincide con la última guardada', () => {
    const guardadas = { hechos: 'Editado y guardado.' };
    expect(acapitesSinGuardar(guardadas, guardadas)).toEqual([]);
  });

  it('reporta un acápite recién editado que aún no se guardó', () => {
    const guardadas = {};
    const enCurso = { hechos: 'Recién escrito, sin guardar.' };
    expect(acapitesSinGuardar(enCurso, guardadas)).toEqual(['hechos']);
  });

  it('se vacía justo después de guardar, aunque siga difiriendo del original (no confundir con acapitesModificados)', () => {
    const edicionesGuardadas = { hechos: 'Editado y ya guardado — distinto del original.' };
    // Tras un guardarCambios exitoso, `ediciones` pasa a ser exactamente lo guardado.
    expect(acapitesSinGuardar(edicionesGuardadas, edicionesGuardadas)).toEqual([]);
    // Pero acapitesModificados (contra el original) lo sigue marcando "Editado".
    expect(acapitesModificados(ACAPITES, edicionesGuardadas)).toEqual(['hechos']);
  });

  it('reporta un acápite modificado tras guardarse una vez y volver a editarse', () => {
    const edicionesGuardadas = { hechos: 'Primera versión guardada.' };
    const enCurso = { hechos: 'Segunda edición, todavía sin guardar.' };
    expect(acapitesSinGuardar(enCurso, edicionesGuardadas)).toEqual(['hechos']);
  });
});
