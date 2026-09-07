import dayjs from 'dayjs';

/**
 * Mapeo de datos hacia la plantilla oficial real del despacho
 * (`public/Plantillas/expediente-oficial.docx`) — carátula + constancia
 * secretarial de recepción + constancia de inasistencia en un solo archivo.
 *
 * La plantilla usa campos de combinación de correspondencia nativos de Word
 * (MERGEFIELD), no marcadores `{TAG}`: los nombres de campo de abajo son
 * EXACTAMENTE los que ya trae el archivo real (inspeccionado con
 * `word/document.xml`), no una convención inventada. El reemplazo lo hace
 * `mergeFieldDocx.ts` sobre el DOCX real — este módulo solo produce el mapa
 * `nombre de campo -> valor`, sin redactar texto ni tocar la plantilla.
 *
 * Regla del despacho: BASE DE DATOS + PLANTILLA = DOCUMENTO. Ningún campo se
 * infiere ni se completa con IA — lo que no existe en el registro queda en
 * blanco (nunca con el valor de ejemplo que trae cacheado el archivo).
 */

export interface DatosExpedienteOficial {
  // Del mismo registro seleccionado de BD. COMPARENDOS 2026 — no se vuelven a pedir.
  proceso: string; // No. de queja / expediente
  comparendo: string;
  articuloNumeral: string;
  solicitante: string; // CAI / procedencia
  solicitado: string; // presunto infractor (nombre completo)
  cedula: string;
  direccion: string;
  telefono: string;
  fechaComparendo: string; // ISO
  hechos: string;
  /** Fecha de recepción del comparendo en el archivo del despacho (constancia secretarial / carátula "FECHA INICIAL"). Por defecto, la del comparendo. */
  fechaRecepcion: string; // ISO
  /**
   * Fecha de la constancia de inasistencia (página 3) — confirmada
   * explícitamente por el inspector, nunca inventada. La UI debe sugerir un
   * valor derivado de una regla ya validada (término de firmeza) pero exigir
   * confirmación antes de generar.
   */
  fechaConstanciaInasistencia: string; // ISO
}

const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MESES_MAYUSCULAS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

/** "DOMINGO (06) DE SEPTIEMBRE DE 2026" — mismo estilo que ya usa la carátula/constancia secretarial de la plantilla. */
function fechaConDiaSemana(iso: string | undefined): string {
  if (!iso) return '';
  const d = dayjs(iso);
  if (!d.isValid()) return '';
  const dia = String(d.date()).padStart(2, '0');
  return `${DIAS_SEMANA[d.day()]} (${dia}) DE ${MESES_MAYUSCULAS[d.month()]} DE ${d.year()}`;
}

/** DD/MM/YYYY — formato numérico sin ambigüedad para la constancia de inasistencia. */
function ddmmyyyy(iso: string | undefined): string {
  if (!iso) return '';
  const d = dayjs(iso);
  return d.isValid() ? d.format('DD/MM/YYYY') : '';
}

/**
 * Construye el mapa `nombre de campo MERGEFIELD -> valor`. Los nombres
 * coinciden con los del archivo real; no inventan convención propia.
 */
export function mapearCamposExpedienteOficial(d: DatosExpedienteOficial): Record<string, string> {
  return {
    Proceso: d.proceso,
    Comparendo: d.comparendo,
    comparendo: d.comparendo, // el mismo campo aparece con minúscula inicial en la constancia de inasistencia
    Artículo_Y_Númeral: d.articuloNumeral,
    Solicitante: d.solicitante,
    Solicitado: d.solicitado,
    Cedula_solicitado: d.cedula,
    Dirección_Solicitado: d.direccion,
    Telefono_solicitado: d.telefono,
    Fecha_comparendo: ddmmyyyy(d.fechaComparendo),
    Hechos_descripción_comportamientos: d.hechos,
    fecha_de_recibido_: fechaConDiaSemana(d.fechaRecepcion),
    Acto_Administrativo_citación_GED: ddmmyyyy(d.fechaConstanciaInasistencia),
    // Sin dato estructurado real disponible hoy: quedan en blanco, nunca inventados.
    Policia_: '', // nombre del uniformado que impone el comparendo — no existe en el registro
    direccion_CAI: '', // dirección física del CAI/procedencia — no existe en el registro (distinto de "lugar del comportamiento")
    FECHA_AUDIENCIA_: '', // no aplica al trámite de firmeza (no hay audiencia)
  };
}

/** Campos del registro sin los cuales no se puede generar el expediente (no hay de dónde tomarlos). */
export function camposFaltantesExpedienteOficial(
  d: Pick<DatosExpedienteOficial, 'proceso' | 'comparendo' | 'solicitado' | 'cedula' | 'fechaComparendo' | 'hechos'>,
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

/** Sanea un valor para usarlo en un nombre de archivo (no altera el contenido del documento). */
function paraNombreArchivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes solo para el nombre de archivo
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
}

/** `EXPEDIENTE. QUEJA {QUEJA}. {NOMBRE COMPLETO}.docx` */
export function nombreArchivoExpedienteOficial(proceso: string, solicitado: string): string {
  return `EXPEDIENTE. QUEJA ${paraNombreArchivo(proceso)}. ${paraNombreArchivo(solicitado).toUpperCase()}.docx`;
}

/** Referencia para el reporte al inspector: campos de la carátula que la plantilla deja en blanco por diseño (no son MERGEFIELD) o que hoy no tienen fuente de datos real. */
export const CAMPOS_SIN_FUENTE_HOY = [
  'AÑO (carátula) — es texto fijo "2026" en la plantilla, no un campo de combinación; en casos de otro año debe corregirse a mano en el Word generado.',
  'Policia_ (nombre del uniformado que impone el comparendo) — no existe en el registro.',
  'direccion_CAI (dirección física del CAI/procedencia) — no existe en el registro.',
  'CÓDIGO/NOMBRE DE SERIE, CÓDIGO/NOMBRE DE SUBSERIE, NÚMERO DE FOLIOS/CARPETA/CAJA, FECHA FINAL, ISLA, ENTREPAÑO, ESTANTE, CARA — son líneas en blanco en la plantilla (no MERGEFIELD); quedan intactas.',
] as const;
