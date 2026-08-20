import { describe, expect, it } from 'vitest';
import {
  ACEPTA_EXPEDIENTE,
  avisoDeRechazo,
  avisoDeTamano,
  esFormatoDeExpediente,
  MAX_MB_EXPEDIENTE,
  separarPorFormato,
} from './formatos';

describe('esFormatoDeExpediente', () => {
  // Un escáner de despacho entrega ACTA.PDF en mayúsculas y media inspección
  // trabaja con .tif; con la lista anterior los dos desaparecían sin aviso.
  it.each(['querella.pdf', 'ACTA.PDF', 'Escaneo.TIF', 'audiencia.m4a', 'reporte.xlsx', 'citacion.eml'])(
    'admite %s',
    (nombre) => expect(esFormatoDeExpediente(nombre)).toBe(true),
  );

  it.each(['programa.exe', 'archivo.zip', 'sin-extension'])('rechaza %s', (nombre) =>
    expect(esFormatoDeExpediente(nombre)).toBe(false),
  );
});

describe('separarPorFormato', () => {
  it('devuelve los rechazados, no solo los admitidos', () => {
    const r = separarPorFormato([
      { name: 'querella.pdf' },
      { name: 'malware.exe' },
      { name: 'acta.docx' },
    ]);
    expect(r.admitidos.map((a) => a.name)).toEqual(['querella.pdf', 'acta.docx']);
    expect(r.rechazados.map((a) => a.name)).toEqual(['malware.exe']);
  });
});

describe('avisoDeRechazo', () => {
  it('nombra el archivo, para que el inspector sepa cuál quedó fuera', () => {
    expect(avisoDeRechazo([{ name: 'malware.exe' }])).toContain('malware.exe');
  });
});

describe('ACEPTA_EXPEDIENTE', () => {
  // Las tres zonas de carga del expediente comparten esta constante; que una
  // sea mas estrecha que otra fue exactamente el fallo que se corrigio aqui.
  it('cubre lo que el paso de documentos ya aceptaba', () => {
    ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.doc', '.docx', '.mp3', '.wav'].forEach(
      (ext) => expect(ACEPTA_EXPEDIENTE).toContain(ext),
    );
  });
});

describe('tope de tamaño', () => {
  // El servidor devuelve 413 sin cuerpo: si el cliente no comprueba el tope, el
  // inspector solo ve "no se pudo subir" y no sabe que el problema es el peso.
  it('separa los que pasan del tope sin confundirlos con formato invalido', () => {
    const r = separarPorFormato([
      { name: 'escaneo.pdf', size: 60 * 1024 * 1024 },
      { name: 'acta.pdf', size: 2 * 1024 * 1024 },
      { name: 'malware.exe', size: 10 },
    ]);
    expect(r.admitidos.map((a) => a.name)).toEqual(['acta.pdf']);
    expect(r.pesados.map((a) => a.name)).toEqual(['escaneo.pdf']);
    expect(r.rechazados.map((a) => a.name)).toEqual(['malware.exe']);
  });

  it('el aviso dice el peso real y el tope, no solo que fallo', () => {
    const aviso = avisoDeTamano('escaneo.pdf', 60 * 1024 * 1024);
    expect(aviso).toContain('60.0 MB');
    expect(aviso).toContain(`${MAX_MB_EXPEDIENTE} MB`);
  });
});
