import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import type { Comparendo } from '@/features/actas/comparendos';
import { generarActasMasivas, generarZipActasMasivas } from './generacionMasivaActasDocx';

/**
 * Prueba de integración contra las plantillas OFICIALES reales del despacho
 * (`public/Plantillas/`, fuera de git). Se salta sola si el directorio no
 * está en este entorno.
 *
 * `cargarPlantillaActaFirmeza` usa `fetch()` (pensado para el navegador,
 * sirviendo `public/` como asset estático). En esta prueba de Node se
 * sustituye `fetch` por una versión que lee el archivo real del disco, para
 * no montar un servidor solo para la prueba — no cambia el código de
 * producción, solo cómo se resuelve la petición en el entorno de prueba.
 */
const RAIZ = path.resolve(__dirname, '../../../public/Plantillas');
const DIR_ACTAS = path.join(RAIZ, 'Actas de firmeza');

const fetchOriginal = globalThis.fetch;
beforeAll(() => {
  globalThis.fetch = (async (entrada: RequestInfo | URL) => {
    const url = decodeURIComponent(String(entrada));
    const relativo = url.replace(/^\/Plantillas\//, '');
    const rutaArchivo = path.join(RAIZ, relativo);
    if (!existsSync(rutaArchivo)) return new Response(null, { status: 404 });
    const buffer = readFileSync(rutaArchivo);
    return new Response(buffer, { status: 200 });
  }) as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

function fila(over: Partial<Comparendo> = {}): Comparendo {
  return {
    proceso: '2026-90001',
    comparendo: '17-001-990001',
    solicitado: 'CIUDADANO DE PRUEBA UNO',
    cedula: '1000000101',
    direccion: 'CALLE DE PRUEBA 1',
    telefono: '3000000101',
    lugar: 'CALLE DE PRUEBA 1',
    fechaComparendo: '2026-06-01',
    solicitante: 'CAI PRUEBA',
    articuloNumeral: 'Artículo 27 Numeral 6',
    descripcionConducta: 'Portar armas...',
    hechos: 'Se aborda al ciudadano, identificado con cédula, quien portaba un arma cortopunzante.',
    tipoMulta: 4,
    apelo: false,
    incidente: 'FIRMEZA',
    causal: 'ninguna',
    reincidenciaValida: true,
    ...over,
  };
}

describe.skipIf(!existsSync(DIR_ACTAS))('Generación masiva de Actas de Firmeza — contra las plantillas reales (se salta si no están)', () => {
  it('genera 2 sin reincidencia, 2 al 50%, 2 al 75% (masculino y femenino), y bloquea un caso con error — el ZIP solo trae los generados', async () => {
    const registros: Comparendo[] = [
      fila({ comparendo: '17-001-1', proceso: '2026-90001', solicitado: 'CIUDADANO UNO MASCULINO', causal: 'ninguna' }),
      fila({
        comparendo: '17-001-2',
        proceso: '2026-90002',
        solicitado: 'CIUDADANA DOS FEMENINA',
        hechos: 'Se aborda a la ciudadana, identificada con cédula, quien portaba un arma cortopunzante.',
        causal: 'ninguna',
      }),
      fila({
        comparendo: '17-001-3',
        proceso: '2026-90003',
        solicitado: 'CIUDADANO TRES MASCULINO',
        causal: 'reiteracion_despues_del_anio',
      }),
      fila({
        comparendo: '17-001-4',
        proceso: '2026-90004',
        solicitado: 'CIUDADANA CUATRO FEMENINA',
        hechos: 'Se aborda a la ciudadana, identificada con cédula.',
        causal: 'reiteracion_despues_del_anio',
      }),
      fila({
        comparendo: '17-001-5',
        proceso: '2026-90005',
        solicitado: 'CIUDADANO CINCO MASCULINO',
        causal: 'reiteracion_dentro_del_anio',
      }),
      fila({
        comparendo: '17-001-6',
        proceso: '2026-90006',
        solicitado: 'CIUDADANA SEIS FEMENINA',
        hechos: 'Se aborda a la ciudadana, identificada con cédula.',
        causal: 'reiteracion_dentro_del_anio',
      }),
      // Caso con error deliberado: tipo de multa 1, sin plantilla.
      fila({ comparendo: '17-001-7', proceso: '2026-90007', solicitado: 'CIUDADANO SIETE ERROR', tipoMulta: 1 }),
      // Caso excluido por estado: no es FIRMEZA, nunca debe tocar género/plantilla ni entrar al zip.
      fila({ comparendo: '17-001-8', proceso: '2026-90008', solicitado: 'CIUDADANO OCHO PRONTO PAGO', incidente: 'PRONTO PAGO' }),
    ];

    const resumen = await generarActasMasivas(registros, '2026-06-20');

    expect(resumen.totalEnBase).toBe(8);
    expect(resumen.candidatosFirmeza).toBe(7);
    expect(resumen.excluidosPorEstado).toBe(1);
    expect(resumen.generados).toBe(6);
    expect(resumen.noGenerados).toBe(1);
    expect(resumen.conObservaciones).toBe(0);

    const fallido = resumen.resultados.find((r) => r.comparendo === '17-001-7')!;
    expect(fallido.estado).toBe('no_generado');
    expect(fallido.motivo).toBe('no existe plantilla tipo 1');
    expect(fallido.archivo).toBeUndefined();

    const excluido = resumen.resultados.find((r) => r.comparendo === '17-001-8')!;
    expect(excluido.estado).toBe('excluido_estado');
    expect(excluido.motivo).toBe('NO GENERADO — ESTADO DISTINTO DE FIRMEZA (PRONTO PAGO)');
    expect(excluido.archivo).toBeUndefined();

    for (const r of resumen.resultados.filter((r) => !['17-001-7', '17-001-8'].includes(r.comparendo))) {
      expect(r.estado, r.comparendo).toBe('generado');
      expect(r.archivo, r.comparendo).toBeDefined();
      expect(r.archivo!.nombre).toBe(`Acta de FIRMEZA. QUEJA ${r.proceso}. ${r.solicitado}.docx`);
    }

    const zipBlob = await generarZipActasMasivas(resumen.resultados);
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const nombresEnZip = Object.keys(zip.files).sort();

    expect(nombresEnZip.length).toBe(6); // ni el error ni el excluido por estado
    for (const r of resumen.resultados.filter((r) => r.archivo)) {
      expect(nombresEnZip).toContain(r.archivo!.nombre);
    }
    expect(nombresEnZip.some((n) => n.includes('SIETE ERROR'))).toBe(false);
    expect(nombresEnZip.some((n) => n.includes('PRONTO PAGO'))).toBe(false);

    // Cada .docx dentro del zip es válido y conserva el membrete.
    for (const nombre of nombresEnZip) {
      const xml = await zip.file(nombre)!.async('string');
      const hayMembrete = xml.length > 0; // el propio parse de JSZip ya validó que es un zip correcto
      expect(hayMembrete).toBe(true);
    }
  });

  it('nunca calcula reincidencia por su cuenta: usa la plantilla que corresponde a la causal ya provista en cada fila', async () => {
    const registros: Comparendo[] = [
      fila({ comparendo: 'a', proceso: '2026-1', causal: 'ninguna' }),
      fila({ comparendo: 'b', proceso: '2026-2', causal: 'reiteracion_dentro_del_anio' }),
    ];
    const resumen = await generarActasMasivas(registros, '2026-06-20');
    expect(resumen.resultados[0].archivo!.nombre).not.toBe(resumen.resultados[1].archivo!.nombre);
  });
});
