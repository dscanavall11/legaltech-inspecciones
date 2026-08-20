/**
 * Qué formatos admite un expediente. Uno solo, compartido: había seis listas
 * `accept` distintas para el mismo archivo —la del arranque no aceptaba ni un
 * .txt, la de pruebas sí aceptaba vídeo— y el inspector no tenía forma de saber
 * cuál regía en cada sitio.
 *
 * La lista es la de legaltech-tools: Tika detecta el tipo por contenido y
 * extrae texto de todos estos. Lo que no puede leer entra igual al expediente y
 * se declara como ilegible en el markdown, que es mejor que rechazarlo en la
 * puerta: un escaneo sin OCR sigue siendo parte del proceso.
 */
export const FORMATOS_EXPEDIENTE = [
  // Documentos
  '.pdf',
  '.doc',
  '.docx',
  '.odt',
  '.rtf',
  '.txt',
  '.md',
  // Hojas de cálculo — los reportes del RNMC salen en xlsx
  '.xls',
  '.xlsx',
  '.csv',
  // Imágenes y escaneos; .tif/.tiff es lo que entrega media escáner de despacho
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.tif',
  '.tiff',
  '.heic',
  // Correo: la citación y la contestación llegan así
  '.eml',
  '.msg',
  // Audio y vídeo de audiencia
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.mp4',
] as const;

/** Para el atributo `accept` de un `<input type="file">`. */
export const ACEPTA_EXPEDIENTE = FORMATOS_EXPEDIENTE.join(',');

/**
 * Tope de tamano por archivo. Es el mismo que declaran el BFF y
 * legaltech-tools: si el cliente no lo comprueba, el rechazo llega como un 413
 * sin cuerpo y el inspector solo ve "no se pudo subir".
 */
export const MAX_MB_EXPEDIENTE = 50;

export const excedeElTope = (bytes: number) => bytes > MAX_MB_EXPEDIENTE * 1024 * 1024;

export const avisoDeTamano = (nombre: string, bytes: number) =>
  `«${nombre}» pesa ${(bytes / 1024 / 1024).toFixed(1)} MB y el tope por archivo es ${MAX_MB_EXPEDIENTE} MB. Divida el documento o reduzca la resolucion del escaneo.`;

const extensionDe = (nombre: string) => {
  const punto = nombre.lastIndexOf('.');
  return punto < 0 ? '' : nombre.slice(punto).toLowerCase();
};

/**
 * Si el expediente admite este archivo. Se compara en minúscula porque un
 * escáner de Windows entrega `ACTA.PDF` y `accept=".pdf"` no siempre lo salva.
 */
export const esFormatoDeExpediente = (nombre: string): boolean =>
  (FORMATOS_EXPEDIENTE as readonly string[]).includes(extensionDe(nombre));

/**
 * Reparte una selección entre lo que entra y lo que no. Devolver los
 * rechazados —y no solo los aceptados— es el punto: `accept` los descartaba en
 * silencio y el inspector veía que "no se deja cargar" sin que nada se lo
 * dijera.
 */
export function separarPorFormato<T extends { name: string; size?: number }>(
  archivos: readonly T[],
): { admitidos: T[]; rechazados: T[]; pesados: T[] } {
  const porFormato = (a: T) => esFormatoDeExpediente(a.name);
  const admitidosPorFormato = archivos.filter(porFormato);
  return {
    admitidos: admitidosPorFormato.filter((a) => !excedeElTope(a.size ?? 0)),
    rechazados: archivos.filter((a) => !porFormato(a)),
    pesados: admitidosPorFormato.filter((a) => excedeElTope(a.size ?? 0)),
  };
}

/** El aviso que se le da al inspector cuando algo quedó fuera. */
export const avisoDeRechazo = (rechazados: readonly { name: string }[]): string =>
  `No se pudo incorporar ${rechazados.map((a) => a.name).join(', ')}: el expediente no admite ese formato. Formatos válidos: ${FORMATOS_EXPEDIENTE.join(' ')}.`;
