import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { generarDocxDesdeMergeFields } from './mergeFieldDocx';
import { mapearCamposExpedienteOficial, type DatosExpedienteOficial } from '@/derecho/plantillas/expedienteOficial';
import { CATALOGO_ACTA_FIRMEZA } from '@/derecho/plantillas/catalogoActaFirmeza';

/**
 * Prueba de integración contra las plantillas OFICIALES reales del despacho
 * (`public/Plantillas/`, fuera de git — ver .gitignore: traen datos de casos
 * reales). Se salta automáticamente si el archivo no está presente en este
 * entorno (por ejemplo, en CI o en el checkout de otro desarrollador), para
 * no depender de un archivo con información personal real.
 *
 * Deliberadamente NO se escribe aquí ningún nombre, cédula, dirección o
 * teléfono real leído del archivo: el valor "que ya no debe aparecer" se
 * extrae en tiempo de ejecución desde el propio archivo, nunca tecleado en
 * este código fuente.
 */

const RAIZ = path.resolve(__dirname, '../../../public/Plantillas');
const RUTA_EXPEDIENTE = path.join(RAIZ, 'expediente-oficial.docx');

const DATOS_PRUEBA: DatosExpedienteOficial = {
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
    it('el mapeo de producción cubre TODOS los campos MERGEFIELD reales del archivo — ninguno queda con el dato de ejemplo cacheado', async () => {
      const plantilla = readFileSync(RUTA_EXPEDIENTE);
      const buffer = plantilla.buffer.slice(plantilla.byteOffset, plantilla.byteOffset + plantilla.byteLength);

      // Valores actualmente cacheados en el archivo real (de un caso real) — se leen en
      // tiempo de ejecución, nunca se escriben literalmente en este archivo de prueba.
      const zipOriginal = await JSZip.loadAsync(buffer);
      const xmlOriginal = await zipOriginal.file('word/document.xml')!.async('string');
      // Solo el texto cacheado DENTRO de un campo MERGEFIELD (justo después de
      // "separate") — no el texto fijo de la plantilla (títulos, etiquetas), que
      // debe seguir intacto.
      const valoresCacheadosReales = [
        ...xmlOriginal.matchAll(
          /fldCharType="separate"\/><\/w:r><w:r\b[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>([^<]+)<\/w:t>/g,
        ),
      ]
        .map((m) => m[1])
        .filter((t) => t.trim().length > 4); // descarta ruido corto

      const campos = mapearCamposExpedienteOficial(DATOS_PRUEBA);
      const { blob, camposEncontrados, camposSinDato } = await generarDocxDesdeMergeFields(buffer, campos);

      expect(camposSinDato).toEqual([]);
      expect(camposEncontrados.sort()).toEqual(
        [
          'Proceso',
          'Comparendo',
          'comparendo',
          'Artículo_Y_Númeral',
          'Solicitante',
          'Solicitado',
          'Cedula_solicitado',
          'Dirección_Solicitado',
          'Telefono_solicitado',
          'Fecha_comparendo',
          'Hechos_descripción_comportamientos',
          'fecha_de_recibido_',
          'Acto_Administrativo_citación_GED',
          'Policia_',
          'direccion_CAI',
          'FECHA_AUDIENCIA_',
        ].sort(),
      );

      const salidaBuffer = await blob.arrayBuffer();
      const zipSalida = await JSZip.loadAsync(salidaBuffer);
      const xmlSalida = await zipSalida.file('word/document.xml')!.async('string');

      // Ningún valor de ejemplo del caso real anterior debe sobrevivir en el documento generado.
      for (const valorCacheado of valoresCacheadosReales) {
        expect(xmlSalida.includes(valorCacheado)).toBe(false);
      }
      // Los datos de la prueba sí deben estar.
      expect(xmlSalida).toContain('CIUDADANO DE PRUEBA EJEMPLO');
      expect(xmlSalida).toContain('Hechos de prueba distintos de cualquier caso real');

      // El membrete (imagen de la cabecera) se conserva byte a byte: no se tocó header1.xml/media.
      const imagenOriginal = await zipOriginal.file('word/media/image1.jpg')?.async('nodebuffer');
      const imagenSalida = await zipSalida.file('word/media/image1.jpg')?.async('nodebuffer');
      expect(imagenOriginal).toBeDefined();
      expect(imagenSalida?.equals(imagenOriginal!)).toBe(true);

      // Sigue siendo un .docx válido (zip con las partes obligatorias).
      expect(zipSalida.file('[Content_Types].xml')).not.toBeNull();
      expect(zipSalida.file('word/document.xml')).not.toBeNull();
    });
  },
);

const DIR_ACTAS = path.join(RAIZ, 'Actas de firmeza');

describe.skipIf(!existsSync(DIR_ACTAS))('Plantillas oficiales reales: Actas de firmeza (se salta si no están en este entorno)', () => {
  it('el catálogo determinístico apunta exactamente a los archivos reales en disco — ni uno de más ni de menos', async () => {
    const { readdirSync } = await import('node:fs');
    const archivosEnDisco = readdirSync(DIR_ACTAS).filter((f) => f.endsWith('.docx')).sort();
    const archivosEnCatalogo = CATALOGO_ACTA_FIRMEZA.map((e) => e.archivo).sort();
    expect(archivosEnCatalogo).toEqual(archivosEnDisco);
  });

  it('todas las plantillas .docx del directorio son ZIP válidos con document.xml y conservan su membrete', async () => {
    const { readdirSync } = await import('node:fs');
    const archivos = readdirSync(DIR_ACTAS).filter((f) => f.endsWith('.docx'));
    expect(archivos.length).toBeGreaterThan(0);

    for (const archivo of archivos) {
      const buf = readFileSync(path.join(DIR_ACTAS, archivo));
      const zip = await JSZip.loadAsync(buf);
      expect(zip.file('word/document.xml'), archivo).not.toBeNull();
      const tieneMembrete = Object.keys(zip.files).some((n) => /word\/media\//.test(n));
      expect(tieneMembrete, `${archivo} sin imagen de membrete`).toBe(true);
    }
  });

  it('reemplazar campos en una plantilla de Acta real no deja ningún MERGEFIELD sin resolver y conserva el membrete', async () => {
    const archivo = 'Actas de firmeza no requiere un nombre fijo: se toma la primera .docx del directorio';
    const { readdirSync } = await import('node:fs');
    const nombre = readdirSync(DIR_ACTAS).find((f) => f.endsWith('.docx'));
    expect(nombre, archivo).toBeDefined();

    const buf = readFileSync(path.join(DIR_ACTAS, nombre!));
    const buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const zipOriginal = await JSZip.loadAsync(buffer);
    const xmlOriginal = await zipOriginal.file('word/document.xml')!.async('string');
    const nombresDeCampo = [...new Set([...xmlOriginal.matchAll(/MERGEFIELD\s+([^\s<]+)/g)].map((m) => m[1]))];

    const valores = Object.fromEntries(nombresDeCampo.map((n) => [n, `VALOR_PRUEBA_${n}`]));
    const { camposSinDato, blob } = await generarDocxDesdeMergeFields(buffer, valores);
    expect(camposSinDato).toEqual([]);

    const salidaBuffer = await blob.arrayBuffer();
    const zipSalida = await JSZip.loadAsync(salidaBuffer);
    const xmlSalida = await zipSalida.file('word/document.xml')!.async('string');
    // Los códigos de campo (instrText "MERGEFIELD Nombre") se conservan intactos —
    // solo se reemplaza el resultado cacheado, no la vinculación del campo.
    for (const n of nombresDeCampo) {
      expect(xmlSalida).toContain(`MERGEFIELD ${n}`);
      expect(xmlSalida).toContain(`VALOR_PRUEBA_${n}`);
    }

    const imagenOriginal = await zipOriginal.file('word/media/image1.jpg')?.async('nodebuffer');
    const imagenSalida = await zipSalida.file('word/media/image1.jpg')?.async('nodebuffer');
    expect(imagenSalida?.equals(imagenOriginal!)).toBe(true);
  });
});
