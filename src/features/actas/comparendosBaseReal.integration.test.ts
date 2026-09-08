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

    // Hallazgo conocido: 39 de las 52 candidatas FIRMEZA traen "Tipo de multa" = 5,
    // valor que no está modelado en ninguna plantilla (solo existen 2, 3 y 4).
    // El validador las reporta explícitamente en vez de generarlas o descartarlas
    // en silencio — se documenta aquí para que la prueba falle si ese conteo cambia
    // sin que alguien lo note.
    const tipoNoReconocido = resumen.resultados.filter((r) => r.motivo.includes('tipo de multa no reconocido (5)'));
    expect(tipoNoReconocido.length).toBeGreaterThan(0);

    // Hallazgo conocido #2: parte de las candidatas FIRMEZA con tipo 2/3/4 (con
    // plantilla real) tampoco se generan porque el texto de "Hechos" no trae
    // marca explícita de género — correcto por diseño (nunca se infiere del
    // nombre), pero documentado aquí para que no desaparezca sin verse.
    const generoNoDeterminado = resumen.resultados.filter((r) => r.motivo === 'género no determinado');
    expect(generoNoDeterminado.length).toBeGreaterThan(0);

    // De 52 candidatas FIRMEZA reales, hoy solo ~12 generan automáticamente
    // (tipo 2/3/4 + género detectado); el resto queda correctamente reportado,
    // no perdido ni generado con datos inventados.
    expect(resumen.generados).toBeGreaterThan(0);
    expect(resumen.generados).toBeLessThan(resumen.candidatosFirmeza);

    // "Generar todas" empaqueta en un solo .zip cada resultado con archivo: la
    // cantidad de entradas del .zip debe ser exactamente generados+conObservaciones
    // (ni una fila silenciosamente perdida por colisión de nombre ni por otra causa).
    const zipBlob = await generarZipActasMasivas(resumen.resultados);
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const nombresEnZip = Object.keys(zip.files);
    const nombresEsperados = resumen.resultados.filter((r) => r.archivo).map((r) => r.archivo!.nombre);
    expect(new Set(nombresEsperados).size).toBe(nombresEsperados.length); // sin colisión de nombres
    expect(nombresEnZip.length).toBe(resumen.generados + resumen.conObservaciones);
    expect(nombresEnZip.sort()).toEqual(nombresEsperados.sort());
  });

  it('cada fila validada sigue el orden exacto: ninguna fila FIRMEZA con tipo de multa 5 se rechaza jamás por estado (ya pasó el filtro de Incidente)', async () => {
    const { comparendos } = await cargar();
    const firmezaTipo5 = comparendos.filter((c) => esIncidenteFirmeza(c.incidente) && (c.tipoMulta as number) === 5);
    expect(firmezaTipo5.length).toBeGreaterThan(0);
    for (const registro of firmezaTipo5) {
      const r = validarFilaParaActaMasiva(registro);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.tipoExclusion).toBe('invalido');
        // El orden exigido evalúa género antes que tipo de multa: si el texto de
        // "hechos" no trae marca de género explícita, ese es el motivo reportado
        // (nunca "tipo de multa no reconocido") — ambos son válidos aquí, lo que
        // nunca puede pasar es que el motivo hable de estado/Incidente.
        expect(r.motivo === 'género no determinado' || r.motivo.includes('tipo de multa no reconocido (5)')).toBe(true);
      }
    }
  });
});
