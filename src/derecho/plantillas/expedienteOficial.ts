import dayjs from 'dayjs';

/**
 * Mapeo de datos hacia la plantilla oficial "EXPEDIENTE PLANTILLA.docx"
 * (carátula + constancia secretarial + constancia de inasistencia).
 *
 * A diferencia de `expedientePrevio.ts` (que sintetiza un `DocumentoLegal` y
 * lo renderiza con el motor genérico de PDF/.docx), este módulo NO redacta
 * texto: solo produce un mapa `tag -> valor` para reemplazar en el DOCX real
 * del despacho vía `docx` `patchDocument` (ver `expedienteOficialDocx.ts`),
 * preservando membrete, logos, tablas y estilos originales del archivo.
 *
 * Regla del despacho: BASE DE DATOS + PLANTILLA = DOCUMENTO. Ningún campo se
 * infiere ni se completa con IA — lo que no existe en el registro queda en
 * blanco.
 */

export type GeneroCiudadano = 'masculino' | 'femenino';

const TRATAMIENTO: Record<GeneroCiudadano, { tratamiento: string; presunto: string }> = {
  masculino: { tratamiento: 'señor', presunto: 'presunto' },
  femenino: { tratamiento: 'señora', presunto: 'presunta' },
};

/**
 * Campos de identificación de archivo (serie/subserie/ubicación física).
 * Ninguno existe hoy como dato estructurado en la BD de comparendos — se
 * dejan en blanco salvo que el llamador aporte un valor real capturado en
 * otro sistema. Nunca se completan por inferencia.
 */
export interface CamposArchivoExpediente {
  codigoSerie?: string;
  nombreSerie?: string;
  codigoSubserie?: string;
  nombreSubserie?: string;
  numeroFolios?: string;
  numeroCarpeta?: string;
  numeroCaja?: string;
  fechaFinal?: string; // ISO
  isla?: string;
  entrepano?: string;
  estante?: string;
  cara?: string;
}

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
  /** Fecha de recepción del comparendo en el archivo del despacho (constancia secretarial). Por defecto, la del comparendo. */
  fechaRecepcion: string; // ISO
  /**
   * Confirmada explícitamente por el inspector — nunca inventada. La UI debe
   * sugerir un valor derivado de una regla ya validada (término de firmeza)
   * pero exigir confirmación antes de generar.
   */
  fechaConstanciaInasistencia: string; // ISO
  /** Confirmado explícitamente por el inspector; nunca inferido del nombre. */
  genero: GeneroCiudadano;
  archivo?: CamposArchivoExpediente;
}

function ddmmyyyy(iso: string | undefined): string {
  if (!iso) return '';
  const d = dayjs(iso);
  return d.isValid() ? d.format('DD/MM/YYYY') : '';
}

function anioDe(iso: string | undefined): string {
  if (!iso) return '';
  const d = dayjs(iso);
  return d.isValid() ? String(d.year()) : '';
}

/**
 * Construye el mapa `tag -> valor` para `patchDocument`. Los nombres de tag
 * son la convención propuesta (SCREAMING_SNAKE_CASE entre llaves, p. ej.
 * `{PRESUNTO_INFRACTOR}`) — deben verificarse y ajustarse contra los tags
 * reales una vez cargada `EXPEDIENTE PLANTILLA.docx` en
 * `public/plantillas/expediente-oficial.docx`.
 */
export function mapearCamposExpedienteOficial(d: DatosExpedienteOficial): Record<string, string> {
  const { tratamiento, presunto } = TRATAMIENTO[d.genero];
  const archivo = d.archivo ?? {};

  return {
    // Carátula
    EXPEDIENTE_NO: d.proceso,
    QUEJA: d.proceso,
    ANIO: anioDe(d.fechaComparendo),
    ARTICULO_NUMERAL: d.articuloNumeral,
    QUEJOSO_PROCEDENCIA_CAI: d.solicitante,
    PRESUNTO_INFRACTOR: d.solicitado,
    CEDULA: d.cedula,
    DIRECCION: d.direccion,
    TELEFONO: d.telefono,
    FECHA_INICIAL: ddmmyyyy(d.fechaComparendo),
    NUMERO_COMPARENDO: d.comparendo,
    FECHA_COMPARENDO: ddmmyyyy(d.fechaComparendo),
    HECHOS: d.hechos,
    TRATAMIENTO: tratamiento,
    TRATAMIENTO_PRESUNTO: presunto,

    // Constancia secretarial (página 2)
    CS_FECHA: ddmmyyyy(d.fechaRecepcion),
    CS_QUEJA: d.proceso,
    CS_NOMBRE: d.solicitado,
    CS_DOCUMENTO: d.cedula,
    CS_DIRECCION: d.direccion,
    CS_TELEFONO: d.telefono,
    CS_NUMERO_COMPARENDO: d.comparendo,
    CS_FECHA_COMPARENDO: ddmmyyyy(d.fechaComparendo),
    CS_CAI_PROCEDENCIA: d.solicitante,
    CS_ARTICULO: d.articuloNumeral,
    CS_HECHOS: d.hechos,

    // Constancia de inasistencia (página 3)
    CI_FECHA_CONSTANCIA: ddmmyyyy(d.fechaConstanciaInasistencia),
    CI_NOMBRE: d.solicitado,
    CI_CEDULA: d.cedula,
    CI_NUMERO_COMPARENDO: d.comparendo,
    CI_FECHA_COMPARENDO: ddmmyyyy(d.fechaComparendo),

    // Identificación de archivo — en blanco salvo dato estructurado real.
    CODIGO_SERIE: archivo.codigoSerie ?? '',
    NOMBRE_SERIE: archivo.nombreSerie ?? '',
    CODIGO_SUBSERIE: archivo.codigoSubserie ?? '',
    NOMBRE_SUBSERIE: archivo.nombreSubserie ?? '',
    NUMERO_FOLIOS: archivo.numeroFolios ?? '',
    NUMERO_CARPETA: archivo.numeroCarpeta ?? '',
    NUMERO_CAJA: archivo.numeroCaja ?? '',
    FECHA_FINAL: ddmmyyyy(archivo.fechaFinal),
    ISLA: archivo.isla ?? '',
    ENTREPANO: archivo.entrepano ?? '',
    ESTANTE: archivo.estante ?? '',
    CARA: archivo.cara ?? '',
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
