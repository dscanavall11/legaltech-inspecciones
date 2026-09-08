import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parsearBdComparendos, fechaLetrasAIso } from './comparendos';

describe('fechaLetrasAIso — fechas en letras de la BD del despacho', () => {
  it('convierte la forma "día (dd) de mes de año (yyyy)"', () => {
    expect(fechaLetrasAIso('primero (01) de enero de dos mil veintiséis (2026)')).toBe('2026-01-01');
    expect(fechaLetrasAIso('veinticuatro (24) de abril de dos mil veintiséis (2026)')).toBe('2026-04-24');
    expect(fechaLetrasAIso('veintitrés (23) de enero de dos mil veintiséis (2026)')).toBe('2026-01-23');
  });
});

describe('parsearBdComparendos — estructura de la BD del despacho', () => {
  it('mapea los encabezados reales (con tildes y espacios sobrantes)', async () => {
    const fila = {
      'Proceso': '2026-557',
      'Solicitado': 'NOMBRE DE PRUEBA',
      'Cedula solicitado': '1053000000',
      'Comparendo': '17-001-6-2026-63',
      'Fecha comparendo': 'primero (01) de enero de dos mil veintiséis (2026)',
      'lugar del comportamiento': 'CRA 32 CALLE 27',
      'Dirección Solicitado': 'CRA 32 CALLE 27',
      'Telefono solicitado': '3180000000',
      'Hechos (descripción comportamientos)': 'Hechos de prueba.',
      'Apelo SI/no': 'NO',
      'Solicitante': 'CAI EL NEVADO',
      'Artículo Y Númeral': 'Artículo 27 Numeral 6',
      'Descripcion de la conducta': 'Portar armas…',
      'Tipo de multa': 2,
    };
    const hoja = XLSX.utils.json_to_sheet([fila]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'BD');
    const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const archivo = new File([buffer], 'bd.xlsx');

    const { comparendos } = await parsearBdComparendos(archivo);
    const [c] = comparendos;
    expect(c.comparendo).toBe('17-001-6-2026-63');
    expect(c.fechaComparendo).toBe('2026-01-01');
    expect(c.solicitado).toBe('NOMBRE DE PRUEBA');
    expect(c.articuloNumeral).toBe('Artículo 27 Numeral 6');
    expect(c.tipoMulta).toBe(2);
    expect(c.apelo).toBe(false);
  });

  it('lee la columna oficial "Genero", normalizada (trim + sin distinguir mayúsculas/minúsculas)', async () => {
    async function generoDeFila(valor: unknown) {
      const fila = {
        'Proceso': '2026-1',
        'Solicitado': 'PRUEBA',
        'Cedula solicitado': '1',
        'Comparendo': '17-001-1',
        'Fecha comparendo': 'primero (01) de enero de dos mil veintiséis (2026)',
        'Tipo de multa': 2,
        'Genero': valor,
      };
      const hoja = XLSX.utils.json_to_sheet([fila]);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'BD');
      const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
      const { comparendos } = await parsearBdComparendos(new File([buffer], 'bd.xlsx'));
      return comparendos[0].genero;
    }
    expect(await generoDeFila('Masculino')).toBe('masculino');
    expect(await generoDeFila(' masculino ')).toBe('masculino');
    expect(await generoDeFila('MASCULINO')).toBe('masculino');
    expect(await generoDeFila('Femenino')).toBe('femenino');
    expect(await generoDeFila('Femenino ')).toBe('femenino');
    expect(await generoDeFila(' femenino ')).toBe('femenino');
    expect(await generoDeFila('')).toBeNull();
    expect(await generoDeFila('Otro')).toBeNull();
  });

  it('descarta filas sin datos mínimos', async () => {
    const hoja = XLSX.utils.json_to_sheet([{ Proceso: 'x', Comparendo: '', 'Tipo de multa': 9 }]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'BD');
    const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const { comparendos } = await parsearBdComparendos(new File([buffer], 'bd.xlsx'));
    expect(comparendos).toHaveLength(0);
  });
});
