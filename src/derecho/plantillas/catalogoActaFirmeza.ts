/**
 * Catálogo determinístico de selección de plantilla oficial para el Acta de
 * Firmeza (`public/Plantillas/Actas de firmeza/`, 13 archivos .docx reales
 * del despacho, inspeccionados uno por uno).
 *
 * Regla dura: la selección depende SOLO de datos que el inspector confirma
 * explícitamente (caso especial, género, tipo de multa, causal de
 * incremento) — nunca de IA ni de inferencia. Si la combinación no tiene una
 * plantilla real que la cubra, se devuelve `null` y la pantalla debe exigir
 * selección manual entre `PLANTILLAS_DISPONIBLES`, nunca elegir "la más
 * parecida" por su cuenta.
 */

export type GeneroCiudadano = 'masculino' | 'femenino';
export type CasoEspecialActa =
  | 'normal' // persona natural, ciudadano común
  | 'extranjero' // identificado con cédula de extranjería
  | 'menor_representante_legal' // infractor menor de edad, representado por su representante legal
  | 'establecimiento_comercio'; // infractor es un establecimiento de comercio

export type TipoMultaActa = 1 | 2 | 3 | 4;
export type CausalActa =
  | 'ninguna'
  | 'reiteracion_dentro_del_anio' // 75%
  | 'reiteracion_despues_del_anio' // 50%
  | 'moroso_bdme'; // 50% por literal i) — BDME

export interface SeleccionPlantillaActa {
  caso: CasoEspecialActa;
  genero: GeneroCiudadano;
  tipoMulta: TipoMultaActa;
  causal: CausalActa;
}

interface EntradaCatalogo {
  archivo: string;
  caso: CasoEspecialActa;
  genero: GeneroCiudadano | 'no_aplica';
  tiposMulta: TipoMultaActa[];
  causal: CausalActa;
  /** false → no se selecciona automáticamente aunque calce por criterios; solo aparece en el listado para selección manual. */
  usoAutomatico: boolean;
  advertencias?: string[];
}

const DIR = 'Actas de firmeza';

/**
 * Las 13 plantillas reales, tal como están en disco — nombre de archivo
 * exacto, sin normalizar. Fuente: inspección directa del texto y los campos
 * MERGEFIELD de cada .docx (ver Issue/PR para el detalle completo).
 */
export const CATALOGO_ACTA_FIRMEZA: readonly EntradaCatalogo[] = [
  {
    archivo: '1. FIRMEZA M. SIN REICIDENCIA GENERAL.docx',
    caso: 'normal',
    genero: 'masculino',
    tiposMulta: [2, 3, 4],
    causal: 'ninguna',
    usoAutomatico: true,
  },
  {
    archivo: '1. ACTA DE FIRMEZA 2026. M..docx',
    caso: 'normal',
    genero: 'masculino',
    tiposMulta: [2, 3, 4],
    causal: 'ninguna',
    usoAutomatico: false,
    advertencias: [
      'Duplicada de "1. FIRMEZA M. SIN REICIDENCIA GENERAL.docx": le falta el párrafo sobre el Boletín de Deudores Morosos del Estado (BDME) que sí trae esa versión. Se mantiene solo como opción manual; el catálogo no la selecciona automáticamente.',
    ],
  },
  {
    archivo: '1. ACTA DE FIRMEZA 2026. F.docx',
    caso: 'normal',
    genero: 'femenino',
    tiposMulta: [2, 3, 4],
    causal: 'ninguna',
    usoAutomatico: true,
    advertencias: [
      'Es la única plantilla femenina "sin reincidencia" disponible y le falta el párrafo sobre el Boletín de Deudores Morosos del Estado (BDME) que sí trae la versión masculina canónica. Contenido incompleto pendiente de corrección por el despacho — no se completa aquí por código (el contenido jurídico vive en la plantilla, no en el código).',
    ],
  },
  {
    archivo: '2. FIRMEZA MULTA 2. REINCIDENCIA 50% M..docx',
    caso: 'normal',
    genero: 'masculino',
    tiposMulta: [2],
    causal: 'reiteracion_despues_del_anio',
    usoAutomatico: true,
  },
  {
    archivo: '2. FIRMEZA MULTA 3. REINCIDENCIA 50% M..docx',
    caso: 'normal',
    genero: 'masculino',
    tiposMulta: [3],
    causal: 'reiteracion_despues_del_anio',
    usoAutomatico: true,
  },
  {
    archivo: '2. FIRMEZA MULTA 4. REINCIDENCIA 50% M..docx',
    caso: 'normal',
    genero: 'masculino',
    tiposMulta: [4],
    causal: 'reiteracion_despues_del_anio',
    usoAutomatico: true,
  },
  {
    archivo: '3. FIRMEZA MULTA 2. REINCIDENCIA 75% M..docx',
    caso: 'normal',
    genero: 'masculino',
    tiposMulta: [2],
    causal: 'reiteracion_dentro_del_anio',
    usoAutomatico: true,
  },
  {
    archivo: '3. FIRMEZA MULTA 3. REINCIDENCIA 75% M..docx',
    caso: 'normal',
    genero: 'masculino',
    tiposMulta: [3],
    causal: 'reiteracion_dentro_del_anio',
    usoAutomatico: true,
  },
  {
    archivo: '3. FIRMEZA MULTA 4. REINCIDENCIA 75% M..docx',
    caso: 'normal',
    genero: 'masculino',
    tiposMulta: [4],
    causal: 'reiteracion_dentro_del_anio',
    usoAutomatico: true,
  },
  {
    archivo: '1. FIRMEZA M. SIN R. EXTRANJERO.docx',
    caso: 'extranjero',
    genero: 'no_aplica',
    tiposMulta: [2, 3, 4],
    causal: 'ninguna',
    usoAutomatico: true,
    advertencias: [
      'La redacción de la plantilla mezcla fórmulas de tratamiento ("la señora" / "ciudadana extranjera" junto con "identificado", en concordancia masculina) — inconsistencia propia del archivo original del despacho. Revisar manualmente la redacción de género antes de notificar; no se corrige por código.',
    ],
  },
  {
    archivo: '1. REPRESENTANTE LEGAL. MULTA TIPO 2..docx',
    caso: 'menor_representante_legal',
    genero: 'no_aplica',
    tiposMulta: [2],
    causal: 'ninguna',
    usoAutomatico: true,
    advertencias: [
      'Diseñada para infractor menor de edad representado por su representante legal ("el/la joven"). El despacho la ha reutilizado en el pasado para casos de establecimientos de comercio reescribiendo el campo REPRESENTANTE_apoderado_ con la razón social — confirmar con el inspector cuál es el caso real antes de generar.',
    ],
  },
  {
    archivo: '1. REPRESENTANTE LEGAL. MULTA TIPO 4..docx',
    caso: 'menor_representante_legal',
    genero: 'no_aplica',
    tiposMulta: [4],
    causal: 'ninguna',
    usoAutomatico: true,
    advertencias: [
      'Diseñada para infractor menor de edad representado por su representante legal ("el/la joven"). El despacho la ha reutilizado en el pasado para casos de establecimientos de comercio reescribiendo el campo REPRESENTANTE_apoderado_ con la razón social — confirmar con el inspector cuál es el caso real antes de generar.',
    ],
  },
  {
    archivo: '4. MULTA TIPO 4. - ESTABLECIMIENTOS DE COMERCIO.docx',
    caso: 'establecimiento_comercio',
    genero: 'no_aplica',
    tiposMulta: [4],
    causal: 'ninguna',
    usoAutomatico: true,
  },
] as const;

/** Todas las plantillas, incluidas las que no se seleccionan automáticamente — para el selector manual. */
export const PLANTILLAS_DISPONIBLES = CATALOGO_ACTA_FIRMEZA;

export interface ResultadoSeleccionPlantilla {
  archivo: string;
  rutaRelativa: string; // relativa a public/Plantillas/
  advertencias: string[];
}

/**
 * Selección determinística: exactamente los criterios explícitos entran, y
 * solo se devuelve una plantilla marcada `usoAutomatico`. Ninguna heurística
 * de "la más parecida" — si no hay calce exacto, `null`.
 */
export function seleccionarPlantillaActaFirmeza(seleccion: SeleccionPlantillaActa): ResultadoSeleccionPlantilla | null {
  const candidata = CATALOGO_ACTA_FIRMEZA.find(
    (e) =>
      e.usoAutomatico &&
      e.caso === seleccion.caso &&
      e.causal === seleccion.causal &&
      e.tiposMulta.includes(seleccion.tipoMulta) &&
      (e.genero === 'no_aplica' || e.genero === seleccion.genero),
  );
  if (!candidata) return null;
  return {
    archivo: candidata.archivo,
    rutaRelativa: `${DIR}/${candidata.archivo}`,
    advertencias: candidata.advertencias ?? [],
  };
}

export function rutaPlantillaActaFirmeza(archivo: string): string {
  return `${DIR}/${archivo}`;
}
