import { fechaALetras } from '../letras';
import type { LiquidacionMulta } from '../multas';
import type { CasoEspecialActa } from './catalogoActaFirmeza';

/**
 * Mapeo de datos hacia las plantillas oficiales reales del Acta de Firmeza
 * (`public/Plantillas/Actas de firmeza/*.docx`). Igual que
 * `expedienteOficial.ts`: los nombres de campo son EXACTAMENTE los
 * MERGEFIELD que ya traen los 13 archivos reales, no una convención
 * inventada. La elección de CUÁL archivo abrir la hace
 * `catalogoActaFirmeza.ts`; este módulo solo llena los campos de ese
 * archivo, sin redactar texto.
 *
 * Importante — dos límites reales de las plantillas, no de este código:
 * 1) El valor "vigencia <año>" que acompaña a `valor_Salarios` es texto fijo
 *    del despacho (no MERGEFIELD); si cambia el año, hay que editarlo a mano
 *    en el .docx generado.
 * 2) En las plantillas de REINCIDENCIA (50%/75%), el "VALOR TOTAL A
 *    RECAUDAR" (base + incremento) también es texto fijo tomado del último
 *    caso real combinado — no es un campo. Debe verificarse y corregirse a
 *    mano en el Word generado antes de notificar.
 */
export interface DatosActaFirmezaOficial {
  proceso: string;
  comparendo: string;
  articuloNumeral: string;
  solicitante: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono: string;
  fechaComparendo: string; // ISO
  fechaResolucion: string; // ISO
  lugar: string;
  hechos: string;
  tipoMulta: number;
  liquidacion: LiquidacionMulta;
  descripcionConducta?: string;
  apelo: boolean;
  caso: CasoEspecialActa;
  /** Solo para menor_representante_legal / establecimiento_comercio. */
  representanteNombre?: string;
  representanteCedula?: string;
}

/** Campos comunes a todas las familias "persona natural" (normal, extranjero) — 15 MERGEFIELD reales del archivo. */
export function mapearCamposActaFirmezaOficial(d: DatosActaFirmezaOficial): Record<string, string> {
  const base: Record<string, string> = {
    Proceso: d.proceso,
    Fecha_resolución_: fechaALetras(d.fechaResolucion),
    Comparendo: d.comparendo,
    Artículo_Y_Númeral: d.articuloNumeral,
    Fecha_comparendo: fechaALetras(d.fechaComparendo),
    lugar_del_comportamiento: d.lugar,
    Solicitado: d.solicitado,
    Cedula_solicitado: d.cedula,
    Dirección_Solicitado: d.direccion,
    Telefono_solicitado: d.telefono || 'NO APORTA',
    Solicitante: d.solicitante,
    Hechos_descripción_comportamientos: d.hechos,
    Tipo_de_multa: String(d.tipoMulta),
    valor_Salarios: d.liquidacion.smdlvLetras,
    Valor_de_la_multa_: d.liquidacion.valorBaseLetras,
  };

  if (d.caso === 'menor_representante_legal' || d.caso === 'establecimiento_comercio') {
    base.REPRESENTANTE_apoderado_ = d.representanteNombre ?? '';
    base.CEDULA_REPRESENTANTE_ = d.representanteCedula ?? '';
    base.Descripcion_de_la_conducta = d.descripcionConducta ?? '';
    base.Bien_Juridico = ''; // sin fuente de datos real hoy
    base.Medidas_correctivas = ''; // sin fuente de datos real hoy
    base.Apelo_SIno = d.apelo ? 'SI' : 'NO';
  }
  if (d.caso === 'establecimiento_comercio') {
    base['DIRECCIÓN_tarjeta_profesional'] = d.direccion;
  }

  return base;
}

/** Campos del registro sin los cuales no se puede generar el acta (no hay de dónde tomarlos). */
export function camposFaltantesActaFirmezaOficial(
  d: Pick<DatosActaFirmezaOficial, 'proceso' | 'comparendo' | 'solicitado' | 'cedula' | 'fechaComparendo' | 'hechos'>,
): string[] {
  const faltan: string[] = [];
  if (!d.proceso?.trim()) faltan.push('No. de queja/proceso');
  if (!d.comparendo?.trim()) faltan.push('Número de comparendo');
  if (!d.solicitado?.trim()) faltan.push('Presunto infractor');
  if (!d.cedula?.trim()) faltan.push('Cédula');
  if (!d.fechaComparendo?.trim()) faltan.push('Fecha del comparendo');
  if (!d.hechos?.trim()) faltan.push('Hechos');
  return faltan;
}

function paraNombreArchivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
}

/** "ACTA DE FIRMEZA. QUEJA {QUEJA}. {NOMBRE COMPLETO}.docx" — mismo patrón que el expediente. */
export function nombreArchivoActaFirmezaOficial(proceso: string, solicitado: string): string {
  return `ACTA DE FIRMEZA. QUEJA ${paraNombreArchivo(proceso)}. ${paraNombreArchivo(solicitado).toUpperCase()}.docx`;
}
