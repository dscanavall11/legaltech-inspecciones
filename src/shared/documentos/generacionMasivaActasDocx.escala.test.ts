import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import type { Comparendo } from '@/features/actas/comparendos';
import { compararPorProceso } from '@/features/actas/comparendos';
import { generarActasMasivas, generarZipActasMasivas } from './generacionMasivaActasDocx';

/**
 * Pruebas de escala del modo masivo — SIN datos personales reales (todo
 * sintético). Objetivo: demostrar que "Generar todas"/"Generar seleccionadas"
 * no tienen ningún límite fijo (nada de 59, 100, 200... hardcodeado en el
 * código de producción) y que, para un lote donde CADA fila es válida
 * (Incidente=FIRMEZA, género detectable, tipo de multa modelado), el número
 * de actas generadas es exactamente el tamaño del lote — sin importar si son
 * 10, 59, 200 o 300 — y que el orden final sigue PROCESO, no el orden de
 * entrada ni el de finalización de cada promesa.
 *
 * Usa las plantillas OFICIALES reales (`public/Plantillas/`, fuera de git) —
 * mismo motor MERGEFIELD que la generación individual. Se salta sola si el
 * directorio no está en este entorno.
 */
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

/** Genera un lote sintético de N filas, TODAS válidas (Incidente FIRMEZA, género
 * detectable, tipo 2/3/4 modelado, reincidencia reconocida) — para que el
 * único límite a la cantidad generada sea el tamaño del lote, no la calidad
 * de los datos. Alterna género, tipo y causal para variar la plantilla
 * elegida en cada fila. El PROCESO se numera 1..N pero se entrega DESORDENADO
 * (para probar que el orden final lo pone el motor, no el de entrada).
 */
function loteSinteticoValido(n: number): Comparendo[] {
  const causales: Comparendo['causal'][] = ['ninguna', 'reiteracion_despues_del_anio', 'reiteracion_dentro_del_anio'];
  const tipos: Comparendo['tipoMulta'][] = [2, 3, 4];
  const filas: Comparendo[] = [];
  for (let i = 1; i <= n; i++) {
    const esMasculino = i % 2 === 0;
    filas.push({
      proceso: `2026-${i}`,
      comparendo: `17-001-ESCALA-${String(i).padStart(4, '0')}`,
      solicitado: esMasculino ? `CIUDADANO DE PRUEBA ESCALA ${i}` : `CIUDADANA DE PRUEBA ESCALA ${i}`,
      cedula: String(1_000_000_000 + i),
      direccion: `CALLE DE PRUEBA ${i}`,
      telefono: `300${String(i).padStart(7, '0')}`,
      lugar: `CALLE DE PRUEBA ${i}`,
      fechaComparendo: '2026-01-01',
      solicitante: 'CAI PRUEBA',
      articuloNumeral: 'Artículo 27 Numeral 6',
      descripcionConducta: 'Portar armas, elementos cortantes...',
      hechos: esMasculino
        ? 'Se aborda al ciudadano, identificado con cédula, quien portaba un arma cortopunzante.'
        : 'Se aborda a la ciudadana, identificada con cédula, quien portaba un arma cortopunzante.',
      tipoMulta: tipos[i % tipos.length],
      apelo: false,
      incidente: 'FIRMEZA',
      causal: causales[i % causales.length],
      reincidenciaValida: true,
      genero: null, // se resuelve por evidencia textual en "hechos", como antes de la columna "Genero"
    });
  }
  // Desordenar (patrón determinístico, no aleatorio, para que el test sea
  // reproducible): invertir y luego intercalar.
  const desordenado = [...filas].reverse();
  return desordenado;
}

describe.skipIf(!existsSync(RAIZ_PLANTILLAS))('Generación masiva — pruebas de escala (datos 100% sintéticos, sin límite fijo)', () => {
  it.each([10, 59, 200, 300])('lote de %i filas, todas válidas → se generan todas, sin duplicados, en orden de PROCESO', async (n) => {
    const registros = loteSinteticoValido(n);
    expect(registros).toHaveLength(n); // el lote de entrada tiene el tamaño esperado

    let ultimoProgreso = { actual: 0, total: 0 };
    let llamadasProgreso = 0;
    const resumen = await generarActasMasivas(registros, '2026-06-20', (actual, total) => {
      llamadasProgreso++;
      ultimoProgreso = { actual, total };
    });

    // Nada de límites fijos: el total sale del tamaño real del lote.
    expect(resumen.totalEnBase).toBe(n);
    expect(resumen.candidatosFirmeza).toBe(n);
    expect(resumen.excluidosPorEstado).toBe(0);
    expect(resumen.noGenerados).toBe(0);
    expect(resumen.conObservaciones).toBe(0);
    expect(resumen.generados).toBe(n); // TOTAL_DISPONIBLES = TOTAL_GENERADAS + TOTAL_FALLIDAS, con 0 fallidas

    // El progreso se reportó fila por fila y terminó exactamente en (n, n).
    expect(llamadasProgreso).toBe(n);
    expect(ultimoProgreso).toEqual({ actual: n, total: n });

    // Orden final: natural por PROCESO, no el orden desordenado de entrada.
    const procesosEnResultado = resumen.resultados.map((r) => r.proceso);
    const procesosOrdenados = [...procesosEnResultado].sort(
      (a, b) => compararPorProceso({ proceso: a } as Comparendo, { proceso: b } as Comparendo),
    );
    expect(procesosEnResultado).toEqual(procesosOrdenados);
    expect(procesosEnResultado[0]).toBe('2026-1');
    expect(procesosEnResultado[procesosEnResultado.length - 1]).toBe(`2026-${n}`);

    // El .zip trae exactamente n archivos, todos con nombre distinto.
    const zipBlob = await generarZipActasMasivas(resumen.resultados);
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const nombresEnZip = Object.keys(zip.files);
    expect(nombresEnZip).toHaveLength(n);
    expect(new Set(nombresEnZip).size).toBe(n);

    // Precisión: primera, una intermedia y última acta deben ser DOCX válidos
    // (firma ZIP correcta) y no estar vacíos — la misma cadena de generación
    // que el modo individual, no una versión degradada para lotes grandes.
    const indicesAMuestrear = [0, Math.floor(n / 2), n - 1];
    for (const idx of indicesAMuestrear) {
      const resultado = resumen.resultados[idx];
      expect(resultado.archivo).toBeDefined();
      const archivo = zip.file(resultado.archivo!.nombre);
      expect(archivo, resultado.archivo!.nombre).not.toBeNull();
      const contenido = await archivo!.async('uint8array');
      expect(contenido.length).toBeGreaterThan(1000); // no vacío ni truncado
      expect(contenido[0]).toBe(0x50); // firma ZIP/OOXML ("PK")
      expect(contenido[1]).toBe(0x4b);
    }
  }, 60_000);
});
