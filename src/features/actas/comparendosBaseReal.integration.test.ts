import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { esIncidenteFirmeza, parsearBdComparendos } from './comparendos';
import { validarFilaParaActaMasiva } from '@/derecho/plantillas/generacionMasivaActas';
import { generarActasMasivas, generarZipActasMasivas } from '@/shared/documentos/generacionMasivaActasDocx';
import JSZip from 'jszip';

// `cargarPlantillaActaFirmeza` usa `fetch()` pensado para servir `public/`
// como asset estático del navegador. En Node se sustituye por una lectura
// directa del disco — no cambia el código de producción, solo cómo se
// resuelve la petición en el entorno de prueba (mismo patrón que
// generacionMasivaActasDocx.integration.test.ts).
const RAIZ_PLANTILLAS = path.resolve(__dirname, '../../../public/Plantillas');
const fetchOriginal = globalThis.fetch;
beforeAll(() => {
  if (!existsSync(RAIZ_PLANTILLAS)) return;
  globalThis.fetch = (async (entrada: RequestInfo | URL) => {
    const url = decodeURIComponent(String(entrada));
    const relativo = url.replace(/^\/Plantillas\//, '');
    const rutaArchivo = path.join(RAIZ_PLANTILLAS, relativo);
    if (!existsSync(rutaArchivo)) return new Response(null, { status: 404 });
    const buffer = readFileSync(rutaArchivo);
    return new Response(buffer, { status: 200 });
  }) as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

/**
 * Prueba de integración contra la base REAL del despacho
 * ("BD. COMPARENDOS 2026 - PRUEBA.xlsx"), fuera de git (`local-data/`, ver
 * .gitignore). Se salta sola si el archivo no está en este entorno — no
 * rompe a otros desarrolladores ni a CI, que no tienen ni deben tener este
 * archivo con datos reales de ciudadanos.
 *
 * Verifica exactamente los conteos que reportó el despacho al describir la
 * estructura real de columnas "Incidente" y "Reincidencia".
 */
const RUTA_BD = path.resolve(__dirname, '../../../local-data/BD. COMPARENDOS 2026 - PRUEBA.xlsx');

describe.skipIf(!existsSync(RUTA_BD))('Base real de comparendos — filtro por Incidente=FIRMEZA (se salta si no está local-data/)', () => {
  async function cargar() {
    const buffer = readFileSync(RUTA_BD);
    const archivo = { name: 'BD. COMPARENDOS 2026 - PRUEBA.xlsx', arrayBuffer: async () => buffer } as unknown as File;
    return parsearBdComparendos(archivo);
  }

  it('lee las 59 filas de la base real sin descartar ninguna', async () => {
    const { comparendos, reporte } = await cargar();
    expect(reporte.totalFilas).toBe(59);
    expect(comparendos).toHaveLength(59);
    expect(reporte.descartadas).toBe(0);
  });

  it('exactamente 52 filas con Incidente=FIRMEZA y 7 excluidas por otro estado (NO ESTA - REVISAR)', async () => {
    const { comparendos } = await cargar();
    const firmeza = comparendos.filter((c) => esIncidenteFirmeza(c.incidente));
    const excluidas = comparendos.filter((c) => !esIncidenteFirmeza(c.incidente));
    expect(firmeza).toHaveLength(52);
    expect(excluidas).toHaveLength(7);
    expect(excluidas.every((c) => c.incidente.trim().toUpperCase() === 'NO ESTA - REVISAR')).toBe(true);
  });

  it('reincidencia: 16 "sin reincidencia", 8 al 50%, 28 al 75%, entre las filas FIRMEZA', async () => {
    const { comparendos } = await cargar();
    const firmeza = comparendos.filter((c) => esIncidenteFirmeza(c.incidente));
    expect(firmeza.filter((c) => c.reincidenciaValida && c.causal === 'ninguna')).toHaveLength(16);
    expect(firmeza.filter((c) => c.reincidenciaValida && c.causal === 'reiteracion_despues_del_anio')).toHaveLength(8);
    expect(firmeza.filter((c) => c.reincidenciaValida && c.causal === 'reiteracion_dentro_del_anio')).toHaveLength(28);
    // 16 + 8 + 28 = 52: ninguna fila FIRMEZA de esta base real quedó con reincidencia inválida/sin definir.
    expect(firmeza.filter((c) => !c.reincidenciaValida)).toHaveLength(0);
  });

  it('las 7 filas excluidas por estado nunca traen Reincidencia (columna vacía en la base real)', async () => {
    const { comparendos } = await cargar();
    const excluidas = comparendos.filter((c) => !esIncidenteFirmeza(c.incidente));
    expect(excluidas.every((c) => !c.reincidenciaValida)).toBe(true);
  });

  it('columna oficial "Genero": 54 masculino y 5 femenino en toda la base (48/4 entre las 52 FIRMEZA), todas reconocidas', async () => {
    const { comparendos } = await cargar();
    expect(comparendos.filter((c) => c.genero === 'masculino')).toHaveLength(54);
    expect(comparendos.filter((c) => c.genero === 'femenino')).toHaveLength(5);
    expect(comparendos.filter((c) => c.genero === null)).toHaveLength(0);

    const firmeza = comparendos.filter((c) => esIncidenteFirmeza(c.incidente));
    expect(firmeza.filter((c) => c.genero === 'masculino')).toHaveLength(48);
    expect(firmeza.filter((c) => c.genero === 'femenino')).toHaveLength(4);
  });

  it('generación masiva contra el universo completo: ningún registro no-FIRMEZA entra al lote de candidatos ni al zip', async () => {
    const { comparendos } = await cargar();
    const resumen = await generarActasMasivas(comparendos, '2026-06-20');

    expect(resumen.totalEnBase).toBe(59);
    expect(resumen.candidatosFirmeza).toBe(52);
    expect(resumen.excluidosPorEstado).toBe(7);
    expect(resumen.generados + resumen.conObservaciones + resumen.noGenerados).toBe(52);

    // Ningún resultado con archivo generado corresponde a una fila excluida por estado.
    for (const r of resumen.resultados) {
      if (r.estado === 'excluido_estado') expect(r.archivo).toBeUndefined();
    }

    // Con la columna "Genero" ya como fuente principal y el tipo de multa
    // corregido en la base real (ya no trae el valor 5, sin modelar, de
    // rondas anteriores), las 52 candidatas FIRMEZA generan sin excepción:
    // ninguna se pierde por "género no determinado" ni por tipo sin plantilla.
    expect(resumen.generados + resumen.conObservaciones).toBe(52);
    expect(resumen.noGenerados).toBe(0);

    // "Generar todas" empaqueta en un solo .zip cada resultado con archivo: la
    // cantidad de entradas del .zip debe ser exactamente generados+conObservaciones
    // (ni una fila silenciosamente perdida por colisión de nombre ni por otra causa).
    const zipBlob = await generarZipActasMasivas(resumen.resultados);
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const nombresEnZip = Object.keys(zip.files);
    const nombresEsperados = resumen.resultados.filter((r) => r.archivo).map((r) => r.archivo!.nombre);
    expect(new Set(nombresEsperados).size).toBe(nombresEsperados.length); // sin colisión de nombres
    expect(nombresEnZip.length).toBe(52);
    expect(nombresEnZip.sort()).toEqual(nombresEsperados.sort());
  });

  it('la plantilla elegida coincide con el género de cada fila (columna, no detección textual)', async () => {
    const { comparendos } = await cargar();
    const firmeza = comparendos.filter((c) => esIncidenteFirmeza(c.incidente));
    for (const registro of firmeza) {
      const r = validarFilaParaActaMasiva(registro);
      expect(r.ok, `${registro.proceso}: ${!r.ok ? r.motivo : ''}`).toBe(true);
      if (r.ok) {
        // Las plantillas femeninas viven bajo "Femenino/"; las masculinas, en
        // la raíz — es la única marca fiable en los nombres reales (algunas
        // usan "M."/"F.", otras "MASCULINO"/no lo dicen en absoluto).
        expect(r.seleccion.archivo.startsWith('Femenino/'), `${registro.proceso}: ${r.seleccion.archivo}`).toBe(
          registro.genero === 'femenino',
        );
      }
    }
  });

  it('un valor de "Genero" no reconocido (o vacío) cae a la detección textual, y si tampoco resuelve, reporta el mensaje exacto', async () => {
    const { comparendos } = await cargar();
    const base = comparendos.find((c) => esIncidenteFirmeza(c.incidente))!;
    const sinColumna = { ...base, genero: null, hechos: 'Se realiza verificación de requisitos del establecimiento.' };
    const r = validarFilaParaActaMasiva(sinColumna);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('GÉNERO NO DETERMINADO — REQUIERE REVISIÓN');
  });
});
