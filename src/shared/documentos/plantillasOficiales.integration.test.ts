import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { generarDocxDesdeMergeFields } from './mergeFieldDocx';
import { repararValoresFijosActaFirmeza, repararAnioCaratulaExpediente } from './textoFijoDocx';
import { mapearCamposExpedienteOficial, nombreArchivoExpedienteOficial, type DatosExpedienteOficial } from '@/derecho/plantillas/expedienteOficial';
import {
  mapearCamposActaFirmezaOficial,
  nombreArchivoActaFirmezaOficial,
  valoresFijosActaFirmeza,
  type DatosActaFirmezaOficial,
} from '@/derecho/plantillas/actaFirmezaOficial';
import { CATALOGO_ACTA_FIRMEZA, seleccionarPlantillaActaFirmeza } from '@/derecho/plantillas/catalogoActaFirmeza';
import { liquidarMulta } from '@/derecho/multas';

/**
 * Prueba de integración contra las plantillas OFICIALES reales del despacho
 * (`public/Plantillas/`, fuera de git — ver .gitignore: traen datos de casos
 * reales). Se salta automáticamente si el archivo no está presente en este
 * entorno (por ejemplo, en CI o en el checkout de otro desarrollador), para
 * no depender de un archivo con información personal real.
 *
 * Deliberadamente NO se escribe aquí ningún nombre, cédula, dirección,
 * teléfono, fecha o valor monetario real leído de un archivo: el valor "que
 * ya no debe aparecer" se extrae en tiempo de ejecución desde el propio
 * archivo, nunca tecleado en este código fuente.
 */

const RAIZ = path.resolve(__dirname, '../../../public/Plantillas');
const RUTA_EXPEDIENTE = path.join(RAIZ, 'expediente-oficial.docx');
const DIR_ACTAS = path.join(RAIZ, 'Actas de firmeza');

function listarDocxRecursivo(dir: string, base = dir): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = path.join(dir, entrada);
    if (statSync(ruta).isDirectory()) salida.push(...listarDocxRecursivo(ruta, base));
    else if (entrada.endsWith('.docx')) salida.push(path.relative(base, ruta).split(path.sep).join('/'));
  }
  return salida;
}

/** Runs de resultado cacheado (justo después de "separate") — no el texto fijo de la plantilla. */
function valoresCacheados(xml: string): string[] {
  return [
    ...xml.matchAll(/fldCharType="separate"\/><\/w:r><w:r\b[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>([^<]+)<\/w:t>/g),
  ]
    .map((m) => m[1])
    .filter((t) => t.trim().length > 4);
}

const DATOS_EXPEDIENTE_PRUEBA: DatosExpedienteOficial = {
  proceso: '2026-6829',
  comparendo: '17-001-085044',
  articuloNumeral: 'Artículo 92 Numeral 16',
  solicitante: 'CAI CHIPRE',
  solicitado: 'CIUDADANO DE PRUEBA EJEMPLO',
  cedula: '1000000001',
  direccion: 'CALLE DE PRUEBA 1-23',
  telefono: '3000000001',
  fechaComparendo: '2026-04-24',
  hechos: 'Hechos de prueba distintos de cualquier caso real, usados solo para verificar el reemplazo.',
  fechaRecepcion: '2026-04-24',
  fechaConstanciaInasistencia: '2026-05-05',
};

describe.skipIf(!existsSync(RUTA_EXPEDIENTE))(
  'Plantilla oficial real: expediente-oficial.docx (se salta si el archivo no está en este entorno)',
  () => {
    it('el mapeo de producción cubre TODOS los campos MERGEFIELD reales del archivo, repara el AÑO fijo y no deja ningún dato del caso anterior', async () => {
      const plantilla = readFileSync(RUTA_EXPEDIENTE);
      const buffer = plantilla.buffer.slice(plantilla.byteOffset, plantilla.byteOffset + plantilla.byteLength);

      const zipOriginal = await JSZip.loadAsync(buffer);
      const xmlOriginal = await zipOriginal.file('word/document.xml')!.async('string');
      const valoresCacheadosReales = valoresCacheados(xmlOriginal);

      const campos = mapearCamposExpedienteOficial(DATOS_EXPEDIENTE_PRUEBA);
      const anio = '2019'; // deliberadamente distinto del año real del caso cacheado, para probar la reparación
      const { blob, camposEncontrados, camposSinDato } = await generarDocxDesdeMergeFields(buffer, campos, (_p, xml) =>
        repararAnioCaratulaExpediente(xml, anio).xml,
      );

      expect(camposSinDato).toEqual([]);
      expect(camposEncontrados.sort()).toEqual(
        [
          'Proceso', 'Comparendo', 'comparendo', 'Artículo_Y_Númeral', 'Solicitante', 'Solicitado',
          'Cedula_solicitado', 'Dirección_Solicitado', 'Telefono_solicitado', 'Fecha_comparendo',
          'Hechos_descripción_comportamientos', 'fecha_de_recibido_', 'Acto_Administrativo_citación_GED',
          'Policia_', 'direccion_CAI', 'FECHA_AUDIENCIA_',
        ].sort(),
      );

      const zipSalida = await JSZip.loadAsync(await blob.arrayBuffer());
      const xmlSalida = await zipSalida.file('word/document.xml')!.async('string');

      for (const valorCacheado of valoresCacheadosReales) expect(xmlSalida.includes(valorCacheado)).toBe(false);
      expect(xmlSalida).toContain('CIUDADANO DE PRUEBA EJEMPLO');
      expect(xmlSalida).toContain('Hechos de prueba distintos de cualquier caso real');
      expect(xmlSalida).toContain('AÑO:');
      expect(xmlSalida).toContain('2019');

      const imagenOriginal = await zipOriginal.file('word/media/image1.jpg')?.async('nodebuffer');
      const imagenSalida = await zipSalida.file('word/media/image1.jpg')?.async('nodebuffer');
      expect(imagenSalida?.equals(imagenOriginal!)).toBe(true);
      expect(zipSalida.file('[Content_Types].xml')).not.toBeNull();

      const nombreArchivo = nombreArchivoExpedienteOficial(DATOS_EXPEDIENTE_PRUEBA.proceso, DATOS_EXPEDIENTE_PRUEBA.solicitado);
      expect(nombreArchivo).toBe('EXPEDIENTE. QUEJA 2026-6829. CIUDADANO DE PRUEBA EJEMPLO.docx');
    });
  },
);

describe.skipIf(!existsSync(DIR_ACTAS))('Plantillas oficiales reales: Actas de firmeza (se salta si no están en este entorno)', () => {
  it('el catálogo determinístico apunta exactamente a los archivos reales en disco (incluidas las subcarpetas por género) — ni uno de más ni de menos', () => {
    const archivosEnDisco = listarDocxRecursivo(DIR_ACTAS).sort();
    const archivosEnCatalogo = CATALOGO_ACTA_FIRMEZA.map((e) => e.archivo).sort();
    expect(archivosEnCatalogo).toEqual(archivosEnDisco);
  });

  it('todas las plantillas .docx (incluidas las de Femenino/) son ZIP válidos con document.xml y conservan su membrete', async () => {
    const archivos = listarDocxRecursivo(DIR_ACTAS);
    expect(archivos.length).toBe(20);
    for (const archivo of archivos) {
      const buf = readFileSync(path.join(DIR_ACTAS, archivo));
      const zip = await JSZip.loadAsync(buf);
      expect(zip.file('word/document.xml'), archivo).not.toBeNull();
      const tieneMembrete = Object.keys(zip.files).some((n) => /word\/media\//.test(n));
      expect(tieneMembrete, `${archivo} sin imagen de membrete`).toBe(true);
    }
  });

  it('reemplazar campos en cualquier plantilla de Acta real no deja ningún MERGEFIELD sin resolver y conserva el membrete', async () => {
    for (const nombre of listarDocxRecursivo(DIR_ACTAS)) {
      const buf = readFileSync(path.join(DIR_ACTAS, nombre));
      const buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      const zipOriginal = await JSZip.loadAsync(buffer);
      const xmlOriginal = await zipOriginal.file('word/document.xml')!.async('string');
      const nombresDeCampo = [...new Set([...xmlOriginal.matchAll(/MERGEFIELD\s+([^\s<]+)/g)].map((m) => m[1]))];

      const valores = Object.fromEntries(nombresDeCampo.map((n) => [n, `VALOR_PRUEBA_${n}`]));
      const { camposSinDato, blob } = await generarDocxDesdeMergeFields(buffer, valores);
      expect(camposSinDato, nombre).toEqual([]);

      const zipSalida = await JSZip.loadAsync(await blob.arrayBuffer());
      const xmlSalida = await zipSalida.file('word/document.xml')!.async('string');
      for (const n of nombresDeCampo) {
        expect(xmlSalida, `${nombre} — MERGEFIELD ${n}`).toContain(`MERGEFIELD ${n}`);
        expect(xmlSalida, `${nombre} — valor de ${n}`).toContain(`VALOR_PRUEBA_${n}`);
      }

      const imagenOriginal = await zipOriginal.file('word/media/image1.jpg')?.async('nodebuffer');
      const imagenSalida = await zipSalida.file('word/media/image1.jpg')?.async('nodebuffer');
      expect(imagenSalida?.equals(imagenOriginal!), nombre).toBe(true);
    }
  });

  /**
   * Prueba real pedida en la revisión: desde UN MISMO REGISTRO, generar Acta
   * sin reincidencia, Acta 50%, Acta 75% (masculino y femenino) y Expediente,
   * y verificar programáticamente que cada una: usa la plantilla correcta,
   * trae los datos y el valor monetario correctos (calculados, no
   * heredados), no conserva NINGÚN dato del caso real anterior (nombre,
   * cédula, teléfono, dirección, hechos, comparendo, queja, fechas o
   * valores), conserva el membrete y el formato, y arma el nombre de
   * archivo correcto.
   */
  const REGISTRO: Omit<DatosActaFirmezaOficial, 'liquidacion' | 'caso'> = {
    proceso: '2026-9001',
    comparendo: '17-001-999999',
    articuloNumeral: 'Artículo 27 Numeral 6',
    solicitante: 'CAI PRUEBA',
    solicitado: 'CIUDADANO DE PRUEBA EJEMPLO',
    cedula: '1000000002',
    direccion: 'CALLE DE PRUEBA 5-67',
    telefono: '3000000002',
    fechaComparendo: '2026-06-10',
    fechaResolucion: '2026-06-20',
    lugar: 'CALLE DE PRUEBA CON CARRERA DE PRUEBA',
    hechos: 'Relato de hechos exclusivo de esta prueba automática, distinto de cualquier caso real.',
    tipoMulta: 4,
    apelo: false,
  };

  async function generarActaDePrueba(genero: 'masculino' | 'femenino', causal: DatosActaFirmezaOficial['liquidacion']['causal']) {
    const liquidacion = liquidarMulta(4, causal);
    const seleccion = seleccionarPlantillaActaFirmeza({ caso: 'normal', genero, tipoMulta: 4, causal });
    expect(seleccion, `${genero}/${causal}`).not.toBeNull();

    const rutaArchivo = path.join(DIR_ACTAS, ...seleccion!.archivo.split('/'));
    const buf = readFileSync(rutaArchivo);
    const buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const zipOriginal = await JSZip.loadAsync(buffer);
    const xmlOriginal = await zipOriginal.file('word/document.xml')!.async('string');
    const cacheadosDelCasoAnterior = valoresCacheados(xmlOriginal);

    const campos = mapearCamposActaFirmezaOficial({ ...REGISTRO, caso: 'normal', liquidacion });
    const valoresFijos = valoresFijosActaFirmeza(liquidacion);
    const { blob, camposSinDato } = await generarDocxDesdeMergeFields(buffer, campos, (_p, xml) =>
      repararValoresFijosActaFirmeza(xml, valoresFijos).xml,
    );
    expect(camposSinDato, `${genero}/${causal}`).toEqual([]);

    const zipSalida = await JSZip.loadAsync(await blob.arrayBuffer());
    const xmlSalida = await zipSalida.file('word/document.xml')!.async('string');
    return { seleccion: seleccion!, liquidacion, campos, valoresFijos, zipOriginal, xmlOriginal, cacheadosDelCasoAnterior, xmlSalida, zipSalida };
  }

  it.each([
    ['masculino', 'ninguna'],
    ['masculino', 'reiteracion_despues_del_anio'],
    ['masculino', 'reiteracion_dentro_del_anio'],
    ['femenino', 'ninguna'],
    ['femenino', 'reiteracion_despues_del_anio'],
    ['femenino', 'reiteracion_dentro_del_anio'],
  ] as const)('Acta %s / %s: datos, valores y género correctos; cero residuos del caso anterior; membrete y negrita intactos', async (genero, causal) => {
    const { liquidacion, campos, valoresFijos, cacheadosDelCasoAnterior, xmlSalida, zipOriginal, zipSalida } = await generarActaDePrueba(
      genero,
      causal,
    );

    // Datos correctos del registro de prueba.
    expect(xmlSalida).toContain('CIUDADANO DE PRUEBA EJEMPLO');
    expect(xmlSalida).toContain('1000000002');
    expect(xmlSalida).toContain('17-001-999999');
    expect(xmlSalida).toContain('2026-9001');
    expect(xmlSalida).toContain('Relato de hechos exclusivo de esta prueba automática, distinto de cualquier caso real.');
    expect(xmlSalida).toContain('4'); // Tipo_de_multa

    // Valor base calculado (SMDLV real de este tipo/vigencia), no el de la plantilla.
    expect(xmlSalida).toContain(liquidacion.valorBaseLetras);
    if (causal !== 'ninguna') {
      // Valor TOTAL con incremento calculado — la frase fija ya no trae el de otro ciudadano.
      expect(xmlSalida).toContain(`${liquidacion.valorTotalLetras}.`);
    }

    // Género correcto: la plantilla masculina no debe quedar con rastros de "ciudadana" (ni viceversa),
    // más allá de dentro de HECHOS/dirección de prueba que no contienen esas palabras.
    if (genero === 'masculino') expect(xmlSalida).not.toMatch(/\bciudadana\b/);
    else expect(xmlSalida).not.toMatch(/\bciudadano\b/);

    // Cero residuos: ningún valor cacheado del caso real que traía la plantilla sobrevive.
    // Se excluyen los valores que coinciden por casualidad con un valor CORRECTO de esta
    // liquidación (p. ej. "dieciséis (16)" es el SMDLV del tipo 4 para cualquier caso, y el
    // valor base/total en pesos depende solo de tipo+causal+vigencia, no del ciudadano —
    // que el caso de ejemplo haya usado el mismo tipo no es un residuo, es una coincidencia
    // legítima de la fórmula legal).
    const valoresLegitimos = new Set([...Object.values(campos), valoresFijos.anioVigenciaLetras, valoresFijos.valorTotalLetras]);
    for (const valor of cacheadosDelCasoAnterior) {
      if (valoresLegitimos.has(valor)) continue;
      expect(xmlSalida.includes(valor), `residuo "${valor}"`).toBe(false);
    }
    // Tampoco el año de vigencia original, si era distinto del real.
    expect(xmlSalida).not.toMatch(/vigencia[^.]*\(202[0-5]\)/);

    // Membrete e imágenes intactas.
    const imagenOriginal = await zipOriginal.file('word/media/image1.jpg')?.async('nodebuffer');
    const imagenSalida = await zipSalida.file('word/media/image1.jpg')?.async('nodebuffer');
    expect(imagenSalida?.equals(imagenOriginal!)).toBe(true);

    // Negrita conservada: el nombre del presunto infractor sigue dentro de al menos un run <w:b/>.
    expect(xmlSalida).toMatch(/<w:b\/>[\s\S]{0,400}CIUDADANO DE PRUEBA EJEMPLO/);
  });

  it('nombre de archivo correcto para el Acta de la prueba', () => {
    const nombre = nombreArchivoActaFirmezaOficial(REGISTRO.proceso, REGISTRO.solicitado);
    expect(nombre).toBe('ACTA DE FIRMEZA. QUEJA 2026-9001. CIUDADANO DE PRUEBA EJEMPLO.docx');
  });

  it('el año de vigencia fijo se repara incluso cuando Word lo partió en varios runs (familia representante legal / establecimiento)', async () => {
    const candidatos = ['1. REPRESENTANTE LEGAL. MULTA TIPO 2..docx', '4. MULTA TIPO 4. - ESTABLECIMIENTOS DE COMERCIO.docx'];
    for (const nombre of candidatos) {
      const ruta = path.join(DIR_ACTAS, nombre);
      if (!existsSync(ruta)) continue;
      const buf = readFileSync(ruta);
      const buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      const zipOriginal = await JSZip.loadAsync(buffer);
      const xmlOriginal = await zipOriginal.file('word/document.xml')!.async('string');
      if (!/dos mil[a-záéíóúñ\s]{0,20}\(\d{4}\)/.test(xmlOriginal.replace(/<[^>]+>/g, ''))) continue; // esta plantilla no trae el patrón

      const { xml, aplicadas } = repararValoresFijosActaFirmeza(xmlOriginal, { anioVigenciaLetras: 'dos mil diecinueve (2019)' });
      expect(aplicadas, nombre).toContain('vigencia');
      expect(xml, nombre).toContain('dos mil diecinueve (2019)');
      // Solo se verifica la frase de vigencia (no todo el documento: Fecha_comparendo/
      // Fecha_resolución_ son campos MERGEFIELD aparte, sin tocar en esta prueba, y
      // legítimamente pueden seguir mostrando el año del caso de ejemplo cacheado).
      expect(xml, nombre).not.toMatch(/vigen[^.]{0,40}\(2026\)/i);
    }
  });
});
